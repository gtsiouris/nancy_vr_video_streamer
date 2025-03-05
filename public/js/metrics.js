const MetricsTracker = {
    data: {
      activeStreams: 0,
      totalViews: 0,
      sessionsData: [],
      videosData: {},
      bandwidth: 0,
      startTime: Date.now()
    },
    
    init() {
      this.loadStoredData();
      this.setupEventListeners();
      this.startPeriodicUpdates();
      this.renderDashboard();
    },
    
    loadStoredData() {
      try {
        const storedData = localStorage.getItem('streamingMetrics');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          this.data = { ...this.data, ...parsedData };
        }
        
        const events = JSON.parse(localStorage.getItem('streamEvents') || '[]');
        const sessionData = JSON.parse(sessionStorage.getItem('videoSession') || '{}');
        
        if (sessionData.startTime) {
          this.data.activeStreams += 1;
        }
        
        if (events.length) {
          this.processEvents(events);
        }
      } catch (e) {
        console.error(e);
      }
    },
    
    processEvents(events) {
      const playEvents = events.filter(e => e.type === 'play');
      const pauseEvents = events.filter(e => e.type === 'pause');
      const completeEvents = events.filter(e => e.type === 'complete');
      
      this.data.totalViews = Math.max(this.data.totalViews, playEvents.length);
      
      const videoIds = [...new Set(events.map(e => e.videoId))];
      videoIds.forEach(videoId => {
        if (!this.data.videosData[videoId]) {
          this.data.videosData[videoId] = {
            views: 0,
            completions: 0,
            totalWatchTime: 0,
            averageWatchTime: 0
          };
        }
        
        const videoPlayEvents = playEvents.filter(e => e.videoId === videoId);
        const videoCompleteEvents = completeEvents.filter(e => e.videoId === videoId);
        
        this.data.videosData[videoId].views += videoPlayEvents.length;
        this.data.videosData[videoId].completions += videoCompleteEvents.length;
      });
    },
    
    setupEventListeners() {
      window.addEventListener('storage', (event) => {
        if (event.key === 'streamEvents' || event.key === 'videoSession') {
          this.loadStoredData();
          this.renderDashboard();
        }
      });
    },
    
    startPeriodicUpdates() {
      setInterval(() => {
        this.updateBandwidthEstimate();
        this.saveData();
        this.renderDashboard();
      }, 5000);
    },
    
    updateBandwidthEstimate() {
      const elapsedMinutes = (Date.now() - this.data.startTime) / 60000;
      if (elapsedMinutes > 0) {
        const baseValue = Math.max(1, this.data.totalViews) * 5; 
        const variablePart = Math.random() * 2;
        this.data.bandwidth = (baseValue + variablePart) * elapsedMinutes;
      }
    },
    
    saveData() {
      try {
        localStorage.setItem('streamingMetrics', JSON.stringify({
          totalViews: this.data.totalViews,
          videosData: this.data.videosData,
          bandwidth: this.data.bandwidth
        }));
      } catch (e) {
        console.error(e);
      }
    },
    
    renderDashboard() {
      this.updateHeaderMetrics();
      this.renderSessionsTable();
      this.renderVideosTable();
    },
    
    updateHeaderMetrics() {
      document.getElementById('activeStreams').textContent = this.data.activeStreams;
      document.getElementById('totalViews').textContent = this.data.totalViews;
      
      const totalWatchTime = Object.values(this.data.videosData).reduce((sum, video) => sum + video.totalWatchTime, 0);
      const totalViews = Object.values(this.data.videosData).reduce((sum, video) => sum + video.views, 0);
      const avgSeconds = totalViews > 0 ? Math.floor(totalWatchTime / totalViews) : 0;
      const minutes = Math.floor(avgSeconds / 60);
      const seconds = avgSeconds % 60;
      
      document.getElementById('avgWatchTime').textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
      document.getElementById('bandwidth').textContent = `${this.data.bandwidth.toFixed(2)} MB`;
    },
    
    renderSessionsTable() {
      const sessionsBody = document.getElementById('sessionsBody');
      if (!sessionsBody) return;
      
      sessionsBody.innerHTML = '';
      
      const sessionData = JSON.parse(sessionStorage.getItem('videoSession') || '{}');
      if (sessionData.startTime) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${sessionData.videoId || 'unknown'}</td>
          <td>${new Date(sessionData.startTime).toLocaleTimeString()}</td>
          <td>Active</td>
          <td>${sessionData.userAgent ? (sessionData.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop') : 'Unknown'}</td>
          <td>${sessionData.screenSize || 'unknown'}</td>
        `;
        sessionsBody.appendChild(row);
      }
      
      if (this.data.sessionsData.length === 0 && !sessionData.startTime) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center;">No sessions recorded yet</td>';
        sessionsBody.appendChild(row);
        return;
      }
      
      this.data.sessionsData.forEach(session => {
        const row = document.createElement('tr');
        const duration = Math.floor((session.endTime - session.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        row.innerHTML = `
          <td>${session.videoId}</td>
          <td>${new Date(session.startTime).toLocaleTimeString()}</td>
          <td>${minutes}:${seconds < 10 ? '0' + seconds : seconds}</td>
          <td>${session.device}</td>
          <td>${session.resolution}</td>
        `;
        sessionsBody.appendChild(row);
      });
    },
    
    renderVideosTable() {
      const videosBody = document.getElementById('videosBody');
      if (!videosBody) return;
      
      videosBody.innerHTML = '';
      
      const videoIds = Object.keys(this.data.videosData);
      if (videoIds.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center;">No video data available</td>';
        videosBody.appendChild(row);
        return;
      }
      
      videoIds.forEach(videoId => {
        const video = this.data.videosData[videoId];
        const row = document.createElement('tr');
        
        const avgSeconds = video.views > 0 ? Math.floor(video.totalWatchTime / video.views) : 0;
        const minutes = Math.floor(avgSeconds / 60);
        const seconds = avgSeconds % 60;
        
        const completionRate = video.views > 0 ? Math.floor((video.completions / video.views) * 100) : 0;
        
        row.innerHTML = `
          <td>${videoId}</td>
          <td>${video.views}</td>
          <td>${minutes}:${seconds < 10 ? '0' + seconds : seconds}</td>
          <td>${completionRate}%</td>
        `;
        videosBody.appendChild(row);
      });
    },
    
    recordStreamEvent(videoId, eventType, position, duration, resolution) {
      const timestamp = Date.now();
      
      if (eventType === 'play') {
        this.data.activeStreams += 1;
        this.data.totalViews += 1;
        
        if (!this.data.videosData[videoId]) {
          this.data.videosData[videoId] = {
            views: 0,
            completions: 0,
            totalWatchTime: 0,
            averageWatchTime: 0
          };
        }
        
        this.data.videosData[videoId].views += 1;
        
        this.data.sessionsData.unshift({
          videoId,
          startTime: timestamp,
          endTime: null,
          device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
          resolution: resolution || 'unknown'
        });
        
      } else if (eventType === 'pause' || eventType === 'complete') {
        this.data.activeStreams = Math.max(0, this.data.activeStreams - 1);
        
        const session = this.data.sessionsData.find(s => s.videoId === videoId && !s.endTime);
        if (session) {
          session.endTime = timestamp;
          const watchTime = Math.floor((session.endTime - session.startTime) / 1000);
          
          if (this.data.videosData[videoId]) {
            this.data.videosData[videoId].totalWatchTime += watchTime;
            this.data.videosData[videoId].averageWatchTime = 
              this.data.videosData[videoId].totalWatchTime / this.data.videosData[videoId].views;
              
            if (eventType === 'complete') {
              this.data.videosData[videoId].completions += 1;
            }
          }
        }
      }
      
      this.saveData();
      this.renderDashboard();
    }
  };
  
  document.addEventListener('DOMContentLoaded', () => {
    MetricsTracker.init();
  });
  
  window.MetricsTracker = MetricsTracker;