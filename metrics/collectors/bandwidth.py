

"""
Bandwidth Collector for VLC Streaming Metrics
Collects and reports network bandwidth usage statistics
"""

import os
import time
import json
import socket
import psutil
import requests
from datetime import datetime

class BandwidthCollector:
    def __init__(self, api_url=None, interval=5):
        """
        Initialize the bandwidth collector.
        
        Args:
            api_url (str): URL to send metrics to (optional)
            interval (int): Collection interval in seconds
        """
        self.api_url = api_url or os.environ.get('METRICS_API_URL', 'http://metrics-api:5000/api/metrics')
        self.interval = interval
        self.node_id = socket.gethostname()
        self.previous_stats = None
        self.log_file = os.environ.get('LOG_FILE', '/opt/vlc-server/logs/bandwidth_metrics.json')
        
        
        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
    
    def collect_bandwidth_stats(self):
        """
        Collect current network bandwidth statistics.
        
        Returns:
            dict: Bandwidth statistics
        """
        try:
            current_stats = psutil.net_io_counters()
            timestamp = datetime.now()
            
            stats = {
                'bytes_sent': current_stats.bytes_sent,
                'bytes_recv': current_stats.bytes_recv,
                'packets_sent': current_stats.packets_sent,
                'packets_recv': current_stats.packets_recv,
                'errin': current_stats.errin,
                'errout': current_stats.errout,
                'dropin': current_stats.dropin,
                'dropout': current_stats.dropout
            }
            
           
            if self.previous_stats:
                time_diff = (timestamp - self.previous_stats['timestamp']).total_seconds()
                if time_diff > 0:
                    stats['send_rate_bytes_per_sec'] = (current_stats.bytes_sent - self.previous_stats['bytes_sent']) / time_diff
                    stats['recv_rate_bytes_per_sec'] = (current_stats.bytes_recv - self.previous_stats['bytes_recv']) / time_diff
                    stats['send_rate_mbps'] = stats['send_rate_bytes_per_sec'] * 8 / 1024 / 1024
                    stats['recv_rate_mbps'] = stats['recv_rate_bytes_per_sec'] * 8 / 1024 / 1024
            
            
            self.previous_stats = {
                'timestamp': timestamp,
                'bytes_sent': current_stats.bytes_sent,
                'bytes_recv': current_stats.bytes_recv
            }
            
            return stats
        except Exception as e:
            print(f"Error collecting bandwidth stats: {e}")
            return {}
    
    def collect_interface_stats(self):
        """
        Collect bandwidth stats per network interface.
        
        Returns:
            dict: Per-interface bandwidth statistics
        """
        try:
            interfaces = {}
            io_counters = psutil.net_io_counters(pernic=True)
            
            for interface, counters in io_counters.items():
                interfaces[interface] = {
                    'bytes_sent': counters.bytes_sent,
                    'bytes_recv': counters.bytes_recv,
                    'packets_sent': counters.packets_sent,
                    'packets_recv': counters.packets_recv,
                    'errin': counters.errin,
                    'errout': counters.errout,
                    'dropin': counters.dropin,
                    'dropout': counters.dropout
                }
            
            return interfaces
        except Exception as e:
            print(f"Error collecting interface stats: {e}")
            return {}
    
    def collect_connection_stats(self):
        """
        Collect connection statistics.
        
        Returns:
            dict: Connection statistics
        """
        try:
            connections = psutil.net_connections(kind='inet')
            
            stats = {
                'total_connections': len(connections),
                'established': len([c for c in connections if c.status == 'ESTABLISHED']),
                'listening': len([c for c in connections if c.status == 'LISTEN']),
                'closing': len([c for c in connections if c.status in ('CLOSE_WAIT', 'TIME_WAIT', 'CLOSING')]),
                'by_port': {}
            }
            
            
            for conn in connections:
                if conn.laddr and len(conn.laddr) >= 2:
                    port = conn.laddr[1]
                    if port not in stats['by_port']:
                        stats['by_port'][port] = 0
                    stats['by_port'][port] += 1
            
            return stats
        except Exception as e:
            print(f"Error collecting connection stats: {e}")
            return {}
    
    def collect_and_send_metrics(self):
        """
        Collect bandwidth metrics and send to API.
        """
        try:
            bandwidth_stats = self.collect_bandwidth_stats()
            interface_stats = self.collect_interface_stats()
            connection_stats = self.collect_connection_stats()
            
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'node_id': self.node_id,
                'bandwidth': bandwidth_stats,
                'interfaces': interface_stats,
                'connections': connection_stats
            }
            
            
            if self.api_url:
                try:
                    response = requests.post(
                        self.api_url,
                        json=metrics,
                        headers={'Content-Type': 'application/json'},
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        print(f"Bandwidth metrics sent successfully at {datetime.now().isoformat()}")
                    else:
                        print(f"Error sending bandwidth metrics: {response.status_code} - {response.text}")
                except Exception as e:
                    print(f"Error sending bandwidth metrics: {e}")
            
            
            with open(self.log_file, 'a') as f:
                f.write(json.dumps(metrics) + '\n')
            
            return metrics
        except Exception as e:
            print(f"Error in collect_and_send_metrics: {e}")
            return None
    
    def run(self):
        """
        Run the bandwidth collector continuously.
        """
        print(f"Starting bandwidth collector with interval {self.interval} seconds")
        
        while True:
            try:
                self.collect_and_send_metrics()
            except Exception as e:
                print(f"Error in bandwidth collector: {e}")
            
            time.sleep(self.interval)

if __name__ == "__main__":
    interval = int(os.environ.get('METRICS_INTERVAL', '5'))
    api_url = os.environ.get('METRICS_API_URL', 'http://metrics-api:5000/api/metrics/bandwidth')
    
    collector = BandwidthCollector(api_url=api_url, interval=interval)
    collector.run()