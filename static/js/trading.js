// Trading-specific JavaScript functionality

class TradingEngine {
    constructor() {
        this.isTradingActive = false;
        this.activeTrades = [];
        this.pendingOrders = [];
        this.tradingHistory = [];
        this.marketData = {};
        this.initializeTradingEngine();
    }

    initializeTradingEngine() {
        console.log('🎯 Trading Engine Initializing...');
        
        this.initializeTradingEvents();
        this.initializeOrderManagement();
        this.initializeRiskManagement();
        this.initializeTradingStrategies();
        
        console.log('✅ Trading Engine Ready');
    }

    initializeTradingEvents() {
        // Trading control events
        this.setupTradingControls();
        this.setupOrderEvents();
        this.setupMarketDataEvents();
    }

    initializeOrderManagement() {
        this.orderQueue = [];
        this.isProcessingOrders = false;
        
        // Order processing interval
        setInterval(() => {
            this.processOrderQueue();
        }, 1000);
    }

    initializeRiskManagement() {
        this.riskParameters = {
            maxDrawdown: 0.10, // 10%
            maxRiskPerTrade: 0.02, // 2%
            dailyLossLimit: 0.05, // 5%
            maxConcurrentTrades: 3,
            stopLossPercentage: 0.01, // 1%
            takeProfitPercentage: 0.02 // 2%
        };
        
        this.riskMetrics = {
            dailyPnL: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            maxConsecutiveLosses: 0,
            currentConsecutiveLosses: 0
        };
    }

    initializeTradingStrategies() {
        this.strategies = {
            conservative: {
                riskMultiplier: 0.5,
                minConfidence: 0.90,
                maxTradesPerHour: 2
            },
            moderate: {
                riskMultiplier: 1.0,
                minConfidence: 0.85,
                maxTradesPerHour: 5
            },
            aggressive: {
                riskMultiplier: 1.5,
                minConfidence: 0.80,
                maxTradesPerHour: 10
            }
        };
        
        this.currentStrategy = 'moderate';
    }

