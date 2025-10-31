// Exness AI Trading - Main JavaScript File

class ExnessAITrading {
    constructor() {
        this.isInitialized = false;
        this.socket = null;
        this.liveDataInterval = null;
        this.currentUser = null;
        this.tradingStatus = 'stopped';
        this.marketData = {};
        this.initializeApp();
    }

    initializeApp() {
        console.log('🚀 Exness AI Trading System Initializing...');
        
        // Initialize components
        this.initializeEventListeners();
        this.initializeSocketConnection();
        this.initializeLiveDataUpdates();
        this.initializeCharts();
        this.initializeNotifications();
        
        this.isInitialized = true;
        console.log('✅ Exness AI Trading System Ready');
        
        // Show welcome notification
        this.showNotification('Exness AI Trading System প্রস্তুত!', 'success');
    }

    initializeEventListeners() {
        // Global event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.handleDOMReady();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window focus/blur events
        window.addEventListener('focus', () => {
            this.handleWindowFocus();
        });

        window.addEventListener('blur', () => {
            this.handleWindowBlur();
        });

        // Online/offline detection
        window.addEventListener('online', () => {
            this.handleOnlineStatus();
        });

        window.addEventListener('offline', () => {
            this.handleOfflineStatus();
        });
    }

    initializeSocketConnection() {
        // WebSocket connection for real-time data
        try {
            // For demo purposes, we'll simulate WebSocket behavior
            console.log('🔌 WebSocket connection initialized (simulated)');
            
            // Simulate real-time data updates
            this.simulateRealTimeData();
            
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.showNotification('রিয়েল-টাইম ডাটা কানেকশন ব্যর্থ', 'error');
        }
    }

    initializeLiveDataUpdates() {
        // Live data update interval
        this.liveDataInterval = setInterval(() => {
            this.updateLiveData();
        }, 3000); // Update every 3 seconds
    }

