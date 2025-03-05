document.addEventListener('DOMContentLoaded', function() {
    const CONFIG = {
        metricsApiUrl: '/api/metrics/client',
        metricsUpdateInterval: 2000,
        chartUpdateInterval: 5000,
        bufferThreshold: 5,
        chartHistoryPoints: 30,
        startTime: Date.now()
    };
    
    const metricsStore = {
        bandwidth: [],
        bufferLevel: [],
        droppedFrames: 0,
        qualityChanges: [],
        latency: [],
        currentBitrate: 0,
        playerState: 'idle',
        connectionType: navigator.connection ? navigator.connection.type : 'unknown',
        deviceInfo: {
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            pixelRatio: window.devicePixelRatio,
            platform: navigator.platform
        }
    };
    
    let bandwidthChart = null;
    let bufferChart = null;
    let qualityChart = null;
    let connectionChart = null;
    
    let videoJsPlayer = null;
    
    function initializePlayer() {
        if (!document.getElementById('streaming-player')) return;
        
        videoJsPlayer = videojs('streaming-player');
        
        videoJsPlayer.on('loadstart', onPlayerLoadStart);
        videoJsPlayer.on('waiting', onPlayerWaiting);
        videoJsPlayer.on('playing', onPlayerPlaying);
        videoJsPlayer.on('seeking', onPlayerSeeking);
        videoJsPlayer.on('timeupdate', onPlayerTimeUpdate);
        videoJsPlayer.on('error', onPlayerError);
        
        console.log('VideoJS player initialized with metrics collection');
    }
    
    function onPlayerLoadStart() {
        metricsStore.playerState = 'loading';
        metricsStore.loadStartTime = Date.now();
        updateMetricsDisplay();
    }
    
    function onPlayerWaiting() {
        metricsStore.playerState = 'buffering';
        metricsStore.bufferingStartTime = Date.now();
        updateMetricsDisplay();
    }
    
    function onPlayerPlaying() {
        if (metricsStore.loadStartTime && !metricsStore.initialLoadTime) {
            metricsStore.initialLoadTime = Date.now() - metricsStore.loadStartTime;
            sendMetric('initial_load_time', metricsStore.initialLoadTime);
        }
        
        if (metricsStore.bufferingStartTime) {
            const bufferingTime = Date.now() - metricsStore.bufferingStartTime;
            sendMetric('buffering_time', bufferingTime);
            metricsStore.bufferingStartTime = null;
        }
        
        metricsStore.playerState = 'playing';
        updateMetricsDisplay();
    }
    
    function onPlayerSeeking() {
        metricsStore.playerState = 'seeking';
        metricsStore.seekStartTime = Date.now();
        updateMetricsDisplay();
    }
    
    function onPlayerTimeUpdate() {
        if (!videoJsPlayer) return;
        
        try {
            const buffered = videoJsPlayer.buffered();
            if (buffered && buffered.length > 0) {
                const bufferEnd = buffered.end(buffered.length - 1);
                const currentTime = videoJsPlayer.currentTime();
                const bufferLevel = bufferEnd - currentTime;
                
                metricsStore.bufferLevel.push({
                    time: Date.now(),
                    value: bufferLevel
                });
                
                if (metricsStore.bufferLevel.length > CONFIG.chartHistoryPoints) {
                    metricsStore.bufferLevel.shift();
                }
                
                if (bufferLevel < CONFIG.bufferThreshold) {
                    sendMetric('low_buffer', bufferLevel);
                }
            }
            
            if (videoJsPlayer.tech_ && videoJsPlayer.tech_.hls) {
                const bandwidthEstimate = videoJsPlayer.tech_.hls.bandwidth;
                if (bandwidthEstimate) {
                    metricsStore.currentBitrate = Math.round(bandwidthEstimate / 1000);
                    
                    metricsStore.bandwidth.push({
                        time: Date.now(),
                        value: metricsStore.currentBitrate
                    });
                    
                    if (metricsStore.bandwidth.length > CONFIG.chartHistoryPoints) {
                        metricsStore.bandwidth.shift();
                    }
                }
            }
        } catch (e) {
            console.error('Error in timeupdate handler:', e);
        }
        
        updateMetricsDisplay();
    }
    
    function onPlayerError() {
        metricsStore.playerState = 'error';
        metricsStore.lastError = videoJsPlayer.error();
        
        sendMetric('player_error', {
            code: videoJsPlayer.error().code,
            message: videoJsPlayer.error().message
        });
        
        updateMetricsDisplay();
    }
    
    function updateMetricsDisplay() {
        document.getElementById('buffer-health').textContent = 
            metricsStore.bufferLevel.length > 0 
                ? Math.round(metricsStore.bufferLevel[metricsStore.bufferLevel.length - 1].value) + 's'
                : 'N/A';
                
        document.getElementById('dropped-frames').textContent = 
            metricsStore.droppedFrames;
            
        document.getElementById('current-bitrate').textContent = 
            metricsStore.currentBitrate > 0 
                ? (metricsStore.currentBitrate / 1000).toFixed(2) + ' Mbps'
                : 'N/A';
                
        updateBufferChart();
        updateBandwidthChart();
    }
    
    function initializeCharts() {
        const bandwidthCtx = document.getElementById('bandwidth-chart');
        const bufferCtx = document.getElementById('buffer-chart');
        const qualityCtx = document.getElementById('quality-chart');
        
        if (bandwidthCtx) {
            bandwidthChart = new Chart(bandwidthCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: Array(CONFIG.chartHistoryPoints).fill(''),
                    datasets: [{
                        label: 'Bandwidth',
                        data: Array(CONFIG.chartHistoryPoints).fill(null),
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Mbps'
                            }
                        }
                    }
                }
            });
        }
        
        if (bufferCtx) {
            bufferChart = new Chart(bufferCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: Array(CONFIG.chartHistoryPoints).fill(''),
                    datasets: [{
                        label: 'Buffer Level',
                        data: Array(CONFIG.chartHistoryPoints).fill(null),
                        borderColor: 'rgb(153, 102, 255)',
                        tension: 0.1,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Seconds'
                            }
                        }
                    }
                }
            });
        }
        
        if (qualityCtx) {
            qualityChart = new Chart(qualityCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: Array(CONFIG.chartHistoryPoints).fill(''),
                    datasets: [{
                        label: 'Video Quality',
                        data: Array(CONFIG.chartHistoryPoints).fill(null),
                        borderColor: 'rgb(255, 159, 64)',
                        tension: 0.1,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Resolution Height'
                            }
                        }
                    }
                }
            });
        }
        
        setInterval(updateCharts, CONFIG.chartUpdateInterval);
        
        console.log('Client-side metrics charts initialized');
    }
    
    function updateBufferChart() {
        if (!bufferChart || metricsStore.bufferLevel.length === 0) return;
        
        const labels = metricsStore.bufferLevel.map(item => {
            const date = new Date(item.time);
            return date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        });
        
        const data = metricsStore.bufferLevel.map(item => item.value);
        
        bufferChart.data.labels = labels;
        bufferChart.data.datasets[0].data = data;
        bufferChart.update();
    }
    
    function updateBandwidthChart() {
        if (!bandwidthChart || metricsStore.bandwidth.length === 0) return;
        
        const labels = metricsStore.bandwidth.map(item => {
            const date = new Date(item.time);
            return date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        });
        
        const data = metricsStore.bandwidth.map(item => item.value / 1000);
        
        bandwidthChart.data.labels = labels;
        bandwidthChart.data.datasets[0].data = data;
        bandwidthChart.update();
    }
    
    function updateCharts() {
        updateBufferChart();
        updateBandwidthChart();
    }
    
    function sendMetric(metricName, value) {
        const metricData = {
            client_id: getClientId(),
            metric: metricName,
            value: value,
            timestamp: Date.now(),
            player_state: metricsStore.playerState,
            media_id: getCurrentMediaId(),
            session_duration: Date.now() - CONFIG.startTime,
            device_info: metricsStore.deviceInfo
        };
        
        fetch(CONFIG.metricsApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metricData)
        })
        .then(response => {
            if (!response.ok) {
                console.error('Failed to send metrics:', response.statusText);
            }
        })
        .catch(error => {
            console.error('Error sending metrics:', error);
        });
    }
    
    function getClientId() {
        let clientId = localStorage.getItem('streaming_client_id');
        
        if (!clientId) {
            clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('streaming_client_id', clientId);
        }
        
        return clientId;
    }
    
    function getCurrentMediaId() {
        return document.getElementById('current-title').getAttribute('data-media-id') || 'unknown';
    }
    
    function collectNetworkMetrics() {
        if (window.performance && window.performance.getEntriesByType) {
            const resources = window.performance.getEntriesByType('resource');
            
            const videoSegments = resources.filter(entry => 
                entry.name.includes('.ts') || 
                entry.name.includes('.m4s') || 
                entry.name.includes('.mp4')
            );
            
            if (videoSegments.length > 0) {
                const totalDuration = videoSegments.reduce((sum, entry) => sum + entry.duration, 0);
                const totalSize = videoSegments.reduce((sum, entry) => sum + entry.transferSize, 0);
                const avgDuration = totalDuration / videoSegments.length;
                const avgSize = totalSize / videoSegments.length;
                
                const avgSpeedMbps = (avgSize * 8) / (avgDuration * 1000);
                
                sendMetric('segment_download_time', avgDuration);
                sendMetric('segment_size', avgSize);
                sendMetric('download_speed', avgSpeedMbps);
            }
            
            if (window.performance.clearResourceTimings) {
                window.performance.clearResourceTimings();
            }
        }
    }
    
    function fetchServerMetrics() {
        fetch('/api/metrics/server')
            .then(response => response.json())
            .then(data => {
                document.getElementById('active-connections').textContent = 
                    data.connections ? data.connections.total_connections : '0';
                    
                document.getElementById('bandwidth-value').textContent = 
                    data.network && data.network.current_bandwidth ? 
                    (data.network.current_bandwidth / 1024 / 1024).toFixed(2) + ' Mbps' : 
                    '0 Mbps';
                    
                document.getElementById('server-cpu').textContent = 
                    data.system ? data.system.cpu_percent + '%' : '0%';
                    
                if (connectionChart && data.connections_history) {
                    updateConnectionChart(data.connections_history);
                }
            })
            .catch(error => {
                console.error('Error fetching server metrics:', error);
                document.getElementById('server-status').textContent = 'Offline';
                document.getElementById('server-status').className = 'status-offline';
            });
    }

    initializePlayer();
    initializeCharts();
    
    setInterval(collectNetworkMetrics, CONFIG.metricsUpdateInterval);
    setInterval(fetchServerMetrics, CONFIG.metricsUpdateInterval);
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            this.classList.add('active');
            
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId + '-metrics').classList.add('active');
        });
    });
    
    console.log('Client-side metrics collection initialized');
});