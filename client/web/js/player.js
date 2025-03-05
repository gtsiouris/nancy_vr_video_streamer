document.addEventListener('DOMContentLoaded', function() {
    const player = videojs('streaming-player');
    let mediaList = [];
    let selectedMedia = null;
    
    function initPlayer() {
        player.on('error', function() {
            console.error('Video error:', player.error());
            document.getElementById('server-status').textContent = 'Error';
            document.getElementById('server-status').className = 'status-offline';
        });
        
        player.on('loadedmetadata', function() {
            console.log('Video metadata loaded');
        });
    }
    
    function loadMedia(mediaItem) {
        selectedMedia = mediaItem;
        
        const protocol = document.getElementById('streaming-protocol').value;
        const quality = document.getElementById('quality-setting').value;
        
        let streamUrl = '';
        
        if (protocol === 'http') {
            
            streamUrl = `/direct-media/${mediaItem.path}`;
        } else if (protocol === 'rtsp') {
            streamUrl = `rtsp://${window.location.hostname}:8554/stream`;
        } else if (protocol === 'hls') {
            streamUrl = `/stream/hls/${mediaItem.path.replace(/\.[^/.]+$/, '')}/index.m3u8`;
        }
        
        player.src({
            src: streamUrl,
            type: getVideoType(mediaItem.format, protocol)
        });
        
        player.load();
        player.play();
        
        document.getElementById('current-title').textContent = mediaItem.name;
        document.getElementById('current-title').setAttribute('data-media-id', mediaItem.path);
        document.getElementById('current-resolution').textContent = mediaItem.resolution || '-';
        document.getElementById('current-format').textContent = mediaItem.format || '-';
        document.getElementById('current-duration').textContent = 
            mediaItem.duration ? formatDuration(mediaItem.duration) : '-';
    }
    
    function getVideoType(format, protocol) {
        if (protocol === 'hls') {
            return 'application/x-mpegURL';
        }
        
        if (protocol === 'rtsp') {
            return 'application/x-rtsp';
        }
        
        if (protocol === 'http') {
            return 'video/mp4';
        }
        
        const typeMap = {
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'mkv': 'video/x-matroska',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime',
            'wmv': 'video/x-ms-wmv',
            'm4v': 'video/mp4',
            '3gp': 'video/3gpp',
            'mpeg': 'video/mpeg',
            'mpg': 'video/mpeg',
            'ts': 'video/mp2t'
        };
        
        return typeMap[format.toLowerCase()] || 'video/mp4';
    }
    
    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return [
            hours > 0 ? hours.toString().padStart(2, '0') : null,
            minutes.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ].filter(Boolean).join(':');
    }
    
    function loadMediaList() {
        mediaList = [{
            'name': 'videoplayback.mp4',
            'path': 'mp4/videoplayback.mp4',
            'format': 'mp4',
            'size_mb': 14.48,
            'duration': 120,
            'resolution': '640x480'
        }];
        renderMediaList(mediaList);
    }
    
    function renderMediaList(mediaFiles) {
        const mediaListEl = document.getElementById('media-list');
        
        if (!mediaFiles || mediaFiles.length === 0) {
            mediaListEl.innerHTML = '<div class="empty">No media files found.</div>';
            return;
        }
        
        let html = '';
        
        mediaFiles.forEach(media => {
            const thumbnailText = media.format ? media.format.toUpperCase() : 'MP4';
            
            html += `
                <div class="media-item" data-path="${media.path}" data-format="${media.format || 'mp4'}">
                    <div class="media-thumbnail">
                        <span>${thumbnailText}</span>
                    </div>
                    <div class="media-info">
                        <div class="media-title">${media.name}</div>
                        <div class="media-details">
                            ${media.resolution || 'Unknown'} | ${formatDuration(media.duration || 0)}
                        </div>
                    </div>
                </div>
            `;
        });
        
        mediaListEl.innerHTML = html;
        
        document.querySelectorAll('.media-item').forEach(item => {
            item.addEventListener('click', function() {
                const path = this.getAttribute('data-path');
                const mediaFormat = this.getAttribute('data-format');
                
                const media = mediaFiles.find(m => m.path === path) || {
                    name: path.split('/').pop(),
                    path: path,
                    format: mediaFormat || 'mp4'
                };
                
                if (media) {
                    loadMedia(media);
                    
                    document.getElementById('nav-player').click();
                }
            });
        });
    }
    
    function setupEventListeners() {
        document.getElementById('format-filter').addEventListener('change', function() {
            const format = this.value;
            let filteredMedia = mediaList;
            
            if (format !== 'all') {
                filteredMedia = mediaList.filter(media => 
                    format === 'other' 
                        ? !['mp4', 'mkv', 'webm'].includes(media.format ? media.format.toLowerCase() : '')
                        : (media.format ? media.format.toLowerCase() === format : false)
                );
            }
            
            renderMediaList(filteredMedia);
        });
        
        document.getElementById('search-input').addEventListener('input', function() {
            const search = this.value.toLowerCase();
            
            if (!search) {
                renderMediaList(mediaList);
                return;
            }
            
            const filteredMedia = mediaList.filter(media => 
                media.name ? media.name.toLowerCase().includes(search) : false
            );
            
            renderMediaList(filteredMedia);
        });
        
        document.getElementById('streaming-protocol').addEventListener('change', function() {
            if (selectedMedia) {
                loadMedia(selectedMedia);
            }
        });
        
        document.getElementById('quality-setting').addEventListener('change', function() {
            if (selectedMedia) {
                loadMedia(selectedMedia);
            }
        });
    }
    
    
    function ensureMediaListLoaded() {
        const mediaListEl = document.getElementById('media-list');
        if (mediaListEl && mediaListEl.innerHTML.includes('Failed to load media list') || 
            mediaListEl.innerHTML.includes('Loading media list')) {
            loadMediaList();
        }
    }
    
    initPlayer();
    loadMediaList();
    setupEventListeners();
    
    
    setTimeout(ensureMediaListLoaded, 500);
    setInterval(ensureMediaListLoaded, 2000);
    
    window.playerModule = {
        getSelectedMedia: () => selectedMedia,
        reloadMedia: () => selectedMedia && loadMedia(selectedMedia),
        loadMedia: loadMedia
    };
});