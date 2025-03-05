

import os
import json
import subprocess
from pathlib import Path
from datetime import datetime

MEDIA_PATH = os.environ.get('MEDIA_PATH', '/media/storage')
MEDIA_INDEX_FILE = '/opt/vlc-server/config/media_index.json'
ACCEPTED_FORMATS = ('.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.3gp', '.wmv', '.mpg', '.mpeg', '.ts')

def get_video_duration(file_path):
    try:
        cmd = [
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', str(file_path)
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        duration = float(result.stdout.strip())
        return duration
    except Exception as e:
        print(f"Error getting duration for {file_path}: {e}")
        return 0

def get_video_resolution(file_path):
    try:
        cmd = [
            'ffprobe', '-v', 'error', '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height', '-of', 'csv=s=x:p=0', str(file_path)
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return result.stdout.strip()
    except Exception as e:
        print(f"Error getting resolution for {file_path}: {e}")
        return "unknown"

def scan_media_directory():
    print(f"Scanning media directory: {MEDIA_PATH}")
    
    media_files = []
    total_size = 0
    
    for root, _, files in os.walk(MEDIA_PATH):
        for file in files:
            if file.lower().endswith(ACCEPTED_FORMATS):
                file_path = Path(root) / file
                relative_path = str(file_path).replace(MEDIA_PATH, '').lstrip('/')
                
                stat = file_path.stat()
                size_mb = stat.st_size / (1024 * 1024)
                total_size += size_mb
                
                try:
                    duration = get_video_duration(file_path)
                    resolution = get_video_resolution(file_path)
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
                    duration = 0
                    resolution = "unknown"
                
                media_files.append({
                    'name': file,
                    'path': relative_path,
                    'format': file_path.suffix[1:],
                    'size_mb': round(size_mb, 2),
                    'duration': round(duration, 2),
                    'resolution': resolution,
                    'last_modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
    
    media_index = {
        'last_updated': datetime.now().isoformat(),
        'total_files': len(media_files),
        'total_size_mb': round(total_size, 2),
        'media_files': media_files
    }
    
    try:
        with open('/tmp/media_index.json', 'w') as f:
            json.dump(media_index, f, indent=2)
        os.system(f"cp /tmp/media_index.json {MEDIA_INDEX_FILE}")
        print(f"Media index created with {len(media_files)} files")
        print(f"Total size: {round(total_size / 1024, 2)} GB")
    except Exception as e:
        print(f"Error saving media index: {e}")

if __name__ == "__main__":
    for media_type in ['mp4', 'mkv', 'webm', 'hls']:
        os.makedirs(os.path.join(MEDIA_PATH, media_type), exist_ok=True)
    
    scan_media_directory()