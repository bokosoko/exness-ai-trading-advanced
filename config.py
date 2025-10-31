
import os
from datetime import timedelta

class Config:
    # বেসিক কনফিগ
    SECRET_KEY = os.getenv('SECRET_KEY', 'exness_ai_advanced_secret_2024')
    
    # Gemini AI কনফিগ
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'AIzaSyBK_L1WfYs9DxiY4wyOeGEG7U2WjuWSf9g')
    
    # ট্রেডিং কনফিগ
    DEFAULT_INITIAL_BALANCE = 5.0
    DEFAULT_TARGET_BALANCE = 7.0
    MAX_RISK_PER_TRADE = 0.02  # 2%
    MIN_PROFIT_PROBABILITY = 0.85  # 85%
    
    # ট্রেডিং পেয়ারস
    TRADING_PAIRS = [
        'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
        'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
        'XAU/USD', 'XAG/USD', 'BTC/USD', 'ETH/USD',
        'US30', 'SPX500', 'NAS100', 'DJ30'
    ]
    
    # API সেটিংস
    REQUEST_TIMEOUT = 30
    MAX_RETRIES = 3
    
    # সেশন কনফিগ
    PERMANENT_SESSION_LIFETIME = timedelta(days=1)
    
    # ডাটাবেস কনফিগ
    DATABASE_PATH = 'database/trading.db'
    
    # নোটিফিকেশন
    ENABLE_SOUND_NOTIFICATIONS = True
    ENABLE_EMAIL_ALERTS = False

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
  }
