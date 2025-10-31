from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import logging
import os
from datetime import datetime
import json

from config import config
from database import db, init_db, User, TradingAccount, TradingSession, Trade, SystemLog
from trading_ai import trading_ai
from gemini_integration import gemini_ai
from exness_api import exness_api

# অ্যাপ্লিকেশন সেটআপ
app = Flask(__name__)
app.config.from_object(config['development'])

# ডাটাবেস ইনিশিয়ালাইজ
init_db(app)

# লগিন ম্যানেজার
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'অনুগ্রহ করে লগইন করুন'
login_manager.login_message_category = 'info'

# লগিং কনফিগ
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# রুটস
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        try:
            data = request.get_json()
            exness_id = data.get('exness_id')
            password = data.get('password')
            
            # ডেমো অথেন্টিকেশন (রিয়েল ইম্প্লিমেন্টেশনে ডাটাবেস চেক করতে হবে)
            if exness_id and password:
                # এক্সনেস API দিয়ে ভেরিফিকেশন
                api_result = exness_api.connect_account(exness_id, password)
                
                if api_result['success']:
                    # ইউজার চেক বা তৈরি
                    user = User.query.filter_by(exness_id=exness_id).first()
                    if not user:
                        user = User(
                            exness_id=exness_id,
                            email=f"{exness_id}@exness.com",
                            password_hash=password,  # রিয়েল ইম্প্লিমেন্টেশনে হ্যাশ করতে হবে
                            is_verified=True
                        )
                        db.session.add(user)
                        db.session.commit()
                    
                    # ট্রেডিং অ্যাকাউন্ট চেক বা তৈরি
                    account = TradingAccount.query.filter_by(user_id=user.id).first()
                    if not account:
                        account = TradingAccount(
                            user_id=user.id,
                            account_number=api_result['account_info']['account_number'],
                            account_type='real',
                            balance=api_result['account_info']['balance'],
                            currency=api_result['account_info']['currency'],
                            leverage=api_result['account_info']['leverage']
                        )
                        db.session.add(account)
                        db.session.commit()
                    
                    # লগিন
                    login_user(user)
                    user.last_login = datetime.utcnow()
                    db.session.commit()
                    
                    # সিস্টেম লগ
                    system_log = SystemLog(
                        level='INFO',
                        module='Auth',
                        message=f'ইউজার লগইন হয়েছে: {exness_id}',
                        user_id=user.id
                    )
                    db.session.add(system_log)
                    db.session.commit()
                    
                    return jsonify({
                        'status': 'success',
                        'message': 'লগইন সফল!',
                        'redirect': url_for('dashboard')
                    })
                else:
                    return jsonify({
                        'status': 'error',
                        'message': api_result.get('error', 'লগইন ব্যর্থ')
                    })
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'Exness ID এবং পাসওয়ার্ড প্রয়োজন'
                })
                
        except Exception as e:
            logging.error(f"লগইন এ error: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': f'লগইন প্রসেসে ত্রুটি: {str(e)}'
            })
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    # ট্রেডিং সেশন বন্ধ
    if trading_ai.is_active:
        trading_ai.stop_trading_session()
    
    # এক্সনেস ডিসকানেক্ট
    exness_api.disconnect()
    
    # সিস্টেম লগ
    system_log = SystemLog(
        level='INFO',
        module='Auth',
        message=f'ইউজার লগআউট হয়েছে: {current_user.exness_id}',
        user_id=current_user.id
    )
    db.session.add(system_log)
    db.session.commit()
    
    logout_user()
    flash('সফলভাবে লগআউট হয়েছে', 'success')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    # অ্যাকাউন্ট ইনফো
    account = TradingAccount.query.filter_by(user_id=current_user.id).first()
    
    # সেশন হিস্ট্রি
    sessions = TradingSession.query.filter_by(user_id=current_user.id).order_by(TradingSession.start_time.desc()).limit(5).all()
    
    # রিসেন্ট ট্রেডস
    recent_trades = Trade.query.join(TradingSession).filter(
        TradingSession.user_id == current_user.id
    ).order_by(Trade.open_time.desc()).limit(10).all()
    
    return render_template('dashboard.html', 
                         account=account,
                         sessions=sessions,
                         recent_trades=recent_trades)

@app.route('/start_trading', methods=['POST'])
@login_required
def start_trading():
    try:
        data = request.get_json()
        initial_amount = float(data.get('initial_amount', 5))
        target_amount = float(data.get('target_amount', 7))
        strategy_config = data.get('strategy_config', {})
        
        # এক্সনেস অ্যাকাউন্ট চেক
        if not exness_api.is_connected:
            return jsonify({
                'status': 'error',
                'message': 'Exness অ্যাকাউন্টে কানেক্ট নেই। অনুগ্রহ করে পুনরায় লগইন করুন।'
            })
        
        # ট্রেডিং সেশন শুরু
        result = trading_ai.start_trading_session(
            user_id=current_user.id,
            initial_balance=initial_amount,
            target_balance=target_amount,
            strategy_config=strategy_config
        )
        
        if result['status'] == 'success':
            # ডাটাবেসে সেশন সেভ
            trading_session = TradingSession(
                user_id=current_user.id,
                session_id=result['session_id'],
                initial_balance=initial_amount,
                target_balance=target_amount,
                current_balance=initial_amount,
                ai_strategy=json.dumps(strategy_config)
            )
            db.session.add(trading_session)
            db.session.commit()
            
            return jsonify(result)
        else:
            return jsonify(result)
            
    except Exception as e:
        logging.error(f"ট্রেডিং শুরু করতে ব্যর্থ: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'ট্রেডিং শুরু করতে ব্যর্থ: {str(e)}'
        })

