// Advanced Charting System for Trading

class TradingCharts {
    constructor() {
        this.charts = new Map();
        this.theme = 'dark';
        this.timeframe = '1h';
        this.indicators = new Set(['sma', 'ema', 'rsi', 'macd']);
        this.initializeChartSystem();
    }

    initializeChartSystem() {
        console.log('📊 Trading Charts System Initializing...');
        
        this.setupChartThemes();
        this.initializeChartContainers();
        this.setupChartControls();
        this.loadChartData();
        
        console.log('✅ Trading Charts System Ready');
    }

    setupChartThemes() {
        // Chart.js global configuration
        Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        Chart.defaults.color = this.getThemeColor('text-secondary');
        Chart.defaults.borderColor = this.getThemeColor('border');
        
        // Dark theme colors
        this.chartColors = {
            primary: '#0ea5e9',
            success: '#22c55e',
            danger: '#ef4444',
            warning: '#f59e0b',
            background: '#0f172a',
            grid: '#1e293b',
            text: {
                primary: '#f8fafc',
                secondary: '#94a3b8'
            }
        };
    }

    initializeChartContainers() {
        // Initialize all chart containers on the page
        const chartContainers = document.querySelectorAll('[data-chart]');
        
        chartContainers.forEach(container => {
            const chartType = container.dataset.chart;
            this.initializeChart(container, chartType);
        });
    }

