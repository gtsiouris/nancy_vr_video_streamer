# nancy_vr_video_streamer

# VLC Streaming Platform

A complete, dockerized multimedia streaming solution built around VLC. This platform allows you to stream video content from a central server to multiple clients with comprehensive metrics collection and visualization.

## Features

- **VLC-based Streaming Server**: Leverages VLC's powerful streaming capabilities
- **Multiple Streaming Protocols**: HTTP, RTSP, and HLS streaming options
- **Media Organization**: Structured storage for various media formats
- **Dockerized Components**: Easy deployment and scaling
- **Comprehensive Metrics**: Server and client-side metrics collection
- **Real-time Visualization**: Interactive dashboards for streaming analytics
- **Mobile-friendly Client**: Stream to any device with a compatible player
- **Scalable Architecture**: Components can be deployed together or separately

## Architecture

The system consists of the following components:

1. **VLC Streaming Server**: Core component that streams media files
2. **Web Server (NGINX)**: Serves the client interface and acts as a proxy
3. **Metrics API**: Collects and provides access to streaming metrics
4. **Metrics Database**: Stores historical metrics data
5. **Visualization Dashboard**: Grafana-based metrics visualization

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Media files to stream (MP4, MKV, WebM, etc.)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/vlc-streaming-platform.git
   cd vlc-streaming-platform
   ```

2. Add your media files to the appropriate directories:
   ```bash
   mkdir -p media/mp4 media/mkv media/webm
   # Copy your media files to these directories
   ```

3. Build and start the containers:
   ```bash
   cd docker
   docker-compose up -d
   ```

4. Access the platform:
   - Web interface: http://localhost
   - Grafana dashboard: http://localhost:3000 (admin/streaming_grafana_pwd)

## Directory Structure

```
vlc-streaming-platform/
├── docker/               # Docker configuration files
├── server/               # VLC server configuration and scripts
├── media/                # Media storage directories
├── client/               # Web client interface
├── metrics/              # Metrics collection and visualization
└── tests/                # Test scripts
```

## Media Organization

Media files should be organized by format:

- `media/mp4/`: MP4 video files
- `media/mkv/`: MKV video files
- `media/webm/`: WebM video files
- `media/hls/`: HLS transcoded streams (generated automatically)

## Streaming Options

The platform supports multiple streaming protocols:

- **HTTP Streaming** (port 8080): Basic streaming, works in most browsers
- **RTSP Streaming** (port 8554): Better for mobile devices, requires VLC or compatible player
- **HLS Streaming**: Adaptive bitrate streaming, automatically generated from source files

## Metrics Collection

The system collects comprehensive metrics about streaming performance:

### Server-side Metrics
- CPU and memory usage
- Network bandwidth
- Active connections
- Streaming quality

### Client-side Metrics
- Buffer health
- Bandwidth usage
- Quality changes
- Playback events

## Real-world Usage

### Desktop Client

1. Open your web browser and navigate to http://your_server_ip
2. Browse and select media from the library
3. The media will start streaming using the HTTP protocol

### Mobile Client

1. Install VLC for Android/iOS on your mobile device
2. Add a network stream with URL: rtsp://your_server_ip:8554/stream
3. Media will stream using the RTSP protocol, which is more efficient for mobile devices

## Customization

### Changing Streaming Parameters

Edit `server/config/vlc.conf` to modify streaming parameters such as transcoding options or bitrate limits.

### Adding Authentication

Edit `docker/nginx/nginx.conf` to add basic authentication for the web interface.

### Custom Metrics

The metrics API is extensible. Add custom collectors to `metrics/collectors/` and update the visualization accordingly.

## Troubleshooting

### Common Issues

1. **No media showing in the library**
   - Check that you've added media files to the correct directories
   - Ensure file permissions allow the Docker container to read the files
   - Check the VLC server logs: `docker logs vlc-server`

2. **Streaming performance issues**
   - Check network bandwidth between server and client
   - Monitor server metrics for CPU or memory bottlenecks
   - Try a different streaming protocol (RTSP may perform better than HTTP in some cases)

3. **Metrics not showing**
   - Verify the metrics API is running: `docker logs metrics-api`
   - Check browser console for JavaScript errors
   - Ensure MongoDB is running correctly: `docker logs metrics-db`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.