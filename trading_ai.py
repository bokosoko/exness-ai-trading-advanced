import pandas as pd
import numpy as np
import talib
import logging
import json
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass
from config import Config
from gemini_integration import gemini_ai
from database import Trade, MarketData, AIAnalysis, SystemLog, db

@dataclass
class TradingSignal:
    symbol: str
    action: str  # BUY, SELL, HOLD
    confidence: float
    entry_price: float
    stop_loss: float
    take_profit: float
    lot_size: float
    risk_reward_ratio: float
    analysis: Dict
    timestamp: datetime

class AdvancedTradingAI:
    def __init__(self):
        self.is_active = False
        self.current_session = None
        self.trading_strategy = None
        self.market_data_cache = {}
        self.technical_indicators = {}
        self.active_trades = {}
        self.performance_metrics = {}
        
        # ট্রেডিং প্যারামিটারস
        self.risk_per_trade = 0.02  # 2%
        self.max_drawdown = 0.10   # 10%
        self.min_confidence = 0.85  # 85%
        
        # থ্রেডিং
        self.trading_thread = None
        self.analysis_thread = None
        self.stop_event = threading.Event()
        
        # ইনিশিয়ালাইজেশন
        self.setup_trading_strategy()
        logging.info("Advanced Trading AI initialized")
    
    def setup_trading_strategy(self):
        """ট্রেডিং স্ট্র্যাটেজি সেটআপ"""
        self.trading_strategy = {
            'name': 'Gemini AI Enhanced Strategy',
            'version': '2.0',
            'timeframes': ['M1', 'M5', 'M15', 'H1'],
            'indicators': {
                'trend': ['EMA_12', 'EMA_26', 'MACD'],
                'momentum': ['RSI', 'STOCH'],
                'volatility': ['BBANDS', 'ATR'],
                'volume': ['OBV']
            },
            'rules': {
                'entry_rules': {
                    'min_confidence': 0.85,
                    'min_rr_ratio': 1.5,
                    'max_risk_per_trade': 0.02
                },
                'exit_rules': {
                    'trailing_stop': True,
                    'break_even': True,
                    'partial_profit': True
                },
                'risk_management': {
                    'daily_loss_limit': 0.05,
                    'max_concurrent_trades': 3,
                    'hedging_allowed': False
                }
            }
        }
    
    def start_trading_session(self, user_id, initial_balance, target_balance, strategy_config=None):
        """নতুন ট্রেডিং সেশন শুরু করে"""
        try:
            if self.is_active:
                return {'status': 'error', 'message': 'ট্রেডিং সেশন ইতিমধ্যেই চালু আছে'}
            
            # সেশন তৈরি
            session_id = f"SESSION_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            self.current_session = {
                'session_id': session_id,
                'user_id': user_id,
                'initial_balance': float(initial_balance),
                'target_balance': float(target_balance),
                'current_balance': float(initial_balance),
                'start_time': datetime.now(),
                'status': 'running',
                'trades_count': 0,
                'profitable_trades': 0
            }
            
            # স্ট্র্যাটেজি কনফিগ
            if strategy_config:
                self.trading_strategy.update(strategy_config)
            
            self.is_active = True
            self.stop_event.clear()
            
            # ব্যাকগ্রাউন্ড থ্রেড শুরু
            self.start_background_processes()
            
            # সিস্টেম লগ
            self.log_system_event('INFO', 'TradingAI', 
                                f'ট্রেডিং সেশন শুরু হয়েছে: {session_id}', 
                                user_id, session_id)
            
            return {
                'status': 'success',
                'session_id': session_id,
                'message': f'AI ট্রেডিং সেশন শুরু হয়েছে! ${initial_balance} থেকে ${target_balance} টার্গেট',
                'strategy': self.trading_strategy['name']
            }
            
        except Exception as e:
            logging.error(f"সেশন শুরু করতে ব্যর্থ: {str(e)}")
            return {'status': 'error', 'message': f'সেশন শুরু করতে ব্যর্থ: {str(e)}'}
    
    def stop_trading_session(self):
        """ট্রেডিং সেশন বন্ধ করে"""
        try:
            self.is_active = False
            self.stop_event.set()
            
            if self.current_session:
                self.current_session['status'] = 'stopped'
                self.current_session['end_time'] = datetime.now()
                
                # অ্যাক্টিভ ট্রেড ক্লোজ
                self.close_all_trades()
                
                # পারফরম্যান্স ক্যালকুলেশন
                performance = self.calculate_performance()
                
                # সিস্টেম লগ
                self.log_system_event('INFO', 'TradingAI', 
                                    'ট্রেডিং সেশন বন্ধ করা হয়েছে', 
                                    self.current_session['user_id'],
                                    self.current_session['session_id'])
            
            return {
                'status': 'success',
                'message': 'ট্রেডিং সেশন বন্ধ করা হয়েছে',
                'performance': performance if self.current_session else {}
            }
            
        except Exception as e:
            logging.error(f"সেশন বন্ধ করতে ব্যর্থ: {str(e)}")
            return {'status': 'error', 'message': f'সেশন বন্ধ করতে ব্যর্থ: {str(e)}'}
    
    def start_background_processes(self):
        """ব্যাকগ্রাউন্ড প্রসেস শুরু করে"""
        # মার্কেট এনালাইসিস থ্রেড
        self.analysis_thread = threading.Thread(target=self.market_analysis_worker)
        self.analysis_thread.daemon = True
        self.analysis_thread.start()
        
        # ট্রেডিং এক্সিকিউশন থ্রেড
        self.trading_thread = threading.Thread(target=self.trading_execution_worker)
        self.trading_thread.daemon = True
        self.trading_thread.start()
        
        logging.info("ব্যাকগ্রাউন্ড প্রসেস শুরু হয়েছে")
    
    def market_analysis_worker(self):
        """কন্টিনিউয়াস মার্কেট এনালাইসিস করে"""
        while self.is_active and not self.stop_event.is_set():
            try:
                # প্রতিটি ট্রেডিং পেয়ার এর জন্য এনালাইসিস
                for symbol in Config.TRADING_PAIRS:
                    if self.stop_event.is_set():
                        break
                    
                    # মার্কেট ডাটা সংগ্রহ
                    market_data = self.get_market_data(symbol)
                    if not market_data:
                        continue
                    
                    # টেকনিক্যাল ইন্ডিকেটর ক্যালকুলেট
                    indicators = self.calculate_technical_indicators(market_data)
                    
                    # Gemini AI এনালাইসিস
                    ai_analysis = gemini_ai.analyze_market(symbol, market_data, indicators)
                    
                    # সিগন্যাল জেনারেট
                    signal = self.generate_trading_signal(symbol, market_data, indicators, ai_analysis)
                    
                    # ক্যাশে স্টোর
                    self.market_data_cache[symbol] = {
                        'market_data': market_data,
                        'indicators': indicators,
                        'ai_analysis': ai_analysis,
                        'signal': signal,
                        'timestamp': datetime.now()
                    }
                    
                    # ডাটাবেসে সেভ
                    self.save_analysis_to_db(symbol, market_data, indicators, ai_analysis, signal)
                
                # 5 সেকেন্ড অপেক্ষা
                time.sleep(5)
                
            except Exception as e:
                logging.error(f"মার্কেট এনালাইসিসে ত্রুটি: {str(e)}")
                time.sleep(10)
    
    def trading_execution_worker(self):
        """ট্রেড এক্সিকিউশন ম্যানেজ করে"""
        while self.is_active and not self.stop_event.is_set():
            try:
                # এক্টিভ ট্রেড মনিটর
                self.monitor_active_trades()
                
                # নতুন ট্রেড的机会 চেক
                if len(self.active_trades) < self.trading_strategy['rules']['risk_management']['max_concurrent_trades']:
                    self.execute_new_trades()
                
                # পারফরম্যান্স আপডেট
                self.update_performance_metrics()
                
                # 3 সেকেন্ড অপেক্ষা
                time.sleep(3)
                
            except Exception as e:
                logging.error(f"ট্রেডিং এক্সিকিউশনে ত্রুটি: {str(e)}")
                time.sleep(5)
    
    def get_market_data(self, symbol):
        """মার্কেট ডাটা সংগ্রহ করে (সিমুলেটেড)"""
        try:
            # রিয়েল API এর জন্য এখানে এক্সনেস API কল করতে হবে
            # সিমুলেটেড ডাটা
            base_price = {
                'EUR/USD': 1.0950,
                'GBP/USD': 1.2750,
                'USD/JPY': 148.50,
                'XAU/USD': 1980.00,
                'BTC/USD': 42000.00
            }.get(symbol, 1.0)
            
            # র্যান্ডম ভেরিয়েশন
            variation = np.random.normal(0, 0.001)
            current_price = base_price * (1 + variation)
            
            market_data = {
                'symbol': symbol,
                'timestamp': datetime.now(),
                'open': base_price,
                'high': base_price * (1 + abs(variation) + 0.0005),
                'low': base_price * (1 - abs(variation) - 0.0005),
                'close': current_price,
                'volume': np.random.randint(1000, 10000)
            }
            
            return market_data
            
        except Exception as e:
            logging.error(f"মার্কেট ডাটা লোড করতে ব্যর্থ: {str(e)}")
            return None
    
    def calculate_technical_indicators(self, market_data):
        """টেকনিক্যাল ইন্ডিকেটর ক্যালকুলেট করে"""
        try:
            # হিস্টরিকাল ডাটা (সিমুলেটেড)
            prices = np.array([market_data['close']] * 50) * (1 + np.random.normal(0, 0.001, 50))
            
            # RSI
            rsi = talib.RSI(prices, timeperiod=14)[-1]
            
            # MACD
            macd, macd_signal, macd_hist = talib.MACD(prices)
            
            # Bollinger Bands
            bb_upper, bb_middle, bb_lower = talib.BBANDS(prices, timeperiod=20)
            
            # SMA, EMA
            sma_20 = talib.SMA(prices, timeperiod=20)[-1]
            ema_12 = talib.EMA(prices, timeperiod=12)[-1]
            ema_26 = talib.EMA(prices, timeperiod=26)[-1]
            
            indicators = {
                'rsi': float(rsi) if not np.isnan(rsi) else 50.0,
                'macd': float(macd[-1]) if not np.isnan(macd[-1]) else 0.0,
                'macd_signal': float(macd_signal[-1]) if not np.isnan(macd_signal[-1]) else 0.0,
                'macd_histogram': float(macd_hist[-1]) if not np.isnan(macd_hist[-1]) else 0.0,
                'bb_upper': float(bb_upper[-1]) if not np.isnan(bb_upper[-1]) else market_data['close'] * 1.02,
                'bb_middle': float(bb_middle[-1]) if not np.isnan(bb_middle[-1]) else market_data['close'],
                'bb_lower': float(bb_lower[-1]) if not np.isnan(bb_lower[-1]) else market_data['close'] * 0.98,
                'sma_20': float(sma_20) if not np.isnan(sma_20) else market_data['close'],
                'ema_12': float(ema_12) if not np.isnan(ema_12) else market_data['close'],
                'ema_26': float(ema_26) if not np.isnan(ema_26) else market_data['close'],
                'atr': 0.001 * market_data['close']  # সিমুলেটেড ATR
            }
            
            return indicators
            
        except Exception as e:
            logging.error(f"টেকনিক্যাল ইন্ডিকেটর ক্যালকুলেশনে ত্রুটি: {str(e)}")
            return self.get_default_indicators(market_data['close'])
    
    def get_default_indicators(self, price):
        """ডিফল্ট ইন্ডিকেটর ভ্যালু"""
        return {
            'rsi': 50.0,
            'macd': 0.0,
            'macd_signal': 0.0,
            'macd_histogram': 0.0,
            'bb_upper': price * 1.02,
            'bb_middle': price,
            'bb_lower': price * 0.98,
            'sma_20': price,
            'ema_12': price,
            'ema_26': price,
            'atr': 0.001 * price
        }
    
    def generate_trading_signal(self, symbol, market_data, indicators, ai_analysis):
        """ট্রেডিং সিগন্যাল জেনারেট করে"""
        try:
            # AI কনফিডেন্স
            ai_confidence = ai_analysis.get('confidence_level', 50) / 100.0
            
            # টেকনিক্যাল কনফিডেন্স
            technical_confidence = self.calculate_technical_confidence(indicators)
            
            # ফাইনাল কনফিডেন্স
            final_confidence = (ai_confidence * 0.6) + (technical_confidence * 0.4)
            
            # সিগন্যাল ভ্যালিডেশন
            if final_confidence < self.min_confidence:
                return TradingSignal(
                    symbol=symbol,
                    action='HOLD',
                    confidence=final_confidence,
                    entry_price=market_data['close'],
                    stop_loss=0,
                    take_profit=0,
                    lot_size=0,
                    risk_reward_ratio=0,
                    analysis={'reason': 'Low confidence'},
                    timestamp=datetime.now()
                )
            
            # এন্ট্রি প্রাইস এবং রিস্ক ম্যানেজমেন্ট
            action = ai_analysis.get('trading_signal', 'HOLD')
            entry_price = market_data['close']
            stop_loss = ai_analysis.get('stop_loss', entry_price * 0.995)
            take_profit = ai_analysis.get('take_profit', entry_price * 1.01)
            
            # লট সাইজ ক্যালকুলেশন
            lot_size = self.calculate_lot_size(entry_price, stop_loss)
            
            # রিস্ক-রিওয়ার্ড রেশিও
            risk = abs(entry_price - stop_loss)
            reward = abs(take_profit - entry_price)
            risk_reward_ratio = reward / risk if risk > 0 else 0
            
            return TradingSignal(
                symbol=symbol,
                action=action,
                confidence=final_confidence,
                entry_price=entry_price,
                stop_loss=stop_loss,
                take_profit=take_profit,
                lot_size=lot_size,
                risk_reward_ratio=risk_reward_ratio,
                analysis=ai_analysis,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logging.error(f"সিগন্যাল জেনারেশনে ত্রুটি: {str(e)}")
            return self.get_hold_signal(symbol, market_data['close'])
    
    def calculate_technical_confidence(self, indicators):
        """টেকনিক্যাল কনফিডেন্স স্কোর ক্যালকুলেট করে"""
        confidence_score = 0.0
        factors = 0
        
        # RSI কনফিডেন্স
        rsi = indicators['rsi']
        if 30 <= rsi <= 70:
            confidence_score += 0.7
        elif (rsi < 30 and indicators['macd_histogram'] > 0) or (rsi > 70 and indicators['macd_histogram'] < 0):
            confidence_score += 0.9
        factors += 1
        
        # MACD কনফিডেন্স
        if indicators['macd'] > indicators['macd_signal'] and indicators['macd_histogram'] > 0:
            confidence_score += 0.8
        elif indicators['macd'] < indicators['macd_signal'] and indicators['macd_histogram'] < 0:
            confidence_score += 0.8
        factors += 1
        
        # Bollinger Bands কনফিডেন্স
        price = indicators['bb_middle']
        if price <= indicators['bb_lower']:
            confidence_score += 0.9  # Oversold
        elif price >= indicators['bb_upper']:
            confidence_score += 0.9  # Overbought
        factors += 1
        
        return confidence_score / factors if factors > 0 else 0.5
    
    def calculate_lot_size(self, entry_price, stop_loss):
        """রিস্ক based lot size ক্যালকুলেট করে"""
        try:
            if not self.current_session:
                return 0.01
            
            account_balance = self.current_session['current_balance']
            risk_amount = account_balance * self.risk_per_trade
            
            # পিপ ভ্যালু ক্যালকুলেশন (সিমুলেটেড)
            pip_value = 10 if entry_price < 100 else 1  # সিমুলেটেড
            
            # স্টপ লস in pips
            stop_loss_pips = abs(entry_price - stop_loss) * 10000
            
            if stop_loss_pips == 0:
                return 0.01
            
            # লট সাইজ
            lot_size = risk_amount / (stop_loss_pips * pip_value)
            
            # লিমিট চেক
            lot_size = max(0.01, min(lot_size, 1.0))  # 0.01 থেকে 1.0 লট
            
            return round(lot_size, 2)
            
        except Exception as e:
            logging.error(f"লট সাইজ ক্যালকুলেশনে ত্রুটি: {str(e)}")
            return 0.01
    
    def execute_new_trades(self):
        """নতুন ট্রেড এক্সিকিউট করে"""
        try:
            for symbol, cache_data in self.market_data_cache.items():
                if symbol in self.active_trades:
                    continue
                
                signal = cache_data.get('signal')
                if not signal or signal.action == 'HOLD':
                    continue
                
                # কনফিডেন্স চেক
                if signal.confidence < self.min_confidence:
                    continue
                
                # রিস্ক-রিওয়ার্ড রেশিও চেক
                if signal.risk_reward_ratio < 1.5:
                    continue
                
                # ট্রেড এক্সিকিউট
                trade_result = self.execute_trade(signal)
                
                if trade_result['status'] == 'success':
                    self.active_trades[symbol] = trade_result['trade']
                    self.current_session['trades_count'] += 1
                    
                    # সিস্টেম লগ
                    self.log_system_event('INFO', 'TradingAI', 
                                        f'নতুন ট্রেড এক্সিকিউটেড: {symbol} {signal.action}', 
                                        self.current_session['user_id'],
                                        self.current_session['session_id'])
        
        except Exception as e:
            logging.error(f"নতুন ট্রেড এক্সিকিউশনে ত্রুটি: {str(e)}")
    
    def execute_trade(self, signal):
        """ট্রেড এক্সিকিউট করে"""
        try:
            # ট্রেড ডিটেইলস
            trade_id = f"TRADE_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{signal.symbol}"
            
            # সিমুলেটেড ট্রেড এক্সিকিউশন
            # রিয়েল API এর জন্য এখানে এক্সনেস API কল করতে হবে
            trade_data = {
                'trade_id': trade_id,
                'symbol': signal.symbol,
                'action': signal.action,
                'volume': signal.lot_size,
                'entry_price': signal.entry_price,
                'stop_loss': signal.stop_loss,
                'take_profit': signal.take_profit,
                'open_time': datetime.now(),
                'status': 'open',
                'ai_confidence': signal.confidence,
                'risk_reward_ratio': signal.risk_reward_ratio
            }
            
            # ডাটাবেসে সেভ
            self.save_trade_to_db(trade_data)
            
            return {
                'status': 'success',
                'trade': trade_data,
                'message': f'ট্রেড সফলভাবে এক্সিকিউট হয়েছে: {signal.symbol}'
            }
            
        except Exception as e:
            logging.error(f"ট্রেড এক্সিকিউশনে ত্রুটি: {str(e)}")
            return {'status': 'error', 'message': f'ট্রেড এক্সিকিউশনে ত্রুটি: {str(e)}'}
    
    def monitor_active_trades(self):
        """এক্টিভ ট্রেড মনিটর করে"""
        try:
            for symbol, trade in list(self.active_trades.items()):
                if trade['status'] != 'open':
                    continue
                
                # কারেন্ট প্রাইস (সিমুলেটেড)
                current_data = self.market_data_cache.get(symbol, {})
                current_price = current_data.get('market_data', {}).get('close', trade['entry_price'])
                
                # ট্রেড ক্লোজ করার অবস্থা চেক
                close_reason = None
                close_price = None
                
                # টেক প্রফিট চেক
                if ((trade['action'] == 'BUY' and current_price >= trade['take_profit']) or
                    (trade['action'] == 'SELL' and current_price <= trade['take_profit'])):
                    close_reason = 'TAKE_PROFIT'
                    close_price = trade['take_profit']
                
                # স্টপ লস চেক
                elif ((trade['action'] == 'BUY' and current_price <= trade['stop_loss']) or
                      (trade['action'] == 'SELL' and current_price >= trade['stop_loss'])):
                    close_reason = 'STOP_LOSS'
                    close_price = trade['stop_loss']
                
                # ট্রেড ক্লোজ
                if close_reason:
                    self.close_trade(trade, close_price, close_reason)
                    del self.active_trades[symbol]
        
        except Exception as e:
            logging.error(f"ট্রেড মনিটরিংয়ে ত্রুটি: {str(e)}")
    
    def close_trade(self, trade, close_price, close_reason):
        """ট্রেড ক্লোজ করে"""
        try:
            # প্রফিট/লস ক্যালকুলেশন
            if trade['action'] == 'BUY':
                profit_loss = (close_price - trade['entry_price']) * trade['volume'] * 10000
            else:  # SELL
                profit_loss = (trade['entry_price'] - close_price) * trade['volume'] * 10000
            
            # ট্রেড আপডেট
            trade['exit_price'] = close_price
            trade['close_time'] = datetime.now()
            trade['status'] = 'closed'
            trade['profit_loss'] = profit_loss
            trade['close_reason'] = close_reason
            
            # সেশন ব্যালেন্স আপডেট
            if self.current_session:
                self.current_session['current_balance'] += profit_loss
                
                if profit_loss > 0:
                    self.current_session['profitable_trades'] += 1
            
            # ডাটাবেস আপডেট
            self.update_trade_in_db(trade)
            
            # সিস্টেম লগ
            self.log_system_event('INFO', 'TradingAI', 
                                f'ট্রেড ক্লোজ: {trade["symbol"]} - {close_reason} - P/L: ${profit_loss:.2f}', 
                                self.current_session['user_id'] if self.current_session else None,
                                self.current_session['session_id'] if self.current_session else None)
            
        except Exception as e:
            logging.error(f"ট্রেড ক্লোজ করতে ব্যর্থ: {str(e)}")
    
    def close_all_trades(self):
        """সব এক্টিভ ট্রেড ক্লোজ করে"""
        try:
            for symbol, trade in list(self.active_trades.items()):
                if trade['status'] == 'open':
                    current_data = self.market_data_cache.get(symbol, {})
                    current_price = current_data.get('market_data', {}).get('close', trade['entry_price'])
                    self.close_trade(trade, current_price, 'SESSION_CLOSED')
            
            self.active_trades.clear()
            
        except Exception as e:
            logging.error(f"সব ট্রেড ক্লোজ করতে ব্যর্থ: {str(e)}")
    
    def update_performance_metrics(self):
        """পারফরম্যান্স মেট্রিক্স আপডেট করে"""
        try:
            if not self.current_session:
                return
            
            session = self.current_session
            
            self.performance_metrics = {
                'current_balance': session['current_balance'],
                'initial_balance': session['initial_balance'],
                'target_balance': session['target_balance'],
                'total_trades': session['trades_count'],
                'profitable_trades': session['profitable_trades'],
                'success_rate': (session['profitable_trades'] / session['trades_count'] * 100) 
                              if session['trades_count'] > 0 else 0,
                'total_profit': session['current_balance'] - session['initial_balance'],
                'progress_percentage': ((session['current_balance'] - session['initial_balance']) / 
                                      (session['target_balance'] - session['initial_balance']) * 100),
                'active_trades': len(self.active_trades),
                'session_duration': (datetime.now() - session['start_time']).total_seconds() / 60,
                'avg_trade_duration': self.calculate_avg_trade_duration()
            }
            
        except Exception as e:
            logging.error(f"পারফরম্যান্স মেট্রিক্স আপডেট করতে ব্যর্থ: {str(e)}")
    
    def calculate_avg_trade_duration(self):
        """গড় ট্রেড duration ক্যালকুলেট করে"""
        # সিমুলেটেড - রিয়েল ইম্প্লিমেন্টেশনে ডাটাবেস থেকে ক্যালকুলেট করতে হবে
        return 5.0  # মিনিট
    
    def calculate_performance(self):
        """সেশন পারফরম্যান্স ক্যালকুলেট করে"""
        if not self.current_session:
            return {}
        
        return self.performance_metrics
    
    def get_live_data(self):
        """লাইভ ট্রেডিং ডাটা রিটার্ন করে"""
        try:
            market_overview = []
            for symbol, cache in self.market_data_cache.items():
                if cache.get('signal'):
                    market_overview.append({
                        'symbol': symbol,
                        'price': cache['market_data']['close'],
                        'signal': cache['signal'].action,
                        'confidence': cache['signal'].confidence,
                        'trend': cache['ai_analysis'].get('trend_analysis', 'Neutral')
                    })
            
            return {
                'session_info': self.current_session,
                'performance': self.performance_metrics,
                'market_overview': market_overview,
                'active_trades': list(self.active_trades.values()),
                'trading_signals': [
                    {
                        'symbol': cache['signal'].symbol,
                        'action': cache['signal'].action,
                        'confidence': cache['signal'].confidence,
                        'entry_price': cache['signal'].entry_price,
                        'rr_ratio': cache['signal'].risk_reward_ratio
                    }
                    for cache in self.market_data_cache.values()
                    if cache.get('signal') and cache['signal'].action != 'HOLD'
                ],
                'timestamp': datetime.now()
            }
            
        except Exception as e:
            logging.error(f"লাইভ ডাটা জেনারেট করতে ব্যর্থ: {str(e)}")
            return {}
    
    def get_hold_signal(self, symbol, price):
        """HOLD সিগন্যাল রিটার্ন করে"""
        return TradingSignal(
            symbol=symbol,
            action='HOLD',
            confidence=0.0,
            entry_price=price,
            stop_loss=0,
            take_profit=0,
            lot_size=0,
            risk_reward_ratio=0,
            analysis={'reason': 'Default hold signal'},
            timestamp=datetime.now()
        )
    
    def save_analysis_to_db(self, symbol, market_data, indicators, ai_analysis, signal):
        """এনালাইসিস ডাটাবেসে সেভ করে"""
        try:
            analysis = AIAnalysis(
                symbol=symbol,
                time_frame='M1',
                trend_direction=ai_analysis.get('trend_analysis', 'neutral'),
                trend_strength=signal.confidence,
                support_level=ai_analysis.get('support_level', 0),
                resistance_level=ai_analysis.get('resistance_level', 0),
                volatility=indicators.get('atr', 0) / market_data['close'],
                market_sentiment=ai_analysis.get('risk_assessment', 'neutral'),
                signal=signal.action,
                signal_confidence=signal.confidence,
                expected_profit=ai_analysis.get('expected_profit_range', '0%'),
                potential_risk=ai_analysis.get('risk_level', '0%'),
                risk_reward_ratio=signal.risk_reward_ratio,
                gemini_analysis=json.dumps(ai_analysis),
                technical_summary=json.dumps(indicators),
                fundamental_factors=json.dumps(market_data)
            )
            
            db.session.add(analysis)
            db.session.commit()
            
        except Exception as e:
            logging.error(f"এনালাইসিস ডাটাবেসে সেভ করতে ব্যর্থ: {str(e)}")
            db.session.rollback()
    
    def save_trade_to_db(self, trade_data):
        """ট্রেড ডাটাবেসে সেভ করে"""
        try:
            trade = Trade(
                session_id=1,  # রিয়েল ইম্প্লিমেন্টেশনে actual session ID
                account_id=1,  # রিয়েল ইম্প্লিমেন্টেশনে actual account ID
                trade_id=trade_data['trade_id'],
                symbol=trade_data['symbol'],
                action=trade_data['action'],
                volume=trade_data['volume'],
                entry_price=trade_data['entry_price'],
                stop_loss=trade_data['stop_loss'],
                take_profit=trade_data['take_profit'],
                ai_confidence=trade_data['ai_confidence'],
                ai_analysis=json.dumps({'risk_reward_ratio': trade_data['risk_reward_ratio']}),
                market_condition='AI Generated'
            )
            
            db.session.add(trade)
            db.session.commit()
            
        except Exception as e:
            logging.error(f"ট্রেড ডাটাবেসে সেভ করতে ব্যর্থ: {str(e)}")
            db.session.rollback()
    
    def update_trade_in_db(self, trade_data):
        """ট্রেড ডাটাবেসে আপডেট করে"""
        try:
            trade = Trade.query.filter_by(trade_id=trade_data['trade_id']).first()
            if trade:
                trade.exit_price = trade_data.get('exit_price')
                trade.close_time = trade_data.get('close_time')
                trade.status = trade_data.get('status')
                trade.profit_loss = trade_data.get('profit_loss')
                trade.duration = (trade_data['close_time'] - trade_data['open_time']).total_seconds() / 60
                
                db.session.commit()
                
        except Exception as e:
            logging.error(f"ট্রেড ডাটাবেসে আপডেট করতে ব্যর্থ: {str(e)}")
            db.session.rollback()
    
    def log_system_event(self, level, module, message, user_id=None, session_id=None):
        """সিস্টেম ইভেন্ট লগ করে"""
        try:
            log = SystemLog(
                level=level,
                module=module,
                message=message,
                user_id=user_id,
                session_id=session_id,
                data=json.dumps({'timestamp': datetime.now().isoformat()})
            )
            
            db.session.add(log)
            db.session.commit()
            
        except Exception as e:
            logging.error(f"সিস্টেম লগ সেভ করতে ব্যর্থ: {str(e)}")

# গ্লোবাল ইন্সট্যান্স
trading_ai = AdvancedTradingAI()
