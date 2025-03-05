
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        const mediaListEl = document.getElementById('media-list');
        if (!mediaListEl) return;
        

        mediaListEl.innerHTML = '';
        
 
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
                const path = this.getAttribute('data-path');
                const format = this.getAttribute('data-format');
                

                const media = {
                    name: 'videoplayback.mp4',
                    path: path,
                    format: format,
                    resolution: '640x480',
                    duration: 120
                };
                

                if (window.playerModule && window.playerModule.loadMedia) {
                    window.playerModule.loadMedia(media);
                }
                

                document.getElementById('nav-player').click();
            });
        });
    }, 500); 
});
