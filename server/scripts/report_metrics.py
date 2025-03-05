

import os
import time
import json
import socket
import psutil
import requests
from datetime import datetime
import subprocess

METRICS_INTERVAL = int(os.environ.get('METRICS_INTERVAL', '5'))
METRICS_API_URL = os.environ.get('METRICS_API_URL', 'http://metrics-api:5000/api/metrics')
LOG_FILE = '/opt/vlc-server/logs/vlc_streaming.log'
NODE_ID = socket.gethostname()

def get_vlc_connections():
    try:
        http_port = int(os.environ.get('HTTP_PORT', '8080'))
        rtsp_port = int(os.environ.get('RTSP_PORT', '8554'))
        
        http_connections = 0
        rtsp_connections = 0
        
        connections = psutil.net_connections(kind='inet')
        for conn in connections:
            if conn.laddr.port == http_port and conn.status == 'ESTABLISHED':
                http_connections += 1
            elif conn.laddr.port == rtsp_port and conn.status == 'ESTABLISHED':
                rtsp_connections += 1
        
        return {
            'http_connections': http_connections,
            'rtsp_connections': rtsp_connections,
            'total_connections': http_connections + rtsp_connections
        }
    except Exception as e:
        print(f"Error getting VLC connections: {e}")
        return {'http_connections': 0, 'rtsp_connections': 0, 'total_connections': 0}

def get_network_stats():
    try:
        net_io = psutil.net_io_counters()
        return {
            'bytes_sent': net_io.bytes_sent,
            'bytes_recv': net_io.bytes_recv,
            'packets_sent': net_io.packets_sent,
            'packets_recv': net_io.packets_recv,
            'errin': net_io.errin,
            'errout': net_io.errout,
            'dropin': net_io.dropin,
            'dropout': net_io.dropout
        }
    except Exception as e:
        print(f"Error getting network stats: {e}")
        return {}

def get_cpu_memory_stats():
    try:
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'memory_used_mb': psutil.virtual_memory().used / (1024 * 1024)
        }
    except Exception as e:
        print(f"Error getting CPU/memory stats: {e}")
        return {}

def get_current_streams():
    try:
        if not os.path.exists(LOG_FILE):
            return {'active_streams': 0, 'stream_details': []}
        
        cmd = f"grep 'starting to stream' {LOG_FILE} | tail -10"
        result = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        streams = [line for line in result.stdout.split('\n') if line.strip()]
        
        return {
            'active_streams': len(streams),
            'recent_streams': streams[:5]
        }
    except Exception as e:
        print(f"Error getting current streams: {e}")
        return {'active_streams': 0, 'stream_details': []}

def collect_and_send_metrics():
    try:
        connections = get_vlc_connections()
        network = get_network_stats()
        system = get_cpu_memory_stats()
        streams = get_current_streams()
        
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'node_id': NODE_ID,
            'connections': connections,
            'network': network,
            'system': system,
            'streams': streams
        }
        
        response = requests.post(
            METRICS_API_URL,
            json=metrics,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        if response.status_code == 200:
            print(f"Metrics sent successfully: {response.text}")
        else:
            print(f"Error sending metrics: {response.status_code} - {response.text}")
            
        metrics_file = f"/opt/vlc-server/logs/metrics_{datetime.now().strftime('%Y%m%d')}.json"
        with open(metrics_file, 'a') as f:
            f.write(json.dumps(metrics) + '\n')
            
    except Exception as e:
        print(f"Error in collect_and_send_metrics: {e}")

def main():
    print(f"Starting metrics collection every {METRICS_INTERVAL} seconds")
    
    while True:
        try:
            collect_and_send_metrics()
        except Exception as e:
            print(f"Error in metrics collection: {e}")
        
        time.sleep(METRICS_INTERVAL)

if __name__ == "__main__":
    main()