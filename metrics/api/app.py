from flask import Flask, request, jsonify
from datetime import datetime
import logging
import os
import json


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = Flask(__name__)


mongo_client = None
server_metrics = None
try:
    from pymongo import MongoClient
    
    mongo_client = MongoClient(
        'mongodb://admin:streaming_metrics_pwd@metrics-db:27017/',
        serverSelectionTimeoutMS=5000  
    )
    db = mongo_client.streaming_metrics
    server_metrics = db.server_metrics
    logger.info("Connected to MongoDB")
except Exception as e:
    logger.warning(f"MongoDB connection failed: {e}")
    logger.info("Will use file-based storage instead")
    mongo_client = None


def store_metrics_to_file(collection_name, data):
    data_dir = os.environ.get('DATA_DIR', '/data')
    os.makedirs(data_dir, exist_ok=True)
    
    file_path = os.path.join(data_dir, f"{collection_name}.json")
    
    try:
        existing_data = []
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                existing_data = json.load(f)
        
        existing_data.append(data)
        
        with open(file_path, 'w') as f:
            json.dump(existing_data, f)
    except Exception as e:
        logger.error(f"Error storing metrics to file: {e}")

@app.route('/api/metrics', methods=['POST'])
def api_metrics_post():
    """Generic metrics endpoint for backward compatibility"""
    try:
        metrics_data = request.json
        
        if 'timestamp' not in metrics_data:
            metrics_data['timestamp'] = datetime.now().isoformat()
            
        if mongo_client:
            server_metrics.insert_one(metrics_data)
        else:
            store_metrics_to_file('server_metrics', metrics_data)
            
        return jsonify({'status': 'success', 'message': 'Metrics collected'}), 200
    except Exception as e:
        logger.error(f"Error collecting metrics: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/media', methods=['GET'])
def api_media_get():
    """Return the list of media files"""
    try:
        
        media_data = {
            'last_updated': datetime.now().isoformat(),
            'total_files': 1,
            'total_size_mb': 14.48,
            'media_files': [
                {
                    'name': 'videoplayback.mp4',
                    'path': 'mp4/videoplayback.mp4',
                    'format': 'mp4',
                    'size_mb': 14.48,
                    'duration': 120,
                    'resolution': '640x480',
                    'last_modified': datetime.now().isoformat()
                }
            ]
        }
        return jsonify(media_data), 200
    except Exception as e:
        logger.error(f"Error getting media list: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/metrics/server', methods=['GET'])
def api_metrics_server_get():
    """Return server metrics data"""
    try:
       
        sample_metrics = {
            'cpu_usage': 22.5,
            'memory_usage': 1256.8,
            'bandwidth_in': 5.2,
            'bandwidth_out': 12.8,
            'active_connections': 3,
            'uptime_hours': 24.5,
            'timestamp': datetime.now().isoformat()
        }
        return jsonify(sample_metrics), 200
    except Exception as e:
        logger.error(f"Error getting server metrics: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)