@app.route('/stop_trading', methods=['POST'])
@login_required
def stop_trading():
    try:
        result = trading_ai.stop_trading_session()
        
        if result['status'] == 'success' and trading_ai.current_session:
            # ডাটাবেস সেশন আপডেট
            session = TradingSession.query.filter_by(
                session_id=trading_ai.current_session['session_id']
            ).first()
            
            if session:
                session.end_time = datetime.utcnow()
                session.status = 'stopped'
                session.current_balance = trading_ai.current_session['current_balance']
                db.session.commit()
        
        return jsonify(result)
        
    except Exception as e:
        logging.error(f"ট্রেডিং বন্ধ করতে ব্যর্থ: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'ট্রেডিং বন্ধ করতে ব্যর্থ: {str(e)}'
        })

@app.route('/get_live_data')
@login_required
def get_live_data():
    try:
        live_data = trading_ai.get_live_data()
        
        # এক্সনেস অ্যাকাউন্ট ডাটা যোগ
        if exness_api.is_connected:
            account_summary = exness_api.get_account_summary()
            if account_summary['success']:
                live_data['exness_account'] = account_summary['data']
        
        return jsonify({
            'status': 'success',
            'data': live_data
        })
        
    except Exception as e:
        logging.error(f"লাইভ ডাটা লোড করতে ব্যর্থ: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'লাইভ ডাটা লোড করতে ব্যর্থ: {str(e)}'
        })

@app.route('/get_suggestions')
@login_required
def get_suggestions():
    try:
        suggestions = gemini_ai.get_token_suggestions(
            available_pairs=Config.TRADING_PAIRS,
            market_conditions="Normal volatility, trending market"
        )
        
        return jsonify({
            'status': 'success',
            'suggestions': suggestions
        })
        
    except Exception as e:
        logging.error(f"সুজেশন লোড করতে ব্যর্থ: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'সুজেশন লোড করতে ব্যর্থ: {str(e)}'
        })

@app.route('/ai_chat', methods=['POST'])
@login_required
def ai_chat():
    try:
        data = request.get_json()
        user_message = data.get('message')
        conversation_history = data.get('history', [])
        
        if not user_message:
            return jsonify({
                'status': 'error',
                'message': 'মেসেজ প্রয়োজন'
            })
        
        # AI এর সাথে চ্যাট
        ai_response = gemini_ai.chat_with_ai(user_message, conversation_history)
        
        # কনভারসেশন হিস্ট্রি আপডেট
        new_history = conversation_history + [
            {'role': 'user', 'content': user_message},
            {'role': 'assistant', 'content': ai_response}
        ]
        
        return jsonify({
            'status': 'success',
            'response': ai_response,
            'history': new_history
        })
        
    except Exception as e:
        logging.error(f"AI চ্যাটে ত্রুটি: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'AI চ্যাটে ত্রুটি: {str(e)}'
        })

@app.route('/trading_preview')
@login_required
def trading_preview():
    return render_template('preview.html')

@app.route('/analytics')
@login_required
def analytics():
    # ট্রেডিং স্ট্যাটিস্টিকস
    sessions = TradingSession.query.filter_by(user_id=current_user.id).all()
    trades = Trade.query.join(TradingSession).filter(
        TradingSession.user_id == current_user.id
    ).all()
    
    # পারফরম্যান্স ক্যালকুলেশন
    total_trades = len(trades)
    profitable_trades = len([t for t in trades if t.profit_loss and t.profit_loss > 0])
    success_rate = (profitable_trades / total_trades * 100) if total_trades > 0 else 0
    
    total_profit = sum([t.profit_loss for t in trades if t.profit_loss])
    avg_profit = total_profit / total_trades if total_trades > 0 else 0
    
    return render_template('analytics.html',
                         total_trades=total_trades,
                         profitable_trades=profitable_trades,
                         success_rate=success_rate,
                         total_profit=total_profit,
                         avg_profit=avg_profit,
                         trades=trades)

@app.route('/ai_chat_interface')
@login_required
def ai_chat_interface():
    return render_template('ai_chat.html')

# API Routes for mobile app
@app.route('/api/account/balance')
@login_required
def api_account_balance():
    if exness_api.is_connected:
        result = exness_api.get_account_balance()
        return jsonify(result)
    else:
        return jsonify({
            'success': False,
            'error': 'অ্যাকাউন্ট কানেক্ট নেই'
        })

@app.route('/api/trading/status')
@login_required
def api_trading_status():
    return jsonify({
        'is_active': trading_ai.is_active,
        'current_session': trading_ai.current_session,
        'performance': trading_ai.performance_metrics
    })

@app.route('/api/market/overview')
@login_required
def api_market_overview():
    try:
        overview = []
        for symbol in Config.TRADING_PAIRS[:5]:  # প্রথম 5টি সিম্বল
            market_data = exness_api.get_market_data(symbol)
            if market_data['success']:
                overview.append(market_data['data'])
        
        return jsonify({
            'success': True,
            'data': overview
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# এরর হ্যান্ডলার
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500

if __name__ == '__main__':
    # লগ ফোল্ডার তৈরি
    os.makedirs('logs', exist_ok=True)
    os.makedirs('database', exist_ok=True)
    
    print("Exness AI Trading System starting...")
    print(f"Access URL: http://{Config.HOST}:{Config.PORT}")
    print("Gemini AI Integration: Active")
    print("Advanced Trading AI: Ready")
    
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG,
        threaded=True
                        )
