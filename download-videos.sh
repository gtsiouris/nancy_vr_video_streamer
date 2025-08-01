
if [ -n "$VIDEO_SOURCE_URL" ]; then
    echo "Downloading videos from: $VIDEO_SOURCE_URL"
    cd /usr/share/nginx/videos
    
    # mp4 only here
    wget -r -np -nH --cut-dirs=1 -A "*.mp4" "$VIDEO_SOURCE_URL" || {
        echo "Warning: Some files might have failed to download"
    }
    
    echo "Download completed. Files in videos directory:"
    ls -la /usr/share/nginx/videos/
else
    echo "No VIDEO_SOURCE_URL set. Using existing videos in directory."
fi