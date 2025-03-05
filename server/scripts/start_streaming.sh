

echo "Starting VLC Streaming Server..."

python3 /opt/vlc-server/scripts/scan_media.py

HTTP_PORT=${HTTP_PORT:-8080}
RTSP_PORT=${RTSP_PORT:-8554}
MEDIA_PATH=${MEDIA_PATH:-/media/storage}
LOG_FILE="/opt/vlc-server/logs/vlc_streaming.log"

mkdir -p /opt/vlc-server/logs

python3 /opt/vlc-server/scripts/report_metrics.py &

echo "Starting HTTP streaming on port $HTTP_PORT"
cvlc \
  $MEDIA_PATH/mp4/videoplayback.mp4 \
  --no-video-title-show \
  --verbose=$VLC_VERBOSE \
  --file-logging \
  --logfile="$LOG_FILE" \
  --http-host=0.0.0.0 \
  --http-port=$HTTP_PORT \
  --sout-keep \
  --sout="#transcode{vcodec=h264,acodec=mp3,ab=128,channels=2,samplerate=44100}:standard{access=http,mux=mp4,dst=:$HTTP_PORT/}" \
  --repeat \
  --loop \
  --daemon

echo "Starting RTSP streaming on port $RTSP_PORT"
cvlc \
  $MEDIA_PATH/mp4/videoplayback.mp4 \
  --no-video-title-show \
  --verbose=$VLC_VERBOSE \
  --rtsp-host=0.0.0.0 \
  --rtsp-port=$RTSP_PORT \
  --sout="#transcode{vcodec=h264,acodec=mp3,ab=128,channels=2,samplerate=44100}:rtp{sdp=rtsp://:$RTSP_PORT/stream}" \
  --sout-all \
  --repeat \
  --loop \
  --daemon

tail -f "$LOG_FILE"