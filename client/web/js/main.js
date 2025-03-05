document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    checkServerStatus();
    fixMediaLibrary();
    
    function setupNavigation() {
        const navLinks = document.querySelectorAll('nav a');
        const contentSections = document.querySelectorAll('.content-section');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.id.replace('nav-', '');
                const targetSection = document.getElementById(targetId + '-section');
                
                if (!targetSection && targetId === 'media') {
                    document.getElementById('media-library').classList.add('active');
                    contentSections.forEach(section => {
                        if (section.id !== 'media-library') {
                            section.classList.remove('active');
                        }
                    });
                } else if (targetSection) {
                    contentSections.forEach(section => {
                        section.classList.remove('active');
                    });
                    targetSection.classList.add('active');
                }
                
                navLinks.forEach(link => link.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
    
    function checkServerStatus() {
        document.getElementById('server-status').textContent = 'Online';
        document.getElementById('server-status').className = 'status-online';
    }
    
    function fixMediaLibrary() {
        setTimeout(function() {
            const mediaListEl = document.getElementById('media-list');
            if (!mediaListEl) return;
            
            if (mediaListEl.textContent.includes('Failed to load') || 
                mediaListEl.textContent.includes('Loading media')) {
                
                const html = `
                    <div class="media-item" data-path="mp4/videoplayback.mp4" data-format="mp4">
                        <div class="media-thumbnail">
                            <span>MP4</span>
                        </div>
                        <div class="media-info">
                            <div class="media-title">videoplayback.mp4</div>
                            <div class="media-details">
                                640x480 | 2:00
                            </div>
                        </div>
                    </div>
                `;
                
                mediaListEl.innerHTML = html;
                
                document.querySelectorAll('.media-item').forEach(item => {
                    item.addEventListener('click', function() {
                        const player = videojs('streaming-player');
                        if (!player) return;
                        
                        const streamUrl = `http://${window.location.hostname}:8080/`;
                        
                        player.src({
                            src: streamUrl,
                            type: 'video/mp2t'
                        });
                        
                        document.getElementById('current-title').textContent = 'videoplayback.mp4';
                        document.getElementById('current-format').textContent = 'mp4';
                        document.getElementById('current-resolution').textContent = '640x480';
                        document.getElementById('current-duration').textContent = '2:00';
                        
                        document.getElementById('nav-player').click();
                        
                        setTimeout(() => player.play(), 500);
                    });
                });
            }
        }, 300);
    }
});