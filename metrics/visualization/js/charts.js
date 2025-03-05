
let connectionChart = null;
let bandwidthChart = null; 
let resourceChart = null;
let qualityChart = null;
let bufferChart = null;
let historyChart = null;


const CHART_COLORS = {
    connections: {
        border: 'rgb(54, 162, 235)',
        background: 'rgba(54, 162, 235, 0.2)'
    },
    bandwidth: {
        border: 'rgb(75, 192, 192)',
        background: 'rgba(75, 192, 192, 0.2)'
    },
    cpu: {
        border: 'rgb(255, 99, 132)',
        background: 'rgba(255, 99, 132, 0.2)'
    },
    memory: {
        border: 'rgb(153, 102, 255)',
        background: 'rgba(153, 102, 255, 0.2)'
    },
    quality: {
        border: 'rgb(255, 159, 64)',
        background: 'rgba(255, 159, 64, 0.2)'
    },
    buffer: {
        border: 'rgb(255, 205, 86)',
        background: 'rgba(255, 205, 86, 0.2)'
    }
};


const CHART_CONFIG = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 1000
    },
    plugins: {
        legend: {
            position: 'top',
        },
        tooltip: {
            mode: 'index',
            intersect: false
        }
    },
    scales: {
        x: {
            ticks: {
                maxRotation: 45,
                minRotation: 45
            }
        }
    }
};


function initializeCharts() {
    initConnectionsChart();
    initBandwidthChart();
    initResourcesChart();
    initQualityChart();
    
    console.log('Dashboard charts initialized');
}


function initConnectionsChart() {
    const ctx = document.getElementById('connections-chart')?.getContext('2d');
    if (!ctx) return;
    
    connectionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Active Connections',
                data: [],
                borderColor: CHART_COLORS.connections.border,
                backgroundColor: CHART_COLORS.connections.background,
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            ...CHART_CONFIG,
            scales: {
                ...CHART_CONFIG.scales,
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Connections'
                    }
                }
            }
        }
    });
}


function initBandwidthChart() {
    const ctx = document.getElementById('bandwidth-chart')?.getContext('2d');
    if (!ctx) return;
    
    bandwidthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Bandwidth Usage',
                data: [],
                borderColor: CHART_COLORS.bandwidth.border,
                backgroundColor: CHART_COLORS.bandwidth.background,
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            ...CHART_CONFIG,
            scales: {
                ...CHART_CONFIG.scales,
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Bandwidth (Mbps)'
                    }
                }
            }
        }
    });
}


function initResourcesChart() {
    const ctx = document.getElementById('resources-chart')?.getContext('2d');
    if (!ctx) return;
    
    resourceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'CPU Usage',
                    data: [],
                    borderColor: CHART_COLORS.cpu.border,
                    backgroundColor: CHART_COLORS.cpu.background,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Memory Usage',
                    data: [],
                    borderColor: CHART_COLORS.memory.border,
                    backgroundColor: CHART_COLORS.memory.background,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            ...CHART_CONFIG,
            scales: {
                ...CHART_CONFIG.scales,
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Usage (%)'
                    }
                }
            }
        }
    });
}


function initQualityChart() {
    const ctx = document.getElementById('quality-chart')?.getContext('2d');
    if (!ctx) return;
    
    qualityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Stream Quality',
                data: [],
                borderColor: CHART_COLORS.quality.border,
                backgroundColor: CHART_COLORS.quality.background,
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            ...CHART_CONFIG,
            scales: {
                ...CHART_CONFIG.scales,
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quality (Resolution Height)'
                    }
                }
            }
        }
    });
}

/**
 * Update connections chart with new data
 * @param {Array} data 
 * @param {Array} labels 
 */
function updateConnectionsChart(data, labels) {
    if (!connectionChart) return;
    
    connectionChart.data.labels = labels;
    connectionChart.data.datasets[0].data = data;
    connectionChart.update();
}

/**
 * Update bandwidth chart with new data
 * @param {Array} data 
 * @param {Array} labels 
 */
function updateBandwidthChart(data, labels) {
    if (!bandwidthChart) return;
    
    bandwidthChart.data.labels = labels;
    bandwidthChart.data.datasets[0].data = data;
    bandwidthChart.update();
}

/**
 * Update system resources chart with new data
 * @param {Array} cpuData 
 * @param {Array} memoryData 
 * @param {Array} labels 
 */
function updateResourcesChart(cpuData, memoryData, labels) {
    if (!resourceChart) return;
    
    resourceChart.data.labels = labels;
    resourceChart.data.datasets[0].data = cpuData;
    resourceChart.data.datasets[1].data = memoryData;
    resourceChart.update();
}

/**
 * Update quality chart with new data
 * @param {Array} data Array of quality data points
 * @param {Array} labels Array of time labels
 */
function updateQualityChart(data, labels) {
    if (!qualityChart) return;
    
    qualityChart.data.labels = labels;
    qualityChart.data.datasets[0].data = data;
    qualityChart.update();
}