    setupTradingControls() {
        // Start trading button
        const startBtn = document.getElementById('startTradingBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startTradingSession();
            });
        }

        // Stop trading button
        const stopBtn = document.getElementById('stopTradingBtn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopTradingSession();
            });
        }

        // Quick start/stop buttons
        const quickStart = document.getElementById('quickStartTrading');
        const quickStop = document.getElementById('quickStopTrading');
        
        if (quickStart) {
            quickStart.addEventListener('click', () => {
                this.quickStartTrading();
            });
        }
        
        if (quickStop) {
            quickStop.addEventListener('click', () => {
                this.quickStopTrading();
            });
        }
    }

    setupOrderEvents() {
        // Order form submission
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.placeManualOrder();
            });
        }

        // Order type selection
        const orderTypeBtns = document.querySelectorAll('.order-type-btn');
        orderTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectOrderType(btn.dataset.type);
            });
        });
    }

    setupMarketDataEvents() {
        // Market data subscription
        this.subscribeToMarketData();
        
        // Price alert setup
        this.setupPriceAlerts();
    }

    async startTradingSession() {
        if (this.isTradingActive) {
            this.showTradingMessage('ট্রেডিং ইতিমধ্যেই চালু আছে', 'warning');
            return;
        }

        const initialAmount = document.getElementById('initialAmount')?.value || 5;
        const targetAmount = document.getElementById('targetAmount')?.value || 7;
        const strategy = document.getElementById('tradingStrategy')?.value || 'moderate';

        try {
            this.showLoadingState('startTradingBtn', 'শুরু হচ্ছে...');
            
            const response = await fetch('/start_trading', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    initial_amount: parseFloat(initialAmount),
                    target_amount: parseFloat(targetAmount),
                    strategy_config: this.strategies[strategy]
                })
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                this.isTradingActive = true;
                this.currentStrategy = strategy;
                this.tradingSessionId = result.session_id;
                
                this.showTradingMessage('ট্রেডিং সেশন শুরু হয়েছে!', 'success');
                this.updateTradingUI('active');
                this.startAITrading();
            } else {
                this.showTradingMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Trading session start failed:', error);
            this.showTradingMessage('ট্রেডিং শুরু করতে ব্যর্থ', 'error');
        } finally {
            this.hideLoadingState('startTradingBtn', 'ট্রেডিং শুরু করুন');
        }
    }

    async stopTradingSession() {
        if (!this.isTradingActive) {
            this.showTradingMessage('কোনো এক্টিভ ট্রেডিং সেশন নেই', 'warning');
            return;
        }

        try {
            this.showLoadingState('stopTradingBtn', 'বন্ধ হচ্ছে...');
            
            const response = await fetch('/stop_trading', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                this.isTradingActive = false;
                this.showTradingMessage('ট্রেডিং সেশন বন্ধ করা হয়েছে', 'warning');
                this.updateTradingUI('inactive');
                this.stopAITrading();
                
                // Show performance summary
                if (result.performance) {
                    this.showPerformanceSummary(result.performance);
                }
            } else {
                this.showTradingMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Trading session stop failed:', error);
            this.showTradingMessage('ট্রেডিং বন্ধ করতে ব্যর্থ', 'error');
        } finally {
            this.hideLoadingState('stopTradingBtn', 'ট্রেডিং বন্ধ করুন');
        }
    }

    quickStartTrading() {
        const initialAmount = 5;
        const targetAmount = 7;
        
        // Set values in form
        const initialInput = document.getElementById('initialAmount');
        const targetInput = document.getElementById('targetAmount');
        
        if (initialInput) initialInput.value = initialAmount;
        if (targetInput) targetInput.value = targetAmount;
        
        // Start trading
        this.startTradingSession();
    }

    quickStopTrading() {
        this.stopTradingSession();
    }

    startAITrading() {
        console.log('🤖 AI Trading Started');
        
        // Start AI trading analysis
        this.aiTradingInterval = setInterval(() => {
            this.executeAITradingCycle();
        }, 5000); // Run every 5 seconds
        
        // Start risk monitoring
        this.riskMonitorInterval = setInterval(() => {
            this.monitorRisk();
        }, 3000);
    }

    stopAITrading() {
        console.log('🛑 AI Trading Stopped');
        
        if (this.aiTradingInterval) {
            clearInterval(this.aiTradingInterval);
        }
        
        if (this.riskMonitorInterval) {
            clearInterval(this.riskMonitorInterval);
        }
        
        // Close all active trades
        this.closeAllTrades();
    }

    async executeAITradingCycle() {
        if (!this.isTradingActive) return;
        
        try {
            // Get market analysis
            const analysis = await this.getMarketAnalysis();
            
            // Evaluate trading signals
            const signals = this.evaluateTradingSignals(analysis);
            
            // Execute trades based on signals
            await this.executeTrades(signals);
            
            // Update trading dashboard
            this.updateTradingDashboard();
            
        } catch (error) {
            console.error('AI trading cycle failed:', error);
        }
    }

    async getMarketAnalysis() {
        // Simulated market analysis
        // In real implementation, this would call the AI analysis API
        
        return {
            timestamp: new Date(),
            symbols: this.generateSimulatedSignals(),
            marketCondition: this.assessMarketCondition(),
            riskLevel: this.calculateRiskLevel()
        };
    }

    generateSimulatedSignals() {
        const symbols = ['EUR/USD', 'GBP/USD', 'XAU/USD', 'BTC/USD'];
        const signals = [];
        
        symbols.forEach(symbol => {
            const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
            const action = confidence > 0.85 ? 'BUY' : confidence > 0.75 ? 'SELL' : 'HOLD';
            
            signals.push({
                symbol,
                action,
                confidence,
                entryPrice: this.getCurrentPrice(symbol),
                stopLoss: this.calculateStopLoss(symbol, action),
                takeProfit: this.calculateTakeProfit(symbol, action),
                lotSize: this.calculateLotSize(confidence),
                riskRewardRatio: this.calculateRiskRewardRatio(symbol, action)
            });
        });
        
        return signals;
    }

    getCurrentPrice(symbol) {
        // Simulated current price
        const basePrices = {
            'EUR/USD': 1.0950,
            'GBP/USD': 1.2750,
            'XAU/USD': 1980.00,
            'BTC/USD': 42000.00
        };
        
        const basePrice = basePrices[symbol] || 1.0;
        const variation = (Math.random() - 0.5) * 0.01; // ±0.5%
        return basePrice * (1 + variation);
    }

    calculateStopLoss(symbol, action) {
        const currentPrice = this.getCurrentPrice(symbol);
        const stopLossPercent = this.riskParameters.stopLossPercentage;
        
        return action === 'BUY' 
            ? currentPrice * (1 - stopLossPercent)
            : currentPrice * (1 + stopLossPercent);
    }

    calculateTakeProfit(symbol, action) {
        const currentPrice = this.getCurrentPrice(symbol);
        const takeProfitPercent = this.riskParameters.takeProfitPercentage;
        
        return action === 'BUY'
            ? currentPrice * (1 + takeProfitPercent)
            : currentPrice * (1 - takeProfitPercent);
    }

    calculateLotSize(confidence) {
        const baseLotSize = 0.01;
        const strategyMultiplier = this.strategies[this.currentStrategy].riskMultiplier;
        const confidenceMultiplier = confidence;
        
        return Math.min(1.0, baseLotSize * strategyMultiplier * confidenceMultiplier);
    }

    calculateRiskRewardRatio(symbol, action) {
        const currentPrice = this.getCurrentPrice(symbol);
        const stopLoss = this.calculateStopLoss(symbol, action);
        const takeProfit = this.calculateTakeProfit(symbol, action);
        
        const risk = Math.abs(currentPrice - stopLoss);
        const reward = Math.abs(takeProfit - currentPrice);
        
        return reward / risk;
    }

    evaluateTradingSignals(analysis) {
        const minConfidence = this.strategies[this.currentStrategy].minConfidence;
        
        return analysis.symbols.filter(signal => 
            signal.confidence >= minConfidence && 
            signal.riskRewardRatio >= 1.5 &&
            signal.action !== 'HOLD'
        );
    }

    async executeTrades(signals) {
        if (signals.length === 0) return;
        
        // Check risk limits
        if (!this.checkRiskLimits()) {
            console.log('Risk limits exceeded - skipping trade execution');
            return;
        }
        
        // Execute top signal only (to avoid over-trading)
        const topSignal = signals[0];
        
        try {
            const tradeResult = await this.placeTrade(topSignal);
            
            if (tradeResult.success) {
                this.activeTrades.push(tradeResult.trade);
                this.recordTrade(tradeResult.trade);
                this.showTradeNotification(tradeResult.trade);
            }
        } catch (error) {
            console.error('Trade execution failed:', error);
        }
    }

    async placeTrade(signal) {
        // Simulated trade placement
        // In real implementation, this would call the broker API
        
        const trade = {
            id: `TRADE_${Date.now()}`,
            symbol: signal.symbol,
            action: signal.action,
            volume: signal.lotSize,
            entryPrice: signal.entryPrice,
            stopLoss: signal.stopLoss,
            takeProfit: signal.takeProfit,
            openTime: new Date(),
            status: 'OPEN',
            confidence: signal.confidence,
            riskReward: signal.riskRewardRatio
        };
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            success: true,
            trade,
            message: 'ট্রেড সফলভাবে এক্সিকিউট হয়েছে'
        };
    }

    checkRiskLimits() {
        // Check concurrent trades limit
        if (this.activeTrades.length >= this.riskParameters.maxConcurrentTrades) {
            return false;
        }
        
        // Check daily loss limit
        if (this.riskMetrics.dailyPnL <= -this.riskParameters.dailyLossLimit) {
            return false;
        }
        
        // Check consecutive losses
        if (this.riskMetrics.currentConsecutiveLosses >= 3) {
            return false;
        }
        
        return true;
    }

    monitorRisk() {
        if (!this.isTradingActive) return;
        
        // Monitor active trades
        this.monitorActiveTrades();
        
        // Update risk metrics
        this.updateRiskMetrics();
        
        // Check for risk violations
        this.checkRiskViolations();
    }

    monitorActiveTrades() {
        this.activeTrades.forEach((trade, index) => {
            const currentPrice = this.getCurrentPrice(trade.symbol);
            
            // Check for take profit
            if ((trade.action === 'BUY' && currentPrice >= trade.takeProfit) ||
                (trade.action === 'SELL' && currentPrice <= trade.takeProfit)) {
                this.closeTrade(trade.id, 'TAKE_PROFIT', currentPrice);
            }
            
            // Check for stop loss
            else if ((trade.action === 'BUY' && currentPrice <= trade.stopLoss) ||
                     (trade.action === 'SELL' && currentPrice >= trade.stopLoss)) {
                this.closeTrade(trade.id, 'STOP_LOSS', currentPrice);
            }
        });
    }

    async closeTrade(tradeId, reason, closePrice) {
        const tradeIndex = this.activeTrades.findIndex(t => t.id === tradeId);
        if (tradeIndex === -1) return;
        
        const trade = this.activeTrades[tradeIndex];
        
        // Calculate P&L
        let pnl = 0;
        if (trade.action === 'BUY') {
            pnl = (closePrice - trade.entryPrice) * trade.volume * 100000;
        } else {
            pnl = (trade.entryPrice - closePrice) * trade.volume * 100000;
        }
        
        // Update trade
        trade.closePrice = closePrice;
        trade.closeTime = new Date();
        trade.status = 'CLOSED';
        trade.closeReason = reason;
        trade.profitLoss = pnl;
        
        // Update risk metrics
        this.riskMetrics.dailyPnL += pnl;
        this.riskMetrics.totalTrades++;
        
        if (pnl > 0) {
            this.riskMetrics.winningTrades++;
            this.riskMetrics.currentConsecutiveLosses = 0;
        } else {
            this.riskMetrics.losingTrades++;
            this.riskMetrics.currentConsecutiveLosses++;
            this.riskMetrics.maxConsecutiveLosses = Math.max(
                this.riskMetrics.maxConsecutiveLosses,
                this.riskMetrics.currentConsecutiveLosses
            );
        }
        
        // Remove from active trades
        this.activeTrades.splice(tradeIndex, 1);
        
        // Show closure notification
        this.showTradeClosureNotification(trade, pnl);
    }

    closeAllTrades() {
        this.activeTrades.forEach(trade => {
            const currentPrice = this.getCurrentPrice(trade.symbol);
            this.closeTrade(trade.id, 'SESSION_CLOSED', currentPrice);
        });
    }

    updateRiskMetrics() {
        // Update risk metrics display
        this.updateRiskDisplay();
    }

    checkRiskViolations() {
        // Check for risk violations and take action
        
        if (this.riskMetrics.dailyPnL <= -this.riskParameters.dailyLossLimit) {
            this.showTradingMessage('দৈনিক লস লিমিট অতিক্রম করেছে! ট্রেডিং বন্ধ করা হচ্ছে', 'error');
            this.stopTradingSession();
            return;
        }
        
        if (this.riskMetrics.currentConsecutiveLosses >= 5) {
            this.showTradingMessage('৫টি পরপর লস! ট্রেডিং temporarily বন্ধ করা হচ্ছে', 'warning');
            this.pauseTrading(300000); // Pause for 5 minutes
            return;
        }
    }

    pauseTrading(duration) {
        this.isTradingActive = false;
        
        setTimeout(() => {
            if (this.checkRiskLimits()) {
                this.isTradingActive = true;
                this.showTradingMessage('ট্রেডিং পুনরায় শুরু হয়েছে', 'success');
            }
        }, duration);
    }

    updateTradingUI(status) {
        const elements = {
            startBtn: document.getElementById('startTradingBtn'),
            stopBtn: document.getElementById('stopTradingBtn'),
            statusIndicator: document.getElementById('tradingStatus'),
            progressBar: document.getElementById('globalProgress')
        };
        
        if (status === 'active') {
            if (elements.startBtn) elements.startBtn.disabled = true;
            if (elements.stopBtn) elements.stopBtn.disabled = false;
            if (elements.statusIndicator) {
                elements.statusIndicator.innerHTML = `
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-sm">চালু</span>
                `;
            }
            if (elements.progressBar) {
                elements.progressBar.classList.remove('hidden');
            }
        } else {
            if (elements.startBtn) elements.startBtn.disabled = false;
            if (elements.stopBtn) elements.stopBtn.disabled = true;
            if (elements.statusIndicator) {
                elements.statusIndicator.innerHTML = `
                    <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span class="text-sm">বন্ধ</span>
                `;
            }
            if (elements.progressBar) {
                elements.progressBar.classList.add('hidden');
            }
        }
    }

    updateTradingDashboard() {
        // Update active trades count
        const activeTradesElement = document.getElementById('activeTrades');
        if (activeTradesElement) {
            activeTradesElement.textContent = this.activeTrades.length;
        }
        
        // Update success rate
        const successRateElement = document.getElementById('successRate');
        if (successRateElement && this.riskMetrics.totalTrades > 0) {
            const successRate = (this.riskMetrics.winningTrades / this.riskMetrics.totalTrades) * 100;
            successRateElement.textContent = Math.round(successRate);
        }
    }

    updateRiskDisplay() {
        // Update risk metrics display
        const riskElements = {
            dailyPnL: document.getElementById('dailyPnL'),
            totalTrades: document.getElementById('totalTrades'),
            winRate: document.getElementById('winRate'),
            maxDrawdown: document.getElementById('maxDrawdown')
        };
        
        if (riskElements.dailyPnL) {
            riskElements.dailyPnL.textContent = this.riskMetrics.dailyPnL.toFixed(2);
            riskElements.dailyPnL.className = this.riskMetrics.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400';
        }
        
        if (riskElements.totalTrades) {
            riskElements.totalTrades.textContent = this.riskMetrics.totalTrades;
        }
        
        if (riskElements.winRate && this.riskMetrics.totalTrades > 0) {
            const winRate = (this.riskMetrics.winningTrades / this.riskMetrics.totalTrades) * 100;
            riskElements.winRate.textContent = `${Math.round(winRate)}%`;
        }
    }

    showTradingMessage(message, type) {
        if (window.exnessAI) {
            window.exnessAI.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    showLoadingState(buttonId, text) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${text}`;
            button.disabled = true;
        }
    }

    hideLoadingState(buttonId, originalText) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    showTradeNotification(trade) {
        const message = `নতুন ট্রেড: ${trade.symbol} ${trade.action} @ ${trade.entryPrice.toFixed(4)}`;
        this.showTradingMessage(message, 'success');
    }

    showTradeClosureNotification(trade, pnl) {
        const pnlFormatted = pnl.toFixed(2);
        const pnlClass = pnl >= 0 ? 'text-green-400' : 'text-red-400';
        const icon = pnl >= 0 ? 'fa-check-circle' : 'fa-times-circle';
        
        const message = `
            ট্রেড ক্লোজ: ${trade.symbol} - ${trade.closeReason}<br>
            P/L: <span class="${pnlClass}">$${pnlFormatted}</span>
        `;
        
        this.showTradingMessage(message, pnl >= 0 ? 'success' : 'error');
    }

    showPerformanceSummary(performance) {
        const summary = `
            <div class="text-center">
                <h4 class="font-semibold text-lg mb-2">ট্রেডিং সামারি</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>মোট ট্রেড: ${performance.total_trades || 0}</div>
                    <div>সাফল্যের হার: ${Math.round(performance.success_rate || 0)}%</div>
                    <div>নেট প্রফিট: $${(performance.total_profit || 0).toFixed(2)}</div>
                    <div>সেশন সময়: ${Math.round(performance.session_duration || 0)} মিনিট</div>
                </div>
            </div>
        `;
        
        this.showTradingMessage(summary, 'info');
    }

    assessMarketCondition() {
        // Simulated market condition assessment
        const conditions = ['BULLISH', 'BEARISH', 'SIDEWAYS', 'VOLATILE'];
        return conditions[Math.floor(Math.random() * conditions.length)];
    }

    calculateRiskLevel() {
        // Simulated risk level calculation
        const levels = ['LOW', 'MEDIUM', 'HIGH'];
        return levels[Math.floor(Math.random() * levels.length)];
    }

    subscribeToMarketData() {
        // Simulated market data subscription
        console.log('📊 Subscribed to market data');
    }

    setupPriceAlerts() {
        // Setup price alert system
        console.log('🔔 Price alerts configured');
    }

    selectOrderType(type) {
        const buttons = document.querySelectorAll('.order-type-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            }
        });
        
        // Update order form based on type
        this.updateOrderForm(type);
    }

    updateOrderForm(orderType) {
        const form = document.getElementById('orderForm');
        if (!form) return;
        
        // Update form based on order type
        // This would typically show/hide relevant fields
    }

    async placeManualOrder() {
        // Manual order placement logic
        const formData = new FormData(document.getElementById('orderForm'));
        
        try {
            const order = {
                symbol: formData.get('symbol'),
                type: formData.get('orderType'),
                volume: parseFloat(formData.get('volume')),
                stopLoss: formData.get('stopLoss') ? parseFloat(formData.get('stopLoss')) : null,
                takeProfit: formData.get('takeProfit') ? parseFloat(formData.get('takeProfit')) : null
            };
            
            // Validate order
            if (this.validateManualOrder(order)) {
                const result = await this.placeTrade({
                    symbol: order.symbol,
                    action: order.type,
                    lotSize: order.volume,
                    entryPrice: this.getCurrentPrice(order.symbol),
                    stopLoss: order.stopLoss,
                    takeProfit: order.takeProfit
                });
                
                if (result.success) {
                    this.showTradingMessage('ম্যানুয়াল অর্ডার প্লেস হয়েছে', 'success');
                }
            }
        } catch (error) {
            console.error('Manual order placement failed:', error);
            this.showTradingMessage('ম্যানুয়াল অর্ডার ব্যর্থ', 'error');
        }
    }

    validateManualOrder(order) {
        if (!order.symbol) {
            this.showTradingMessage('সিম্বল সিলেক্ট করুন', 'error');
            return false;
        }
        
        if (!order.volume || order.volume <= 0) {
            this.showTradingMessage('ভলিউম সঠিকভাবে দিন', 'error');
            return false;
        }
        
        return true;
    }

    processOrderQueue() {
        if (this.orderQueue.length === 0 || this.isProcessingOrders) return;
        
        this.isProcessingOrders = true;
        
        const order = this.orderQueue.shift();
        this.executeOrder(order)
            .finally(() => {
                this.isProcessingOrders = false;
            });
    }

    async executeOrder(order) {
        // Order execution logic
        console.log('Executing order:', order);
        
        // Simulate order execution delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add to active trades or pending orders based on order type
        if (order.type === 'MARKET') {
            this.activeTrades.push({
                ...order,
                id: `TRADE_${Date.now()}`,
                openTime: new Date(),
                status: 'OPEN'
            });
        } else {
            this.pendingOrders.push(order);
        }
    }

    recordTrade(trade) {
        this.tradingHistory.push(trade);
        
        // Keep only last 100 trades
        if (this.tradingHistory.length > 100) {
            this.tradingHistory.shift();
        }
    }
}

// Initialize trading engine when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tradingEngine = new TradingEngine();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TradingEngine;
          }
