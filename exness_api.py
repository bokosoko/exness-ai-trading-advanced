
import requests
import json
import hmac
import hashlib
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional
from config import Config

class ExnessAPI:
    def __init__(self):
        self.base_url = "https://api.exness.com"
        self.api_key = Config.EXNESS_API_KEY
        self.api_secret = Config.EXNESS_SECRET
        self.session = requests.Session()
        self.is_connected = False
        self.account_info = {}
        
        # API endpoints
        self.endpoints = {
            'accounts': '/api/accounts',
            'balance': '/api/accounts/balance',
            'open_orders': '/api/orders/open',
            'order_history': '/api/orders/history',
            'place_order': '/api/orders/create',
            'close_order': '/api/orders/close',
            'modify_order': '/api/orders/modify',
            'market_data': '/api/market/data',
            'symbols': '/api/symbols'
        }
        
        self.setup_session()
    
    def setup_session(self):
        """সেশন সেটআপ এবং হেডার কনফিগার"""
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'ExnessAI-Trading/2.0',
            'Accept': 'application/json'
        })
    
    def generate_signature(self, params: Dict) -> str:
        """API রিকোয়েস্টের জন্য সিগনেচার জেনারেট করে"""
        try:
            param_string = '&'.join([f"{k}={v}" for k, v in sorted(params.items())])
            signature = hmac.new(
                self.api_secret.encode('utf-8'),
                param_string.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            return signature
        except Exception as e:
            logging.error(f"সিগনেচার জেনারেট করতে ব্যর্থ: {str(e)}")
            return ""
    
    def make_request(self, endpoint: str, method: str = 'GET', params: Dict = None, data: Dict = None) -> Dict:
        """API রিকোয়েস্ট করে"""
        try:
            url = f"{self.base_url}{endpoint}"
            
            # প্যারামিটার প্রস্তুত
            if params is None:
                params = {}
            
            # টাইমস্ট্যাম্প যোগ
            params['timestamp'] = int(time.time() * 1000)
            
            # সিগনেচার জেনারেট
            signature = self.generate_signature(params)
            params['signature'] = signature
            
            # রিকোয়েস্ট পাঠানো
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=Config.REQUEST_TIMEOUT)
            elif method.upper() == 'POST':
                response = self.session.post(url, params=params, json=data, timeout=Config.REQUEST_TIMEOUT)
            elif method.upper() == 'PUT':
                response = self.session.put(url, params=params, json=data, timeout=Config.REQUEST_TIMEOUT)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, params=params, timeout=Config.REQUEST_TIMEOUT)
            else:
                return {'success': False, 'error': 'Invalid HTTP method'}
            
            # রেসপন্স হ্যান্ডলিং
            if response.status_code == 200:
                result = response.json()
                return {'success': True, 'data': result}
            else:
                error_msg = f"API Error: {response.status_code} - {response.text}"
                logging.error(error_msg)
                return {'success': False, 'error': error_msg}
                
        except requests.exceptions.Timeout:
            error_msg = "API request timeout"
            logging.error(error_msg)
            return {'success': False, 'error': error_msg}
        except requests.exceptions.ConnectionError:
            error_msg = "API connection error"
            logging.error(error_msg)
            return {'success': False, 'error': error_msg}
        except Exception as e:
            error_msg = f"API request failed: {str(e)}"
            logging.error(error_msg)
            return {'success': False, 'error': error_msg}
    
    def connect_account(self, account_id: str, password: str) -> Dict:
        """এক্সনেস অ্যাকাউন্টে কানেক্ট করে"""
        try:
            # রিয়েল API এর জন্য অথেন্টিকেশন লজিক
            # ডেমো目的্যে সিমুলেটেড রেসপন্স
            
            # API key এবং secret ভেরিফিকেশন (সিমুলেটেড)
            if self.api_key and self.api_secret:
                self.is_connected = True
                
                # অ্যাকাউন্ট ইনফো (সিমুলেটেড)
                self.account_info = {
                    'account_id': account_id,
                    'account_number': 'EXN' + account_id[-6:],
                    'type': 'Real',
                    'currency': 'USD',
                    'leverage': 100,
                    'balance': 1000.00,
                    'equity': 1050.00,
                    'margin': 50.00,
                    'free_margin': 950.00,
                    'margin_level': 2100.00,
                    'is_connected': True
                }
                
                logging.info(f"Exness অ্যাকাউন্টে সফলভাবে কানেক্ট হয়েছে: {account_id}")
                
                return {
                    'success': True,
                    'message': 'Exness অ্যাকাউন্টে সফলভাবে কানেক্ট হয়েছে',
                    'account_info': self.account_info
                }
            else:
                return {
                    'success': False,
                    'error': 'Invalid API credentials'
                }
                
        except Exception as e:
            error_msg = f"অ্যাকাউন্ট কানেকশনে ব্যর্থ: {str(e)}"
            logging.error(error_msg)
            return {'success': False, 'error': error_msg}
    
    def get_account_balance(self) -> Dict:
        """অ্যাকাউন্ট ব্যালেন্স তথ্য রিটার্ন করে"""
        if not self.is_connected:
            return {'success': False, 'error': 'অ্যাকাউন্ট কানেক্ট নেই'}
        
        try:
            # সিমুলেটেড ব্যালেন্স ডাটা
            # রিয়েল API: self.make_request(self.endpoints['balance'])
            
            balance_data = {
                'balance': 1000.00,
                'equity': 1050.00,
                'margin': 50.00,
                'free_margin': 950.00,
                'margin_level': 2100.00,
                'currency': 'USD',
                'timestamp': datetime.now().isoformat()
            }
            
            # অ্যাকাউন্ট ইনফো আপডেট
            self.account_info.update(balance_data)
            
            return {
                'success': True,
                'data': balance_data
            }
            
        except Exception as e:
            error_msg = f"ব্যালেন্স তথ্য পাওয়া যায়নি: {str(e)}"
            logging.error(error_msg)
            return {'success': False, 'error': error_msg}
    
    def get_open_orders(self) -> Dict:
        """ওপেন অর্ডারগুলোর লিস্ট রিটার্ন করে"""
        if not self.is_connected:
            return {'success': False, 'error': 'অ্যাকাউন্ট কানেক্ট নেই'}
        
        try:
            # সিমুলেটেড ওপেন অর্ডারস
            # রিয়েল API: self.make_request(self.endpoints['open_orders'])
            
            open_orders = [
                {
                    'order_id': 'ORDER_001',
                    'symbol': 'EUR/USD',
                    'type': 'BUY',
                    'volume': 0.1,
                    'open_price': 1.0950,
                    'current_price': 1.0965,
                    'profit': 15.00,
                    'stop_loss': 1.0920,
                    'take_profit': 1.0980,
                    'open_time': '2024-01-15T10:30:00Z'
                }
            ]
            
            return {
                'success': True,
                'data': open_orders
            }
            
        except Exception as e:
            error_msg = f"ওপেন অর্ডার লোড করতে ব্যর্থ: {str(e)}"
            logging.error(error_msg)
            return {'success': False, 'error': error_msg}
    
    def place_order(self, symbol: str, order_type: str, volume: float, 
                   stop_loss: float = None, take_profit: float = None,
                   comment: str = "AI Trading") -> Dict:
        """নতুন অর্ডার প্লেস করে"""
        if not self.is_connected:
            return {'success': False, 'error': 'অ্যাকাউন্ট কানেক্ট নেই'}
        
        try:
            # অর্ডার ডাটা প্রস্তুত
            order_data = {
                'symbol': symbol,
                'type': order_type.upper(),
                'volume': volume,
                'stop_loss': stop_loss,
                'take_profit': take_profit,
                'comment': comment,
                'magic': 2024001  # Expert ID
            }
            
            # সিমুলেটেড অর্ডার প্লেসমেন্ট
            # রিয়েল API: self.make_request(self.endpoints['place_order'], 'POST', data=order_data)
            
            order_id = f"ORDER_{int(time.time())}"
            
            # কারেন্ট প্রাইস (সিমুলেটেড)
            current_price = self.get_symbol_price(symbol)
            
            order_result = {
                'order_id': order_id,
                'symbol': symbol,
                'type': order_type.upper(),
                'volume': volume,
                'open_price': current_price,
                'stop_loss': stop_loss,
                'take_profit': take_profit,
                'profit': 0.0,
                'commission': 0.0,
                'swap': 0.0,
                'open_time': datetime.now().isoformat(),
                'comment': comment,
                'status': 'OPEN'
            }
            
            logging.info(f"নতুন অর্ডার প্লেস হয়েছে: {symbol} {order_type} {volume}")
            
            return {
                'success': True,
                'message': 'অর্ডার সফলভাবে প্লেস হয়েছে',
                'data': order_result
            }
            
        except Exception as e:
            error_msg = f"অর্ডার প্লেস করতে ব্যর্থ: {str(e)}"
            logging.error(error_msg)
            return {'success': False, 'error': error_msg}
    
    def close_order(self, order_id: str, volume: float = None) -> Dict:
        """অর্ডার ক্লোজ করে"""
        if not self.is_connected:
            return {'success': False, 'error': 'অ্যাকাউন্ট কানেক্ট নেই'}
        
        try:
            # সিমুলেটেড অর্ডার ক্লোজ
            # রিয়েল API: self.make_request(self.endpoints['close_order'], 'POST', data={'order_id': order_id})
            
            # প্রফিট/লস ক্যালকুলেশন (সিমুলেটেড)
            profit_loss = round(np.random.uniform(-50, 100), 2)
            
            close_result = {
                'order_id': order_id,
                'close_price': self.get_symbol_price('EUR/USD'),  # সিমুলেটেড
                'profit': profit_loss,
                'close_time': datetime.now().isoformat(),
                'status': 'CLOSED'
            }
            
            logging.info(f"অর্ডার ক্লোজ হয়েছে: {order_id}, P/L: ${profit_loss}")
            
            return {
                'success': True,
                'message': 'অর্ডার সফলভাবে ক্লোজ হয়েছে',
                'data': close_result
            }
            
        except Exception as e:
            error_msg = f"অর্ডার ক্লোজ করতে ব্যর্থ: {str(e)}"
            logging.error(error_msg)
            return {'success': False, 'error': error_msg}
    
    def modify_order(self, order_id: str, stop_loss: float = None, 
                    take_profit: float = None) -> Dict:
        """অর্ডার মডিফাই করে"""
        if not self.is_connected:
            return {'success': False, 'error': 'অ্যাকাউน্ট কানেক্ট নেই'}
        
        try:
            modify_data = {
                'order_id': order_id
            }
            
            if stop_loss is not None:
                modify_data['stop_loss'] = stop_loss
            if take_profit is not None:
                modify_data['take_profit'] = take_profit
            
            # সিমুলেটেড অর্ডার মডিফিকেশন
            # রিয়েল API: self.make_request(self.endpoints['modify_order'], 'PUT', data=modify_data)
            
            modify_result = {
                'order_id': order_id,
                'stop_loss': stop_loss,
                'take_profit': take_profit,
                'modify_time': datetime.now().isoformat()
            }
            
            logging.info(f"অর্ডার মডিফাই হয়েছে: {order_id}")
            
            return {
                'success': True,
                'message': 'অর্ডার সফলভাবে মডিফাই হয়েছে',
                'data': modify_result
            }
            
        except Exception as e:
            error_msg = f"অর্ডার মডিফাই করতে ব্যর্থ: {str(e)}"
            logging.error(error_msg)
            return {'success': False, 'error': error_msg}
    
    def get_symbols_list(self) -> Dict:
        """ট্রেড করা যাবে এমন সিম্বলগুলোর লিস্ট রিটার্ন করে"""
        try:
            # সিমুলেটেড সিম্বল লিস্ট
            symbols = Config.TRADING_PAIRS
            
            symbols_info = []
            for symbol in symbols:
                symbols_info.append({
                    'symbol': symbol,
                    'description': self.get_symbol_description(symbol),
                    'digits': 5,
                    'spread': round(np.random.uniform(0.1, 2.0), 2),
                    'trade_enabled': True,
                    'min_volume': 0.01,
                    'max_volume': 100.0,
                    'volume_step': 0.01
                })
            
            return {
                'success': True,
                'data': symbols_info
            }
            
        except Exception as e:
            error_msg = f"সিম্বল লিস্ট লোড করতে ব্যর্থ: {str(e)}"
            logging.error(error_msg)
            return {'success': False, 'error': error_msg}
    
    def get_market_data(self, symbol: str, timeframe: str = 'M1') -> Dict:
        """মার্কেট ডাটা রিটার্ন করে"""
        try:
            # সিমুলেটেড মার্কেট ডাটা
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
                'timestamp': datetime.now().isoformat(),
                'bid': current_price * 0.9998,  # Spread consideration
                'ask': current_price * 1.0002,
                'high': base_price * (1 + abs(variation) + 0.0005),
                'low': base_price * (1 - abs(variation) - 0.0005),
                'volume': np.random.randint(1000, 10000),
                'spread': round((current_price * 1.0002 - current_price * 0.9998) * 10000, 1)
            }
            
            return {
                'success': True,
                'data': market_data
            }
            
        except Exception as e:
            error_msg = f"মার্কেট ডাটা লোড করতে ব্যর্থ: {str(e)}"
            logging.error(error_msg)
            return {'success': False, 'error': error_msg}
    
    def get_symbol_price(self, symbol: str) -> float:
        """সিম্বলের কারেন্ট প্রাইস রিটার্ন করে"""
        try:
            market_data = self.get_market_data(symbol)
            if market_data['success']:
                return (market_data['data']['bid'] + market_data['data']['ask']) / 2
            else:
                return 1.0  # Fallback price
        except:
            return 1.0
    
    def get_symbol_description(self, symbol: str) -> str:
        """সিম্বলের ডেসক্রিপশন রিটার্ন করে"""
        descriptions = {
            'EUR/USD': 'Euro vs US Dollar',
            'GBP/USD': 'British Pound vs US Dollar',
            'USD/JPY': 'US Dollar vs Japanese Yen',
            'USD/CHF': 'US Dollar vs Swiss Franc',
            'AUD/USD': 'Australian Dollar vs US Dollar',
            'USD/CAD': 'US Dollar vs Canadian Dollar',
            'NZD/USD': 'New Zealand Dollar vs US Dollar',
            'EUR/GBP': 'Euro vs British Pound',
            'XAU/USD': 'Gold vs US Dollar',
            'XAG/USD': 'Silver vs US Dollar',
            'BTC/USD': 'Bitcoin vs US Dollar',
            'ETH/USD': 'Ethereum vs US Dollar',
            'US30': 'Dow Jones Industrial Average',
            'SPX500': 'S&P 500 Index',
            'NAS100': 'NASDAQ 100 Index',
            'DJ30': 'Dow Jones 30'
        }
        return descriptions.get(symbol, f'{symbol} Currency Pair')
    
    def get_account_summary(self) -> Dict:
        """অ্যাকাউন্ট সামারি রিটার্ন করে"""
        if not self.is_connected:
            return {'success': False, 'error': 'অ্যাকাউন্ট কানেক্ট নেই'}
        
        try:
            balance_info = self.get_account_balance()
            open_orders = self.get_open_orders()
            
            if not balance_info['success']:
                return balance_info
            
            summary = {
                'account_info': self.account_info,
                'balance_info': balance_info['data'],
                'open_orders_count': len(open_orders['data']) if open_orders['success'] else 0,
                'open_positions': open_orders['data'] if open_orders['success'] else [],
                'server_time': datetime.now().isoformat(),
                'connection_status': 'Connected'
            }
            
            return {
                'success': True,
                'data': summary
            }
            
        except Exception as e:
            error_msg = f"অ্যাকাউন্ট সামারি লোড করতে ব্যর্থ: {str(e)}"
            logging.error(error_msg)
            return {'success': False, 'error': error_msg}
    
    def disconnect(self):
        """অ্যাকাউন্ট ডিসকানেক্ট করে"""
        self.is_connected = False
        self.account_info = {}
        self.session.close()
        logging.info("Exness অ্যাকাউন্ট থেকে ডিসকানেক্ট হয়েছে")

# গ্লোবাল ইন্সট্যান্স
exness_api = ExnessAPI()