/**
 * Format timestamp for chart display
 * @param {string} timestamp ISO timestamp string
 * @param {boolean} includeDate Whether to include the date
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp, includeDate = false) {
    const date = new Date(timestamp);
    
    if (includeDate) {
        return date.toLocaleString();
    } else {
        return date.toLocaleTimeString();
    }
}

/**
 * Format bytes to a human-readable string
 * @param {number} bytes Number of bytes
 * @param {number} decimals Number of decimal places
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format duration in seconds to a human-readable string
 * @param {number} seconds Duration in seconds
 * @returns {string} Formatted duration string (e.g., "1:23:45")
 */
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

/**
 * Fetch dashboard metrics data from the API
 * @param {string} timeRange Time range to fetch (e.g., "1h", "24h", "7d")
 * @returns {Promise} Promise resolving to metrics data
 */
function fetchMetricsData(timeRange = '1h') {
    let hours = 1;
    
    // Convert time range to hours
    if (timeRange === '1h') hours = 1;
    else if (timeRange === '6h') hours = 6;
    else if (timeRange === '12h') hours = 12;
    else if (timeRange === '24h') hours = 24;
    else if (timeRange === '7d') hours = 24 * 7;
    else if (timeRange === '30d') hours = 24 * 30;
    
    return fetch(`/api/metrics/server/history?hours=${hours}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error fetching metrics data:', error);
            return null;
        });
}

/**
 * Process metrics data for chart display
 * @param {Object} metricsData Raw metrics data from API
 * @returns {Object} Processed data for charts
 */
function processMetricsData(metricsData) {
    if (!metricsData || !metricsData.data || metricsData.data.length === 0) {
        return {
            timestamps: [],
            connections: [],
            bandwidth: [],
            cpu: [],
            memory: [],
            quality: []
        };
    }
    
    const timestamps = metricsData.data.map(item => formatTimestamp(item.timestamp));
    
    const connections = metricsData.data.map(item => 
        item.connections ? item.connections.total_connections : 0
    );
    
    const bandwidth = metricsData.data.map(item => {
        if (!item.network || !item.network.bytes_sent) return 0;
        
        
        return item.network.bytes_sent / 1024 / 1024 * 8; 
    });
    
    const cpu = metricsData.data.map(item =>
        item.system ? item.system.cpu_percent : 0
    );
    
    const memory = metricsData.data.map(item =>
        item.system ? item.system.memory_percent : 0
    );
    
    const quality = metricsData.data.map(item => {

        return item.streams && item.streams.quality ? item.streams.quality : 720;
    });
    
    return {
        timestamps,
        connections,
        bandwidth,
        cpu,
        memory,
        quality
    };
}

/**
 * Update all dashboard charts with new data
 * @param {string} timeRange Time range to display
 */
function updateDashboardCharts(timeRange = '1h') {
    fetchMetricsData(timeRange)
        .then(metricsData => {
            if (!metricsData) return;
            
            const {
                timestamps,
                connections,
                bandwidth,
                cpu,
                memory,
                quality
            } = processMetricsData(metricsData);
            
            updateConnectionsChart(connections, timestamps);
            updateBandwidthChart(bandwidth, timestamps);
            updateResourcesChart(cpu, memory, timestamps);
            updateQualityChart(quality, timestamps);
            
            // Update summary metrics
            updateSummaryMetrics(metricsData.data);
            
            console.log('Dashboard charts updated');
        })
        .catch(error => {
            console.error('Error updating dashboard charts:', error);
        });
}

/**
 * Update summary metric boxes
 * @param {Array} metricsData Array of metrics data points
 */
function updateSummaryMetrics(metricsData) {
    if (!metricsData || metricsData.length === 0) return;
    

    const latest = metricsData[metricsData.length - 1];
    

    const connectionsEl = document.getElementById('active-connections');
    if (connectionsEl && latest.connections) {
        connectionsEl.textContent = latest.connections.total_connections || 0;
    }
    

    const bandwidthEl = document.getElementById('total-bandwidth');
    if (bandwidthEl && latest.network) {
        const mbps = (latest.network.bytes_sent / 1024 / 1024 * 8).toFixed(2);
        bandwidthEl.textContent = `${mbps} Mbps`;
    }
    

    const serverLoadEl = document.getElementById('server-load');
    if (serverLoadEl && latest.system) {
        serverLoadEl.textContent = `${latest.system.cpu_percent}%`;
    }
    

    const activeStreamsEl = document.getElementById('active-streams');
    if (activeStreamsEl && latest.streams) {
        activeStreamsEl.textContent = latest.streams.active_streams || 0;
    }
}

/**
 * Set up event listeners for dashboard controls
 */
function setupDashboardControls() {

    const timeRangeSelect = document.getElementById('time-range');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', function() {
            updateDashboardCharts(this.value);
        });
    }
    

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const timeRange = timeRangeSelect ? timeRangeSelect.value : '1h';
            updateDashboardCharts(timeRange);
        });
    }
}

/**
 * Initialize the dashboard
 */
function initDashboard() {

    initializeCharts();
    

    setupDashboardControls();
    

    updateDashboardCharts('1h');
    

    setInterval(() => {
        const timeRange = document.getElementById('time-range')?.value || '1h';
        updateDashboardCharts(timeRange);
    }, 60000);
}


document.addEventListener('DOMContentLoaded', initDashboard);