    initializeCharts() {
        // Initialize trading charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.initializeTradingCharts();
        }
    }

    initializeNotifications() {
        // Initialize notification system
        this.notificationQueue = [];
        this.isNotificationShowing = false;
        
        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(container);
        }
    }

    handleDOMReady() {
        console.log('📄 DOM fully loaded and parsed');
        
        // Update user info if logged in
        this.updateUserInfo();
        
        // Initialize page-specific functionality
        this.initializePageSpecificFeatures();
        
        // Check authentication status
        this.checkAuthentication();
    }

    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + S - Start trading
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.quickStartTrading();
        }
        
        // Ctrl/Cmd + P - Stop trading
        if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
            event.preventDefault();
            this.quickStopTrading();
        }
        
        // Ctrl/Cmd + Q - Get suggestions
        if ((event.ctrlKey || event.metaKey) && event.key === 'q') {
            event.preventDefault();
            this.getAISuggestions();
        }
        
        // F11 - Toggle fullscreen
        if (event.key === 'F11') {
            event.preventDefault();
            this.toggleFullscreen();
        }
    }

    handleWindowFocus() {
        console.log('🔄 Window focused - refreshing data');
        this.refreshAllData();
    }

    handleWindowBlur() {
        console.log('💤 Window blurred');
        // Reduce update frequency when not focused
        this.adjustUpdateFrequency(false);
    }

    handleOnlineStatus() {
        console.log('🌐 Online - reconnecting...');
        this.showNotification('ইন্টারনেট কানেকশন পুনরুদ্ধার হয়েছে', 'success');
        this.reconnectServices();
    }

    handleOfflineStatus() {
        console.log('❌ Offline - pausing updates');
        this.showNotification('ইন্টারনেট কানেকশন বিচ্ছিন্ন হয়েছে', 'error');
        this.pauseLiveUpdates();
    }

    async updateLiveData() {
        try {
            const response = await fetch('/get_live_data');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.processLiveData(data.data);
                this.updateDashboard(data.data);
            }
        } catch (error) {
            console.error('Live data update failed:', error);
            this.handleDataUpdateError(error);
        }
    }

    processLiveData(data) {
        // Process and store live data
        this.marketData = data;
        
        // Update global progress if available
        if (data.performance) {
            this.updateGlobalProgress(data.performance);
        }
        
        // Update trading status
        if (data.session_info) {
            this.updateTradingStatus(data.session_info.status);
        }
    }

    updateDashboard(data) {
        // Update dashboard elements with new data
        this.updateBalanceDisplay(data);
        this.updateMarketOverview(data);
        this.updateActiveTrades(data);
        this.updatePerformanceMetrics(data);
    }

    updateBalanceDisplay(data) {
        const balanceElements = document.querySelectorAll('[data-balance]');
        const balance = data.session_info?.current_balance || 0;
        
        balanceElements.forEach(element => {
            element.textContent = `$${balance.toFixed(2)}`;
        });
    }

    updateMarketOverview(data) {
        const marketContainer = document.getElementById('marketOverview');
        if (!marketContainer) return;
        
        if (data.market_overview && data.market_overview.length > 0) {
            let html = '';
            
            data.market_overview.forEach(symbol => {
                const changeClass = symbol.change >= 0 ? 'text-green-400' : 'text-red-400';
                const changeIcon = symbol.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                
                html += `
                    <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                                <i class="fas fa-chart-line text-cyan-400"></i>
                            </div>
                            <div>
                                <div class="font-semibold text-white">${symbol.symbol}</div>
                                <div class="text-sm text-gray-400">${symbol.price.toFixed(4)}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="flex items-center space-x-1 ${changeClass}">
                                <i class="fas ${changeIcon} text-xs"></i>
                                <span class="font-semibold">${Math.abs(symbol.change).toFixed(2)}%</span>
                            </div>
                            <div class="text-xs text-gray-400">${symbol.signal}</div>
                        </div>
                    </div>
                `;
            });
            
            marketContainer.innerHTML = html;
        }
    }

    updateActiveTrades(data) {
        const activeTradesElement = document.getElementById('activeTrades');
        if (activeTradesElement && data.active_trades) {
            activeTradesElement.textContent = data.active_trades.length;
        }
    }

    updatePerformanceMetrics(data) {
        if (!data.performance) return;
        
        const metrics = data.performance;
        
        // Update progress
        const progressElement = document.getElementById('progressPercent');
        const progressBar = document.getElementById('targetProgressBar');
        if (progressElement && progressBar) {
            progressElement.textContent = Math.round(metrics.progress_percentage || 0);
            progressBar.style.width = `${metrics.progress_percentage || 0}%`;
        }
        
        // Update success rate
        const successRateElement = document.getElementById('successRate');
        if (successRateElement) {
            successRateElement.textContent = Math.round(metrics.success_rate || 0);
        }
        
        // Update profit/loss text
        const profitLossElement = document.getElementById('profitLossText');
        if (profitLossElement) {
            const totalProfit = metrics.total_profit || 0;
            const textClass = totalProfit >= 0 ? 'text-green-400' : 'text-red-400';
            const icon = totalProfit >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            
            profitLossElement.innerHTML = `
                <i class="fas ${icon} ${textClass} mr-1"></i>
                <span class="${textClass}">$${Math.abs(totalProfit).toFixed(2)}</span>
            `;
        }
    }

    updateGlobalProgress(performance) {
        const progressBar = document.getElementById('progressBar');
        const progressPercentage = document.getElementById('progressPercentage');
        const globalProgress = document.getElementById('globalProgress');
        
        if (progressBar && progressPercentage) {
            const progress = performance.progress_percentage || 0;
            progressBar.style.width = `${progress}%`;
            progressPercentage.textContent = `${Math.round(progress)}%`;
            
            // Show/hide global progress bar
            if (globalProgress) {
                if (progress > 0 && progress < 100) {
                    globalProgress.classList.remove('hidden');
                } else {
                    globalProgress.classList.add('hidden');
                }
            }
        }
    }

    updateTradingStatus(status) {
        this.tradingStatus = status;
        
        const statusElement = document.getElementById('tradingStatus');
        const aiStatusElement = document.getElementById('aiStatus');
        
        if (statusElement && aiStatusElement) {
            if (status === 'running') {
                statusElement.innerHTML = `
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-sm">চালু</span>
                `;
                aiStatusElement.className = 'w-3 h-3 bg-green-500 rounded-full animate-pulse';
            } else {
                statusElement.innerHTML = `
                    <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span class="text-sm">বন্ধ</span>
                `;
                aiStatusElement.className = 'w-3 h-3 bg-red-500 rounded-full';
            }
        }
    }

    async quickStartTrading() {
        const initialAmount = document.getElementById('initialAmount')?.value || 5;
        const targetAmount = document.getElementById('targetAmount')?.value || 7;
        
        try {
            const response = await fetch('/start_trading', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    initial_amount: parseFloat(initialAmount),
                    target_amount: parseFloat(targetAmount)
                })
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                this.showNotification('ট্রেডিং সফলভাবে শুরু হয়েছে!', 'success');
                this.updateTradingStatus('running');
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Quick start trading failed:', error);
            this.showNotification('ট্রেডিং শুরু করতে ব্যর্থ', 'error');
        }
    }

    async quickStopTrading() {
        try {
            const response = await fetch('/stop_trading', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                this.showNotification('ট্রেডিং বন্ধ করা হয়েছে', 'warning');
                this.updateTradingStatus('stopped');
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Quick stop trading failed:', error);
            this.showNotification('ট্রেডিং বন্ধ করতে ব্যর্থ', 'error');
        }
    }

    async getAISuggestions() {
        try {
            const response = await fetch('/get_suggestions');
            const result = await response.json();
            
            if (result.status === 'success') {
                this.displayAISuggestions(result.suggestions);
                this.showNotification('AI সুজেশন আপডেট করা হয়েছে', 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Get AI suggestions failed:', error);
            this.showNotification('সুজেশন লোড করতে ব্যর্থ', 'error');
        }
    }

    displayAISuggestions(suggestions) {
        const container = document.getElementById('aiSuggestions');
        if (!container) return;
        
        if (suggestions && suggestions.length > 0) {
            let html = '';
            
            suggestions.forEach((suggestion, index) => {
                const confidenceClass = suggestion.profit_probability > 90 ? 'high-confidence' : 
                                      suggestion.profit_probability > 80 ? 'medium-confidence' : 'low-confidence';
                
                html += `
                    <div class="suggestion-card ${confidenceClass}">
                        <div class="flex justify-between items-start mb-2">
                            <div class="font-semibold text-white">${suggestion.token}</div>
                            <div class="flex items-center space-x-1">
                                <span class="text-sm font-semibold ${suggestion.profit_probability > 90 ? 'text-green-400' : suggestion.profit_probability > 80 ? 'text-yellow-400' : 'text-red-400'}">
                                    ${suggestion.profit_probability}%
                                </span>
                                <i class="fas ${suggestion.action === 'BUY' ? 'fa-arrow-up text-green-400' : 'fa-arrow-down text-red-400'}"></i>
                            </div>
                        </div>
                        <div class="text-sm text-gray-300 mb-2">${suggestion.analysis}</div>
                        <div class="flex justify-between text-xs text-gray-400">
                            <span>রিস্ক: ${suggestion.risk_level}%</span>
                            <span>রিটার্ন: ${suggestion.expected_return}%</span>
                            <span>কনফিডেন্স: ${suggestion.confidence_score}/10</span>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} slide-in-right`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${icons[type]} mr-3"></i>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Play notification sound
        this.playNotificationSound();
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.classList.add('slide-out-right');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    playNotificationSound() {
        const audio = document.getElementById('notificationSound');
        if (audio) {
            audio.play().catch(e => {
                console.log('Audio play failed:', e);
            });
        }
    }

    simulateRealTimeData() {
        // Simulate real-time market data updates
        setInterval(() => {
            this.updateSimulatedMarketData();
        }, 2000);
    }

    updateSimulatedMarketData() {
        // Update simulated market data for demo
        const symbols = ['EUR/USD', 'GBP/USD', 'XAU/USD', 'BTC/USD'];
        
        symbols.forEach(symbol => {
            if (!this.marketData[symbol]) {
                this.marketData[symbol] = {
                    price: this.getRandomPrice(symbol),
                    change: 0,
                    signal: 'HOLD'
                };
            } else {
                const change = (Math.random() - 0.5) * 0.2;
                this.marketData[symbol].price *= (1 + change / 100);
                this.marketData[symbol].change = change;
                this.marketData[symbol].signal = change > 0 ? 'BUY' : 'SELL';
            }
        });
    }

    getRandomPrice(symbol) {
        const basePrices = {
            'EUR/USD': 1.0950,
            'GBP/USD': 1.2750,
            'XAU/USD': 1980.00,
            'BTC/USD': 42000.00
        };
        return basePrices[symbol] || 1.0;
    }

    updateUserInfo() {
        // Update user information in the UI
        const userElements = document.querySelectorAll('[data-user]');
        userElements.forEach(element => {
            // In a real app, this would come from the server
            element.textContent = 'DEMO_USER';
        });
    }

    initializePageSpecificFeatures() {
        const currentPage = document.body.dataset.page;
        
        switch (currentPage) {
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'trading':
                this.initializeTradingPage();
                break;
            case 'analytics':
                this.initializeAnalyticsPage();
                break;
            case 'ai-chat':
                this.initializeAIChat();
                break;
        }
    }

    initializeDashboard() {
        console.log('Initializing dashboard...');
        // Dashboard-specific initialization
    }

    initializeTradingPage() {
        console.log('Initializing trading page...');
        // Trading page-specific initialization
    }

    initializeAnalyticsPage() {
        console.log('Initializing analytics page...');
        // Analytics page-specific initialization
    }

    initializeAIChat() {
        console.log('Initializing AI chat...');
        // AI chat-specific initialization
    }

    checkAuthentication() {
        // Check if user is authenticated
        // This would typically check cookies or tokens
        console.log('Checking authentication status...');
    }

    refreshAllData() {
        console.log('Refreshing all data...');
        this.updateLiveData();
    }

    adjustUpdateFrequency(isFocused) {
        if (this.liveDataInterval) {
            clearInterval(this.liveDataInterval);
        }
        
        const interval = isFocused ? 3000 : 10000; // 3s when focused, 10s when not
        this.liveDataInterval = setInterval(() => {
            this.updateLiveData();
        }, interval);
    }

    reconnectServices() {
        console.log('Reconnecting services...');
        this.initializeSocketConnection();
        this.adjustUpdateFrequency(true);
    }

    pauseLiveUpdates() {
        if (this.liveDataInterval) {
            clearInterval(this.liveDataInterval);
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Fullscreen error: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    handleDataUpdateError(error) {
        console.error('Data update error:', error);
        
        // Update connection status
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.className = 'w-3 h-3 bg-red-500 rounded-full';
        }
        
        // Show error notification only if not already showing
        if (!this.lastError || Date.now() - this.lastError > 10000) {
            this.showNotification('ডাটা আপডেট ব্যর্থ - চেক ইন্টারনেট কানেকশন', 'error');
            this.lastError = Date.now();
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatPercentage(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value / 100);
    }

    formatNumber(value) {
        return new Intl.NumberFormat('en-US').format(value);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize the application when the script loads
document.addEventListener('DOMContentLoaded', () => {
    window.exnessAI = new ExnessAITrading();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExnessAITrading;
          }
