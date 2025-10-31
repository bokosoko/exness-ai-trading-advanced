from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import json

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    exness_id = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_verified = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    
    # রিলেশনশিপ
    trading_accounts = db.relationship('TradingAccount', backref='user', lazy=True)
    trading_sessions = db.relationship('TradingSession', backref='user', lazy=True)

class TradingAccount(db.Model):
    __tablename__ = 'trading_accounts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    account_number = db.Column(db.String(50), unique=True, nullable=False)
    account_type = db.Column(db.String(20), default='real')  # real/demo
    balance = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(10), default='USD')
    leverage = db.Column(db.Integer, default=100)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # রিলেশনশিপ
    trades = db.relationship('Trade', backref='account', lazy=True)

class TradingSession(db.Model):
    __tablename__ = 'trading_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_id = db.Column(db.String(100), unique=True, nullable=False)
    initial_balance = db.Column(db.Float, nullable=False)
    target_balance = db.Column(db.Float, nullable=False)
    current_balance = db.Column(db.Float, nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='running')  # running, completed, stopped
    ai_strategy = db.Column(db.Text)  # JSON string of AI strategy
    
    # রিলেশনশিপ
    trades = db.relationship('Trade', backref='session', lazy=True)

class Trade(db.Model):
    __tablename__ = 'trades'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('trading_sessions.id'), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('trading_accounts.id'), nullable=False)
    trade_id = db.Column(db.String(100), unique=True, nullable=False)
    symbol = db.Column(db.String(20), nullable=False)
    action = db.Column(db.String(10), nullable=False)  # BUY/SELL
    volume = db.Column(db.Float, nullable=False)
    entry_price = db.Column(db.Float, nullable=False)
    exit_price = db.Column(db.Float)
    stop_loss = db.Column(db.Float)
    take_profit = db.Column(db.Float)
    profit_loss = db.Column(db.Float, default=0.0)
    commission = db.Column(db.Float, default=0.0)
    swap = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='open')  # open, closed, cancelled
    open_time = db.Column(db.DateTime, default=datetime.utcnow)
    close_time = db.Column(db.DateTime)
    duration = db.Column(db.Float)  # in minutes
    
    # AI Analysis Data
    ai_confidence = db.Column(db.Float)  # 0-1
    ai_analysis = db.Column(db.Text)  # JSON string
    market_condition = db.Column(db.String(50))

class MarketData(db.Model):
    __tablename__ = 'market_data'
    
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    open = db.Column(db.Float)
    high = db.Column(db.Float)
    low = db.Column(db.Float)
    close = db.Column(db.Float)
    volume = db.Column(db.Float)
    
    # টেকনিক্যাল ইন্ডিকেটরস
    rsi = db.Column(db.Float)
    macd = db.Column(db.Float)
    macd_signal = db.Column(db.Float)
    macd_histogram = db.Column(db.Float)
    bollinger_upper = db.Column(db.Float)
    bollinger_lower = db.Column(db.Float)
    bollinger_middle = db.Column(db.Float)
    sma_20 = db.Column(db.Float)
    ema_12 = db.Column(db.Float)
    ema_26 = db.Column(db.Float)

class AIAnalysis(db.Model):
    __tablename__ = 'ai_analysis'
    
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    time_frame = db.Column(db.String(10), default='M5')  # M1, M5, M15, H1, etc.
    
    # Analysis Results
    trend_direction = db.Column(db.String(10))  # bullish, bearish, neutral
    trend_strength = db.Column(db.Float)  # 0-1
    support_level = db.Column(db.Float)
    resistance_level = db.Column(db.Float)
    volatility = db.Column(db.Float)
    market_sentiment = db.Column(db.String(20))
    
    # Trading Signals
    signal = db.Column(db.String(10))  # BUY, SELL, HOLD
    signal_confidence = db.Column(db.Float)  # 0-1
    expected_profit = db.Column(db.Float)
    potential_risk = db.Column(db.Float)
    risk_reward_ratio = db.Column(db.Float)
    
    # AI Insights
    gemini_analysis = db.Column(db.Text)
    technical_summary = db.Column(db.Text)
    fundamental_factors = db.Column(db.Text)

class SystemLog(db.Model):
    __tablename__ = 'system_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    level = db.Column(db.String(20))  # INFO, WARNING, ERROR, DEBUG
    module = db.Column(db.String(50))
    message = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    session_id = db.Column(db.String(100))
    
    # Additional context
    data = db.Column(db.Text)  # JSON string

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
