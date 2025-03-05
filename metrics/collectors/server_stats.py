

"""
Server Stats Collector for VLC Streaming Metrics
Monitors server resources including CPU, memory, disk and system load
"""

import os
import time
import json
import socket
import psutil
import requests
import platform
from datetime import datetime

class ServerStatsCollector:
    def __init__(self, api_url=None, interval=5):
        """
        Initialize the server stats collector.
        
        Args:
            api_url (str): URL to send metrics to (optional)
            interval (int): Collection interval in seconds
        """
        self.api_url = api_url or os.environ.get('METRICS_API_URL', 'http://metrics-api:5000/api/metrics')
        self.interval = interval
        self.node_id = socket.gethostname()
        self.log_file = os.environ.get('SERVER_STATS_LOG', '/opt/vlc-server/logs/server_metrics.json')
        
        
        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
    
    def collect_system_info(self):
        """
        Collect basic system information.
        
        Returns:
            dict: System information
        """
        try:
            system_info = {
                'hostname': self.node_id,
                'platform': platform.system(),
                'platform_release': platform.release(),
                'platform_version': platform.version(),
                'architecture': platform.machine(),
                'processor': platform.processor(),
                'cpu_cores': {
                    'physical': psutil.cpu_count(logical=False),
                    'logical': psutil.cpu_count(logical=True)
                },
                'python_version': platform.python_version()
            }
            
            
            if os.path.exists('/.dockerenv'):
                system_info['is_docker'] = True
            else:
                system_info['is_docker'] = False
            
            return system_info
        except Exception as e:
            print(f"Error collecting system info: {e}")
            return {}
    
    def collect_cpu_stats(self):
        """
        Collect CPU usage statistics.
        
        Returns:
            dict: CPU statistics
        """
        try:
            cpu_stats = {
                'percent': psutil.cpu_percent(interval=1),
                'per_cpu': psutil.cpu_percent(interval=1, percpu=True),
                'load_avg': os.getloadavg() if hasattr(os, 'getloadavg') else None
            }
            
           
            try:
                cpu_freq = psutil.cpu_freq()
                if cpu_freq:
                    cpu_stats['freq'] = {
                        'current': cpu_freq.current,
                        'min': cpu_freq.min,
                        'max': cpu_freq.max
                    }
            except Exception:
                pass
            
            
            try:
                cpu_times = psutil.cpu_times_percent()
                cpu_stats['times'] = {
                    'user': cpu_times.user,
                    'system': cpu_times.system,
                    'idle': cpu_times.idle,
                    'iowait': cpu_times.iowait if hasattr(cpu_times, 'iowait') else None
                }
            except Exception:
                pass
            
            return cpu_stats
        except Exception as e:
            print(f"Error collecting CPU stats: {e}")
            return {}
    
    def collect_memory_stats(self):
        """
        Collect memory usage statistics.
        
        Returns:
            dict: Memory statistics
        """
        try:
            
            vm = psutil.virtual_memory()
            memory_stats = {
                'virtual': {
                    'total': vm.total,
                    'available': vm.available,
                    'used': vm.used,
                    'free': vm.free,
                    'percent': vm.percent,
                    'total_gb': vm.total / (1024 ** 3),
                    'available_gb': vm.available / (1024 ** 3),
                    'used_gb': vm.used / (1024 ** 3),
                    'free_gb': vm.free / (1024 ** 3)
                }
            }
            
            
            swap = psutil.swap_memory()
            memory_stats['swap'] = {
                'total': swap.total,
                'used': swap.used,
                'free': swap.free,
                'percent': swap.percent,
                'total_gb': swap.total / (1024 ** 3),
                'used_gb': swap.used / (1024 ** 3),
                'free_gb': swap.free / (1024 ** 3)
            }
            
            return memory_stats
        except Exception as e:
            print(f"Error collecting memory stats: {e}")
            return {}
    
    def collect_disk_stats(self):
        """
        Collect disk usage statistics.
        
        Returns:
            dict: Disk statistics
        """
        try:
           
            disk_paths = [
                '/',  
                '/media/storage'  
            ]
            
            disk_stats = {'filesystems': {}}
            
            for path in disk_paths:
                if os.path.exists(path):
                    usage = psutil.disk_usage(path)
                    disk_stats['filesystems'][path] = {
                        'total': usage.total,
                        'used': usage.used,
                        'free': usage.free,
                        'percent': usage.percent,
                        'total_gb': usage.total / (1024 ** 3),
                        'used_gb': usage.used / (1024 ** 3),
                        'free_gb': usage.free / (1024 ** 3)
                    }
            
            
            try:
                io_counters = psutil.disk_io_counters()
                disk_stats['io'] = {
                    'read_count': io_counters.read_count,
                    'write_count': io_counters.write_count,
                    'read_bytes': io_counters.read_bytes,
                    'write_bytes': io_counters.write_bytes,
                    'read_time': io_counters.read_time,
                    'write_time': io_counters.write_time
                }
            except Exception:
                pass
            
            return disk_stats
        except Exception as e:
            print(f"Error collecting disk stats: {e}")
            return {}
    
    def collect_process_stats(self):
        """
        Collect statistics for VLC processes.
        
        Returns:
            dict: Process statistics
        """
        try:
            vlc_processes = []
            
            for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'cpu_percent', 'memory_percent', 'create_time']):
                try:
                    
                    if 'vlc' in proc.info['name'].lower() or any('vlc' in cmd.lower() for cmd in proc.info['cmdline'] if cmd):
                        
                        proc_info = proc.as_dict(attrs=[
                            'pid', 'name', 'cmdline', 'cpu_percent', 
                            'memory_percent', 'create_time', 'status'
                        ])
                        
                        
                        proc_info['uptime_seconds'] = time.time() - proc_info['create_time']
                        
                        
                        mem_info = proc.memory_info()
                        proc_info['memory'] = {
                            'rss': mem_info.rss,  
                            'vms': mem_info.vms,  
                            'rss_mb': mem_info.rss / (1024 * 1024),
                            'vms_mb': mem_info.vms / (1024 * 1024)
                        }
                        
                        
                        try:
                            connections = proc.connections()
                            proc_info['connections'] = len(connections)
                            proc_info['connection_types'] = {
                                'established': len([c for c in connections if c.status == 'ESTABLISHED']),
                                'listen': len([c for c in connections if c.status == 'LISTEN']),
                                'time_wait': len([c for c in connections if c.status == 'TIME_WAIT'])
                            }
                        except Exception:
                            pass
                        
                        vlc_processes.append(proc_info)
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
            
            
            process_stats = {
                'vlc_process_count': len(vlc_processes),
                'vlc_processes': vlc_processes
            }
            
            return process_stats
        except Exception as e:
            print(f"Error collecting process stats: {e}")
            return {}
    
    def collect_and_send_metrics(self):
        """
        Collect server metrics and send to API.
        """
        try:
            
            if not hasattr(self, 'system_info'):
                self.system_info = self.collect_system_info()
            
            
            cpu_stats = self.collect_cpu_stats()
            memory_stats = self.collect_memory_stats()
            disk_stats = self.collect_disk_stats()
            process_stats = self.collect_process_stats()
            
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'node_id': self.node_id,
                'system_info': self.system_info,
                'cpu': cpu_stats,
                'memory': memory_stats,
                'disk': disk_stats,
                'processes': process_stats
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
                        print(f"Server metrics sent successfully at {datetime.now().isoformat()}")
                    else:
                        print(f"Error sending server metrics: {response.status_code} - {response.text}")
                except Exception as e:
                    print(f"Error sending server metrics: {e}")
            
            
            with open(self.log_file, 'a') as f:
                f.write(json.dumps(metrics) + '\n')
            
            return metrics
        except Exception as e:
            print(f"Error in collect_and_send_metrics: {e}")
            return None
    
    def run(self):
        """
        Run the server stats collector continuously.
        """
        print(f"Starting server stats collector with interval {self.interval} seconds")
        
        while True:
            try:
                self.collect_and_send_metrics()
            except Exception as e:
                print(f"Error in server stats collector: {e}")
            
            time.sleep(self.interval)

if __name__ == "__main__":
    interval = int(os.environ.get('METRICS_INTERVAL', '5'))
    api_url = os.environ.get('METRICS_API_URL', 'http://metrics-api:5000/api/metrics/server')
    
    collector = ServerStatsCollector(api_url=api_url, interval=interval)
    collector.run()