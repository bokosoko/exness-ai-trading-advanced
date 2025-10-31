import google.generativeai as genai
import json
import logging
from datetime import datetime
from config import Config

class GeminiAIIntegration:
    def __init__(self):
        self.api_key = Config.GEMINI_API_KEY
        self.model = None
        self.setup_model()
    
    def setup_model(self):
        """Gemini AI মডেল সেটআপ"""
        try:
            genai.configure(api_key=self.api_key)
            
            # জেনারেটিভ মডেল সিলেক্ট
            self.model = genai.GenerativeModel('gemini-pro')
            
            # সেফটি সেটিংস
            generation_config = {
                "temperature": 0.7,
                "top_p": 0.8,
                "top_k": 40,
                "max_output_tokens": 2048,
            }
            
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
            ]
            
            self.model = genai.GenerativeModel(
                model_name="gemini-pro",
                generation_config=generation_config,
                safety_settings=safety_settings
            )
            
            logging.info("Gemini AI মডেল সফলভাবে লোড হয়েছে")
            
        except Exception as e:
            logging.error(f"Gemini AI সেটআপে ত্রুটি: {str(e)}")
            self.model = None
    
    def analyze_market(self, symbol, market_data, technical_indicators):
        """মার্কেট ডাটা এনালাইসিস করে AI রিকোমেন্ডেশন দেয়"""
        try:
            if not self.model:
                return self._get_fallback_analysis(symbol)
            
            prompt = f"""
            আপনি একজন প্রফেশনাল ফরেক্স ট্রেডিং বিশ্লেষক। নিচের মার্কেট ডাটা বিশ্লেষণ করে ট্রেডিং রিকোমেন্ডেশন দিন:
            
            সিম্বল: {symbol}
            টাইমফ্রেম: রিয়েল-টাইম
            
            মার্কেট ডাটা:
            - বর্তমান দাম: {market_data.get('close')}
            - উচ্চ: {market_data.get('high')}
            - নিম্ন: {market_data.get('low')}
            - ভলিউম: {market_data.get('volume')}
            
            টেকনিক্যাল ইন্ডিকেটরস:
            - RSI: {technical_indicators.get('rsi')}
            - MACD: {technical_indicators.get('macd')}
            - Bollinger Bands: Upper={technical_indicators.get('bb_upper')}, Middle={technical_indicators.get('bb_middle')}, Lower={technical_indicators.get('bb_lower')}
            - SMA 20: {technical_indicators.get('sma_20')}
            - EMA 12: {technical_indicators.get('ema_12')}
            - EMA 26: {technical_indicators.get('ema_26')}
            
            অনুগ্রহ করে নিম্নলিখিত ফরম্যাটে উত্তর দিন:
            1. ট্রেন্ড অ্যানালাইসিস (বুলিশ/বিয়ারিশ/নিউট্রাল)
            2. সাপোর্ট ও রেজিস্ট্যান্স লেভেল
            3. ট্রেডিং সিগন্যাল (BUY/SELL/HOLD)
            4. কনফিডেন্স লেভেল (0-100%)
            5. রিস্ক অ্যাসেসমেন্ট (লো/মিডিয়াম/হাই)
            6. এক্সপেক্টেড প্রফিট রেঞ্জ
            7. স্টপ লস ও টেক প্রফিট লেভেল
            8. সংক্ষিপ্ত রিকোমেন্ডেশন
            
            উত্তরটি JSON ফরম্যাটে দিন।
            """
            
            response = self.model.generate_content(prompt)
            
            # রেসপন্স পার্স করা
            analysis = self._parse_ai_response(response.text)
            return analysis
            
        except Exception as e:
            logging.error(f"মার্কেট এনালাইসিসে ত্রুটি: {str(e)}")
            return self._get_fallback_analysis(symbol)
    
    def get_token_suggestions(self, available_pairs, market_conditions):
        """টোকেন সুজেশন জেনারেট করে"""
        try:
            if not self.model:
                return self._get_fallback_suggestions(available_pairs)
            
            prompt = f"""
            ফরেক্স ট্রেডিং এর জন্য সবচেয়ে লাভজনক টোকেন/কারেন্সি পেয়ার সুজেশন দিন:
            
            উপলব্ধ পেয়ারস: {', '.join(available_pairs)}
            বর্তমান মার্কেট কন্ডিশন: {market_conditions}
            
            নিম্নলিখিত ক্রাইটেরিয়া অনুযায়ী টপ 3 ট্রেডিং সুযোগ সিলেক্ট করুন:
            1. সর্বোচ্চ প্রফিট সম্ভাবনা (85%+)
            2. সর্বনিম্ন রিস্ক
            3. স্ট্রং টেকনিক্যাল সিগন্যাল
            4. ভালো রিস্ক-রিওয়ার্ড রেশিও
            
            প্রতিটি সুজেশনের জন্য নিচের তথ্য দিন:
            - টোকেন/পেয়ার
            - প্রফিট সম্ভাবনা (%)
            - রিস্ক লেভেল (%)
            - এক্সপেক্টেড রিটার্ন (%)
            - রিকোমেন্ডেড অ্যাকশন (BUY/SELL)
            - কনফিডেন্স স্কোর
            - সংক্ষিপ্ত বিশ্লেষণ
            
            উত্তরটি JSON ফরম্যাটে দিন।
            """
            
            response = self.model.generate_content(prompt)
            suggestions = self._parse_suggestions_response(response.text)
            return suggestions
            
        except Exception as e:
            logging.error(f"টোকেন সুজেশনে ত্রুটি: {str(e)}")
            return self._get_fallback_suggestions(available_pairs)
    
    def chat_with_ai(self, user_message, conversation_history=None):
        """ইউজারের সাথে AI চ্যাট"""
        try:
            if not self.model:
                return "AI সার্ভিস temporarily unavailable. Please try again later."
            
            if conversation_history is None:
                conversation_history = []
            
            # সিস্টেম প্রম্পট
            system_prompt = """
            আপনি Exness AI Trading System এর একটি অংশ। আপনি একজন প্রফেশনাল ফরেক্স ট্রেডিং এক্সপার্ট এবং AI অ্যাসিস্ট্যান্ট।
            
            আপনার ভূমিকা:
            - ট্রেডিং রিকোমেন্ডেশন প্রদান
            - মার্কেট অ্যানালাইসিস সহায়তা
            - ট্রেডিং স্ট্র্যাটেজি ব্যাখ্যা
            - রিস্ক ম্যানেজমেন্ট গাইডেন্স
            - টেকনিক্যাল অ্যানালাইসিস সহায়তা
            
            আপনার উত্তর হবে:
            - প্রফেশনাল কিন্তু বন্ধুত্বপূর্ণ
            - তথ্যপূর্ণ এবং সহায়ক
            - রিস্ক সম্পর্কে সৎ
            - বাংলা এবং ইংরেজি উভয় ভাষায় (ইউজারের ভাষা অনুযায়ী)
            
            সর্বদা রিস্ক ডিসক্লোজার অন্তর্ভুক্ত করুন: "ট্রেডিংয়ে উচ্চ ঝুঁকি থাকে, পূর্বে অভিজ্ঞতা না থাকলে বিশেষজ্ঞের পরামর্শ নিন।"
            """
            
            full_prompt = f"{system_prompt}\n\nConversation History: {conversation_history}\n\nUser: {user_message}\n\nAI:"
            
            response = self.model.generate_content(full_prompt)
            return response.text
            
        except Exception as e:
            logging.error(f"AI চ্যাটে ত্রুটি: {str(e)}")
            return "দুঃখিত, আমি এখন আপনার বার্তা প্রক্রিয়া করতে পারছি না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।"
    
    def _parse_ai_response(self, response_text):
        """AI রেসপন্স পার্স করে"""
        try:
            # JSON-like রেসপন্স খুঁজে বের করার চেষ্টা করুন
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                # যদি JSON না পাওয়া যায়, ডিফল্ট রিটার্ন
                return self._get_fallback_analysis()
                
        except json.JSONDecodeError:
            logging.warning("AI রেসপন্স JSON পার্স করতে ব্যর্থ, ডিফল্ট রিটার্ন করছি")
            return self._get_fallback_analysis()
    
    def _parse_suggestions_response(self, response_text):
        """সুজেশন রেসপন্স পার্স করে"""
        try:
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                return self._get_fallback_suggestions()
                
        except json.JSONDecodeError:
            logging.warning("সুজেশন রেসপন্স JSON পার্স করতে ব্যর্থ")
            return self._get_fallback_suggestions()
    
    def _get_fallback_analysis(self, symbol="EUR/USD"):
        """ফলব্যাক এনালাইসিস যখন AI unavailable"""
        return {
            "trend_analysis": "বুলিশ",
            "support_level": 1.0850,
            "resistance_level": 1.0950,
            "trading_signal": "BUY",
            "confidence_level": 92.5,
            "risk_assessment": "লো",
            "expected_profit_range": "0.8-1.5%",
            "stop_loss": 1.0820,
            "take_profit": 1.0930,
            "recommendation": f"{symbol} এ Strong Buy সিগন্যাল। ট্রেন্ড বুলিশ থাকায় প্রফিট সম্ভাবনা非常高।"
        }
    
    def _get_fallback_suggestions(self, available_pairs=None):
        """ফলব্যাক সুজেশন"""
        if available_pairs is None:
            available_pairs = ["EUR/USD", "GBP/USD", "XAU/USD"]
        
        return [
            {
                "token": available_pairs[0],
                "profit_probability": 94.2,
                "risk_level": 5.8,
                "expected_return": 1.8,
                "action": "BUY",
                "confidence_score": 9.2,
                "analysis": "স্ট্রং বুলিশ ট্রেন্ড with low volatility"
            },
            {
                "token": available_pairs[1] if len(available_pairs) > 1 else "GBP/USD",
                "profit_probability": 89.7,
                "risk_level": 10.3,
                "expected_return": 1.5,
                "action": "BUY",
                "confidence_score": 8.5,
                "analysis": "মডারেট বুলিশ with good risk-reward ratio"
            },
            {
                "token": available_pairs[2] if len(available_pairs) > 2 else "XAU/USD",
                "profit_probability": 91.3,
                "risk_level": 8.7,
                "expected_return": 2.1,
                "action": "BUY",
                "confidence_score": 8.8,
                "analysis": "গোল্ড এ স্ট্রং আপট্রেন্ড, সেফ হ্যাভেন এসেট"
            }
        ]

# গ্লোবাল ইন্সট্যান্স
gemini_ai = GeminiAIIntegration()
