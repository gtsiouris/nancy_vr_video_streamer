

"""
Quality Collector for VLC Streaming Metrics
Monitors and reports on streaming quality metrics
"""

import os
import time
import json
import socket
import subprocess
import requests
import re
from datetime import datetime

class QualityCollector:
    def __init__(self, api_url=None, interval=10):
        """
        Initialize the quality collector.
        
        Args:
            api_url (str): URL to send metrics to (optional)
            interval (int): Collection interval in seconds
        """
        self.api_url = api_url or os.environ.get('METRICS_API_URL', 'http://metrics-api:5000/api/metrics')
        self.interval = interval
        self.node_id = socket.gethostname()
        self.log_file = os.environ.get('VLC_LOG_FILE', '/opt/vlc-server/logs/vlc_streaming.log')
        self.metrics_log = os.environ.get('QUALITY_LOG_FILE', '/opt/vlc-server/logs/quality_metrics.json')
        
        
        os.makedirs(os.path.dirname(self.metrics_log), exist_ok=True)
        
        
        self.stream_start_regex = re.compile(r'starting to stream (.+)')
        self.quality_change_regex = re.compile(r'changing resolution to (\d+)x(\d+)')
        self.transcode_regex = re.compile(r'transcoding (\w+) to (\w+)')
        self.error_regex = re.compile(r'error: (.+)')
        
       
        self.active_streams = {}
    
    def parse_vlc_log(self):
        """
        Parse VLC log file to extract quality information.
        
        Returns:
            dict: Quality metrics extracted from log
        """
        try:
            if not os.path.exists(self.log_file):
                return {
                    'active_streams': 0,
                    'streams': [],
                    'errors': []
                }
            
            metrics = {
                'active_streams': 0,
                'streams': [],
                'errors': [],
                'quality_changes': [],
                'transcoding': []
            }
            
            
            cmd = f"tail -n 100 {self.log_file}"
            result = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            if result.returncode != 0:
                print(f"Error reading VLC log: {result.stderr}")
                return metrics
            
            log_lines = result.stdout.split('\n')
            
            
            for line in log_lines:
                
                stream_match = self.stream_start_regex.search(line)
                if stream_match:
                    stream_path = stream_match.group(1)
                    metrics['streams'].append(stream_path)
                    self.active_streams[stream_path] = {
                        'start_time': datetime.now().isoformat(),
                        'path': stream_path
                    }
                
               
                quality_match = self.quality_change_regex.search(line)
                if quality_match:
                    width = int(quality_match.group(1))
                    height = int(quality_match.group(2))
                    metrics['quality_changes'].append({
                        'width': width,
                        'height': height,
                        'resolution': f"{width}x{height}"
                    })
                
                
                transcode_match = self.transcode_regex.search(line)
                if transcode_match:
                    source_codec = transcode_match.group(1)
                    target_codec = transcode_match.group(2)
                    metrics['transcoding'].append({
                        'source_codec': source_codec,
                        'target_codec': target_codec
                    })
                
                
                error_match = self.error_regex.search(line)
                if error_match:
                    error_msg = error_match.group(1)
                    metrics['errors'].append(error_msg)
            
            
            metrics['active_streams'] = len(self.active_streams)
            
            return metrics
        except Exception as e:
            print(f"Error parsing VLC log: {e}")
            return {
                'active_streams': 0,
                'streams': [],
                'errors': [str(e)]
            }
    
    def get_active_stream_details(self):
        """
        Get detailed information about currently active streams.
        
        Returns:
            list: Active stream details
        """
        try:
            streams = []
            
            for stream_id, stream_info in self.active_streams.items():
                streams.append({
                    'stream_id': stream_id,
                    'start_time': stream_info.get('start_time'),
                    'duration': self.calculate_stream_duration(stream_info.get('start_time')),
                    'path': stream_info.get('path')
                })
            
            return streams
        except Exception as e:
            print(f"Error getting active stream details: {e}")
            return []
    
    def calculate_stream_duration(self, start_time):
        """
        Calculate stream duration from start time.
        
        Args:
            start_time (str): ISO format timestamp
        
        Returns:
            int: Duration in seconds
        """
        if not start_time:
            return 0
        
        try:
            start = datetime.fromisoformat(start_time)
            now = datetime.now()
            return int((now - start).total_seconds())
        except Exception:
            return 0
    
    def analyze_video_quality(self, media_path):
        """
        Analyze video quality metrics for a specific media file.
        
        Args:
            media_path (str): Path to media file
        
        Returns:
            dict: Quality metrics
        """
        try:
            
            if not os.path.exists(media_path):
                return {}
            
            cmd = [
                'ffprobe', '-v', 'error',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=width,height,avg_frame_rate,codec_name,bit_rate',
                '-of', 'json',
                media_path
            ]
            
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            if result.returncode != 0:
                print(f"Error analyzing video: {result.stderr}")
                return {}
            
            data = json.loads(result.stdout)
            
            if 'streams' not in data or not data['streams']:
                return {}
            
            stream = data['streams'][0]
            
            return {
                'codec': stream.get('codec_name'),
                'width': stream.get('width'),
                'height': stream.get('height'),
                'resolution': f"{stream.get('width')}x{stream.get('height')}",
                'frame_rate': stream.get('avg_frame_rate'),
                'bitrate': stream.get('bit_rate')
            }
        except Exception as e:
            print(f"Error analyzing video quality: {e}")
            return {}
    
    def collect_and_send_metrics(self):
        """
        Collect quality metrics and send to API.
        """
        try:
            log_metrics = self.parse_vlc_log()
            active_streams = self.get_active_stream_details()
            
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'node_id': self.node_id,
                'quality': {
                    'active_streams': log_metrics.get('active_streams', 0),
                    'stream_details': active_streams,
                    'recent_quality_changes': log_metrics.get('quality_changes', []),
                    'transcoding_operations': log_metrics.get('transcoding', []),
                    'errors': log_metrics.get('errors', [])
                }
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
                        print(f"Quality metrics sent successfully at {datetime.now().isoformat()}")
                    else:
                        print(f"Error sending quality metrics: {response.status_code} - {response.text}")
                except Exception as e:
                    print(f"Error sending quality metrics: {e}")
            
            
            with open(self.metrics_log, 'a') as f:
                f.write(json.dumps(metrics) + '\n')
            
            return metrics
        except Exception as e:
            print(f"Error in collect_and_send_metrics: {e}")
            return None
    
    def run(self):
        """
        Run the quality collector continuously.
        """
        print(f"Starting quality collector with interval {self.interval} seconds")
        
        while True:
            try:
                self.collect_and_send_metrics()
            except Exception as e:
                print(f"Error in quality collector: {e}")
            
            time.sleep(self.interval)

if __name__ == "__main__":
    interval = int(os.environ.get('METRICS_INTERVAL', '10'))
    api_url = os.environ.get('METRICS_API_URL', 'http://metrics-api:5000/api/metrics/quality')
    
    collector = QualityCollector(api_url=api_url, interval=interval)
    collector.run()