    setupChartControls() {
        // Timeframe controls
        const timeframeBtns = document.querySelectorAll('.timeframe-btn');
        timeframeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeTimeframe(btn.dataset.timeframe);
            });
        });

        // Indicator controls
        const indicatorToggles = document.querySelectorAll('[data-indicator]');
        indicatorToggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                this.toggleIndicator(toggle.dataset.indicator, toggle.checked);
            });
        });

        // Chart type controls
        const chartTypeBtns = document.querySelectorAll('[data-chart-type]');
        chartTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeChartType(btn.dataset.chartType);
            });
        });
    }

    initializeChart(container, chartType) {
        const ctx = container.getContext('2d');
        const chartId = container.id;
        
        let chart;
        
        switch (chartType) {
            case 'price':
                chart = this.createPriceChart(ctx, chartId);
                break;
            case 'volume':
                chart = this.createVolumeChart(ctx, chartId);
                break;
            case 'performance':
                chart = this.createPerformanceChart(ctx, chartId);
                break;
            case 'distribution':
                chart = this.createDistributionChart(ctx, chartId);
                break;
            default:
                chart = this.createPriceChart(ctx, chartId);
        }
        
        this.charts.set(chartId, chart);
        return chart;
    }

    createPriceChart(ctx, chartId) {
        const data = this.generateSamplePriceData();
        
        return new Chart(ctx, {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: 'Price',
                    data: data,
                    color: {
                        up: '#22c55e',
                        down: '#ef4444',
                        unchanged: '#94a3b8'
                    }
                }]
            },
            options: this.getPriceChartOptions()
        });
    }

    createVolumeChart(ctx, chartId) {
        const data = this.generateSampleVolumeData();
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Volume',
                    data: data.volumes,
                    backgroundColor: data.colors,
                    borderColor: data.colors,
                    borderWidth: 1
                }]
            },
            options: this.getVolumeChartOptions()
        });
    }

    createPerformanceChart(ctx, chartId) {
        const data = this.generatePerformanceData();
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Portfolio Value',
                    data: data.values,
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: this.getPerformanceChartOptions()
        });
    }

    createDistributionChart(ctx, chartId) {
        const data = this.generateDistributionData();
        
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#0ea5e9',
                        '#22c55e',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6'
                    ],
                    borderWidth: 2,
                    borderColor: this.chartColors.background
                }]
            },
            options: this.getDistributionChartOptions()
        });
    }

    getPriceChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: this.chartColors.text.primary,
                    bodyColor: this.chartColors.text.primary,
                    borderColor: this.chartColors.primary,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return [
                                `Open: ${point.o}`,
                                `High: ${point.h}`,
                                `Low: ${point.l}`,
                                `Close: ${point.c}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute'
                    },
                    grid: {
                        color: this.chartColors.grid
                    },
                    ticks: {
                        color: this.chartColors.text.secondary
                    }
                },
                y: {
                    position: 'right',
                    grid: {
                        color: this.chartColors.grid
                    },
                    ticks: {
                        color: this.chartColors.text.secondary,
                        callback: function(value) {
                            return value.toFixed(4);
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        };
    }

    getVolumeChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: this.chartColors.text.secondary
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: this.chartColors.grid
                    },
                    ticks: {
                        color: this.chartColors.text.secondary,
                        callback: function(value) {
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            }
                            if (value >= 1000) {
                                return (value / 1000).toFixed(1) + 'K';
                            }
                            return value;
                        }
                    }
                }
            }
        };
    }

    getPerformanceChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: this.chartColors.text.secondary
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Value: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: this.chartColors.grid
                    },
                    ticks: {
                        color: this.chartColors.text.secondary
                    }
                },
                y: {
                    grid: {
                        color: this.chartColors.grid
                    },
                    ticks: {
                        color: this.chartColors.text.secondary,
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        };
    }

    getDistributionChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: this.chartColors.text.secondary,
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${percentage}% (${value})`;
                        }
                    }
                }
            },
            cutout: '60%'
        };
    }

    generateSamplePriceData() {
        // Generate sample candlestick data
        const data = [];
        let basePrice = 1.0950;
        const now = new Date();
        
        for (let i = 100; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 60000)); // 1-minute intervals
            
            const open = basePrice;
            const volatility = 0.001; // 0.1%
            const change = (Math.random() - 0.5) * 2 * volatility;
            const close = open * (1 + change);
            
            const high = Math.max(open, close) * (1 + Math.random() * volatility);
            const low = Math.min(open, close) * (1 - Math.random() * volatility);
            
            data.push({
                x: time,
                o: open,
                h: high,
                l: low,
                c: close
            });
            
            basePrice = close;
        }
        
        return data;
    }

    generateSampleVolumeData() {
        const labels = [];
        const volumes = [];
        const colors = [];
        const now = new Date();
        
        for (let i = 30; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 60000));
            labels.push(time.toLocaleTimeString());
            
            const volume = Math.random() * 10000 + 5000;
            volumes.push(volume);
            
            // Green for up periods, red for down
            colors.push(i % 2 === 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)');
        }
        
        return { labels, volumes, colors };
    }

    generatePerformanceData() {
        const labels = [];
        const values = [];
        let value = 1000; // Starting value
        
        for (let i = 0; i < 50; i++) {
            labels.push(`Day ${i + 1}`);
            
            // Random growth with some volatility
            const change = (Math.random() - 0.45) * 0.1; // -4.5% to +5.5%
            value *= (1 + change);
            values.push(value);
        }
        
        return { labels, values };
    }

    generateDistributionData() {
        return {
            labels: ['EUR/USD', 'GBP/USD', 'XAU/USD', 'BTC/USD', 'Other'],
            values: [35, 25, 20, 15, 5]
        };
    }

    async changeTimeframe(timeframe) {
        this.timeframe = timeframe;
        
        // Update active timeframe button
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.timeframe === timeframe);
        });
        
        // Reload chart data with new timeframe
        await this.loadChartData();
        
        // Update all charts
        this.updateAllCharts();
    }

    toggleIndicator(indicator, enabled) {
        if (enabled) {
            this.indicators.add(indicator);
        } else {
            this.indicators.delete(indicator);
        }
        
        this.updateChartIndicators();
    }

    changeChartType(chartType) {
        // This would typically recreate the chart with new type
        console.log(`Changing chart type to: ${chartType}`);
    }

    async loadChartData() {
        // Simulate loading chart data
        console.log(`Loading chart data for timeframe: ${this.timeframe}`);
        
        // In real implementation, this would fetch data from API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return this.generateSamplePriceData();
    }

    updateAllCharts() {
        this.charts.forEach((chart, chartId) => {
            this.updateChartData(chart, chartId);
        });
    }

    updateChartData(chart, chartId) {
        let newData;
        
        switch (chartId) {
            case 'priceChart':
                newData = this.generateSamplePriceData();
                chart.data.datasets[0].data = newData;
                break;
            case 'volumeChart':
                newData = this.generateSampleVolumeData();
                chart.data.labels = newData.labels;
                chart.data.datasets[0].data = newData.volumes;
                chart.data.datasets[0].backgroundColor = newData.colors;
                break;
            case 'performanceChart':
                newData = this.generatePerformanceData();
                chart.data.labels = newData.labels;
                chart.data.datasets[0].data = newData.values;
                break;
        }
        
        chart.update('none'); // Update without animation for performance
    }

    updateChartIndicators() {
        // Update chart with selected indicators
        this.charts.forEach((chart, chartId) => {
            if (chartId === 'priceChart') {
                this.addTechnicalIndicators(chart);
            }
        });
    }

    addTechnicalIndicators(chart) {
        // Clear existing indicator datasets
        chart.data.datasets = chart.data.datasets.filter(ds => 
            !ds.label.includes('MA') && !ds.label.includes('RSI') && !ds.label.includes('MACD')
        );
        
        // Add selected indicators
        if (this.indicators.has('sma')) {
            this.addSMA(chart);
        }
        
        if (this.indicators.has('ema')) {
            this.addEMA(chart);
        }
        
        if (this.indicators.has('rsi')) {
            this.addRSI(chart);
        }
        
        if (this.indicators.has('macd')) {
            this.addMACD(chart);
        }
        
        chart.update();
    }

    addSMA(chart) {
        const priceData = chart.data.datasets[0].data;
        const smaData = this.calculateSMA(priceData, 20);
        
        chart.data.datasets.push({
            label: 'SMA 20',
            data: smaData,
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1
        });
    }

    addEMA(chart) {
        const priceData = chart.data.datasets[0].data;
        const emaData = this.calculateEMA(priceData, 12);
        
        chart.data.datasets.push({
            label: 'EMA 12',
            data: emaData,
            borderColor: '#8b5cf6',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1
        });
    }

    addRSI(chart) {
        // RSI would typically be shown in a separate subchart
        console.log('Adding RSI indicator');
    }

    addMACD(chart) {
        // MACD would typically be shown in a separate subchart
        console.log('Adding MACD indicator');
    }

    calculateSMA(data, period) {
        const sma = [];
        
        for (let i = period - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].c; // Use close price
            }
            sma.push({
                x: data[i].x,
                y: sum / period
            });
        }
        
        return sma;
    }

    calculateEMA(data, period) {
        const ema = [];
        const multiplier = 2 / (period + 1);
        
        // Start with SMA
        let sum = 0;
        for (let i = 0; i < period; i++) {
            sum += data[i].c;
        }
        ema.push({
            x: data[period - 1].x,
            y: sum / period
        });
        
        // Calculate EMA for remaining points
        for (let i = period; i < data.length; i++) {
            const emaValue = (data[i].c - ema[ema.length - 1].y) * multiplier + ema[ema.length - 1].y;
            ema.push({
                x: data[i].x,
                y: emaValue
            });
        }
        
        return ema;
    }

    getThemeColor(type) {
        const colors = {
            'background': '#0f172a',
            'grid': '#1e293b',
            'text-primary': '#f8fafc',
            'text-secondary': '#94a3b8',
            'border': '#334155'
        };
        
        return colors[type] || '#000000';
    }

    // Public methods for external use
    updateChartWithLiveData(symbol, data) {
        const chart = this.charts.get('priceChart');
        if (chart) {
            this.addLiveDataPoint(chart, data);
        }
    }

    addLiveDataPoint(chart, dataPoint) {
        const currentData = chart.data.datasets[0].data;
        
        // Add new data point
        currentData.push({
            x: new Date(),
            o: dataPoint.open,
            h: dataPoint.high,
            l: dataPoint.low,
            c: dataPoint.close
        });
        
        // Remove oldest point if we have too many
        if (currentData.length > 200) {
            currentData.shift();
        }
        
        // Update indicators
        this.updateChartIndicators();
        
        // Smooth update
        chart.update('none');
    }

    exportChartAsImage(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            const image = chart.toBase64Image();
            this.downloadImage(image, `chart-${chartId}-${new Date().toISOString().split('T')[0]}.png`);
        }
    }

    downloadImage(imageData, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = imageData;
        link.click();
    }

    // Performance optimization
    debounceChartUpdate() {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        this.updateTimeout = setTimeout(() => {
            this.updateAllCharts();
        }, 100);
    }

    // Memory management
    destroyChart(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.destroy();
            this.charts.delete(chartId);
        }
    }

    destroyAllCharts() {
        this.charts.forEach((chart, chartId) => {
            chart.destroy();
        });
        this.charts.clear();
    }
}

// Custom candlestick chart controller
Chart.register({
    id: 'candlestick',
    beforeDraw: function(chart, args, options) {
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);
        
        meta.data.forEach((element, index) => {
            const point = chart.data.datasets[0].data[index];
            
            if (!point) return;
            
            const { x, y, base } = element;
            const open = point.o;
            const high = point.h;
            const low = point.l;
            const close = point.c;
            
            // Determine color
            const color = close >= open ? '#22c55e' : '#ef4444';
            
            // Draw high-low line
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, chart.scales.y.getPixelForValue(high));
            ctx.lineTo(x, chart.scales.y.getPixelForValue(low));
            ctx.stroke();
            
            // Draw open-close box
            const boxTop = chart.scales.y.getPixelForValue(Math.max(open, close));
            const boxBottom = chart.scales.y.getPixelForValue(Math.min(open, close));
            const boxHeight = boxBottom - boxTop;
            
            if (boxHeight > 0) {
                ctx.fillStyle = color;
                ctx.fillRect(x - 3, boxTop, 6, boxHeight);
            }
            
            ctx.restore();
        });
    }
});

// Initialize charts when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tradingCharts = new TradingCharts();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TradingCharts;
              }
