// AI Chat Assistant for Trading

class AIChatAssistant {
    constructor() {
        this.conversationHistory = [];
        this.isTyping = false;
        this.voiceEnabled = false;
        this.initializeChatSystem();
    }

    initializeChatSystem() {
        console.log('🤖 AI Chat Assistant Initializing...');
        
        this.setupChatInterface();
        this.setupEventListeners();
        this.loadConversationHistory();
        this.setupVoiceRecognition();
        
        console.log('✅ AI Chat Assistant Ready');
        
        // Show welcome message
        this.showWelcomeMessage();
    }

    setupChatInterface() {
        this.chatContainer = document.getElementById('aiChatContainer');
        this.messagesContainer = document.getElementById('aiChatMessages');
        this.inputField = document.getElementById('aiChatInput');
        this.sendButton = document.getElementById('aiChatSend');
        this.voiceButton = document.getElementById('aiChatVoice');
        this.clearButton = document.getElementById('aiChatClear');
        
        // Create message container if it doesn't exist
        if (!this.messagesContainer) {
            this.messagesContainer = document.createElement('div');
            this.messagesContainer.id = 'aiChatMessages';
            this.messagesContainer.className = 'ai-chat-messages space-y-4';
            this.chatContainer.appendChild(this.messagesContainer);
        }
    }

    setupEventListeners() {
        // Send message on button click
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // Send message on Enter key
        if (this.inputField) {
            this.inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Voice input toggle
        if (this.voiceButton) {
            this.voiceButton.addEventListener('click', () => {
                this.toggleVoiceInput();
            });
        }

        // Clear conversation
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                this.clearConversation();
            });
        }

        // Auto-resize textarea
        if (this.inputField) {
            this.inputField.addEventListener('input', () => {
                this.autoResizeTextarea();
            });
        }
    }

    setupVoiceRecognition() {
        // Check if browser supports speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'bn-BD'; // Bengali language
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.inputField.value = transcript;
                this.autoResizeTextarea();
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showNotification('ভয়েস রিকগনিশন ত্রুটি', 'error');
            };
        } else {
            console.warn('Speech recognition not supported');
            if (this.voiceButton) {
                this.voiceButton.style.display = 'none';
            }
        }
    }

    async sendMessage() {
        const message = this.inputField.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addMessageToChat('user', message);
        
        // Clear input field
        this.inputField.value = '';
        this.autoResizeTextarea();
        
        // Disable input while AI is thinking
        this.setInputState(false);
        
        try {
            // Send message to AI
            const response = await this.getAIResponse(message);
            
            // Add AI response to chat
            this.addMessageToChat('assistant', response);
            
        } catch (error) {
            console.error('AI chat error:', error);
            this.addMessageToChat('assistant', 'দুঃখিত, আমি এখন আপনার বার্তা প্রক্রিয়া করতে পারছি না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।');
        } finally {
            // Re-enable input
            this.setInputState(true);
        }
    }

    async getAIResponse(userMessage) {
        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        });
        
        try {
            const response = await fetch('/ai_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    history: this.conversationHistory.slice(-10) // Last 10 messages
                })
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                // Add AI response to history
                this.conversationHistory.push({
                    role: 'assistant',
                    content: result.response,
                    timestamp: new Date()
                });
                
                // Save conversation history
                this.saveConversationHistory();
                
                return result.response;
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            console.error('AI API error:', error);
            
            // Fallback responses
            return this.getFallbackResponse(userMessage);
        }
    }

    getFallbackResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Simple keyword-based fallback responses
        if (lowerMessage.includes('হ্যালো') || lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
            return 'হ্যালো! আমি Exness AI Trading Assistant। আপনি কিভাবে সাহায্য করতে পারি?';
        }
        
        if (lowerMessage.includes('ট্রেড') || lowerMessage.includes('trade')) {
            return 'ট্রেডিং সম্পর্কে আমি আপনাকে সাহায্য করতে পারি। আপনি কোন কারেন্সি পেয়ার বা মার্কেট সম্পর্কে জানতে চান?';
        }
        
        if (lowerMessage.includes('ব্যালেন্স') || lowerMessage.includes('balance')) {
            return 'আপনার একাউন্ট ব্যালেন্স দেখতে ড্যাশবোর্ড চেক করুন। বর্তমান ট্রেডিং স্ট্যাটাসও সেখানে দেখতে পাবেন।';
        }
        
        if (lowerMessage.includes('সিগন্যাল') || lowerMessage.includes('signal')) {
            return 'AI ট্রেডিং সিগন্যাল স্বয়ংক্রিয়ভাবে জেনারেট হয়। আপনি "সুজেশন" বাটনে ক্লিক করে বর্তমান সুজেশনগুলো দেখতে পারেন।';
        }
        
        if (lowerMessage.includes('রিস্ক') || lowerMessage.includes('risk')) {
            return 'আমাদের সিস্টেমে অ্যাডভান্সড রিস্ক ম্যানেজমেন্ট আছে। প্রতিটি ট্রেডে সর্বোচ্চ ২% রিস্ক নেওয়া হয় এবং স্টপ লস অটো সেট করা হয়।';
        }
        
        if (lowerMessage.includes('সাফল্য') || lowerMessage.includes('success') || lowerMessage.includes('win')) {
            return 'আমাদের AI সিস্টেমের সাফল্যের হার ৮৫%-৯৫% এর মধ্যে থাকে, মার্কেট কন্ডিশনের উপর নির্ভর করে।';
        }
        
        return 'আমি এখনও শিখছি! আপনি ট্রেডিং, মার্কেট এনালাইসিস, বা রিস্ক ম্যানেজমেন্ট সম্পর্কে জিজ্ঞাসা করতে পারেন।';
    }

    addMessageToChat(role, content) {
        const messageElement = document.createElement('div');
        messageElement.className = `ai-chat-message ai-chat-message-${role} fade-in`;
        
        const timestamp = new Date().toLocaleTimeString('bn-BD', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        if (role === 'user') {
            messageElement.innerHTML = `
                <div class="ai-chat-message-content user-message">
                    <div class="message-text">${this.formatMessage(content)}</div>
                    <div class="message-time">${timestamp}</div>
                </div>
                <div class="ai-chat-avatar user-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        } else {
            messageElement.innerHTML = `
                <div class="ai-chat-avatar assistant-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="ai-chat-message-content assistant-message">
                    <div class="message-text">${this.formatMessage(content)}</div>
                    <div class="message-time">${timestamp}</div>
                    <div class="message-actions">
                        <button class="copy-message" title="কপি করুন">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="read-aloud" title="জোরে পড়ুন">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // Add event listeners for message actions
            this.setupMessageActions(messageElement, content);
        }
        
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        
        // If it's an AI message and voice is enabled, read it aloud
        if (role === 'assistant' && this.voiceEnabled) {
            this.readMessageAloud(content);
        }
    }

    formatMessage(content) {
        // Convert line breaks to <br>
        content = content.replace(/\n/g, '<br>');
        
        // Format trading-related terms
        content = this.highlightTradingTerms(content);
        
        return content;
    }

    highlightTradingTerms(content) {
        const tradingTerms = {
            'EUR/USD': '<span class="trading-term">EUR/USD</span>',
            'GBP/USD': '<span class="trading-term">GBP/USD</span>',
            'XAU/USD': '<span class="trading-term">XAU/USD</span>',
            'BTC/USD': '<span class="trading-term">BTC/USD</span>',
            'BUY': '<span class="signal-buy">BUY</span>',
            'SELL': '<span class="signal-sell">SELL</span>',
            'HOLD': '<span class="signal-hold">HOLD</span>',
            'স্টপ লস': '<span class="risk-term">স্টপ লস</span>',
            'টেক প্রফিট': '<span class="profit-term">টেক প্রফিট</span>',
            'রিস্ক': '<span class="risk-term">রিস্ক</span>',
            'রিওয়ার্ড': '<span class="profit-term">রিওয়ার্ড</span>'
        };
        
        Object.keys(tradingTerms).forEach(term => {
            const regex = new RegExp(term, 'gi');
            content = content.replace(regex, tradingTerms[term]);
        });
        
        return content;
    }

    setupMessageActions(messageElement, content) {
        const copyButton = messageElement.querySelector('.copy-message');
        const readButton = messageElement.querySelector('.read-aloud');
        
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                this.copyToClipboard(content);
            });
        }
        
        if (readButton) {
            readButton.addEventListener('click', () => {
                this.readMessageAloud(content);
            });
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('মেসেজ কপি করা হয়েছে!', 'success');
        } catch (err) {
            console.error('Copy failed:', err);
            this.showNotification('কপি করতে ব্যর্থ', 'error');
        }
    }

    readMessageAloud(text) {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'bn-BD'; // Bengali
            utterance.rate = 0.9;
            utterance.pitch = 1;
            
            utterance.onstart = () => {
                this.showNotification('মেসেজ পড়া হচ্ছে...', 'info');
            };
            
            utterance.onend = () => {
                console.log('Speech finished');
            };
            
            window.speechSynthesis.speak(utterance);
        } else {
            this.showNotification('টেক্সট-টু-স্পিচ সাপোর্টেড না', 'warning');
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.showNotification('ভয়েস ইনপুট সাপোর্টেড না', 'error');
            return;
        }
        
        if (this.voiceEnabled) {
            this.voiceEnabled = false;
            this.recognition.stop();
            this.voiceButton.classList.remove('active');
            this.showNotification('ভয়েস ইনপুট বন্ধ', 'info');
        } else {
            this.voiceEnabled = true;
            this.recognition.start();
            this.voiceButton.classList.add('active');
            this.showNotification('ভয়েস ইনপুট চালু - কথা বলুন...', 'info');
        }
    }

    setInputState(enabled) {
        if (this.inputField) {
            this.inputField.disabled = !enabled;
        }
        
        if (this.sendButton) {
            this.sendButton.disabled = !enabled;
        }
        
        if (this.voiceButton) {
            this.voiceButton.disabled = !enabled;
        }
        
        this.isTyping = !enabled;
        
        if (!enabled) {
            this.showTypingIndicator();
        } else {
            this.hideTypingIndicator();
        }
    }

    showTypingIndicator() {
        let typingIndicator = this.messagesContainer.querySelector('.typing-indicator');
        
        if (!typingIndicator) {
            typingIndicator = document.createElement('div');
            typingIndicator.className = 'ai-chat-message ai-chat-message-assistant typing-indicator';
            typingIndicator.innerHTML = `
                <div class="ai-chat-avatar assistant-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="ai-chat-message-content assistant-message">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            `;
            this.messagesContainer.appendChild(typingIndicator);
        }
        
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = this.messagesContainer.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    autoResizeTextarea() {
        if (this.inputField) {
            this.inputField.style.height = 'auto';
            this.inputField.style.height = Math.min(this.inputField.scrollHeight, 120) + 'px';
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showWelcomeMessage() {
        const welcomeMessage = `
হ্যালো! আমি Exness AI Trading Assistant। 🚀

আপনি আমাকে নিচের বিষয়গুলো জিজ্ঞাসা করতে পারেন:

📈 **ট্রেডিং সম্পর্কে:**
- বর্তমান মার্কেট কন্ডিশন
- ট্রেডিং সিগন্যাল
- রিস্ক ম্যানেজমেন্ট
- ট্রেডিং স্ট্র্যাটেজি

💡 **সিস্টেম সম্পর্কে:**
- AI ট্রেডিং কিভাবে কাজ করে
- সাফল্যের হার
- সেটআপ এবং কনফিগারেশন

🔧 **ট্রাবলশুটিং:**
- ট্রেডিং ইস্যু
- কানেকশন সমস্যা
- পারফরম্যান্স অপ্টিমাইজেশন

আপনি কি জানতে চান?
        `.trim();
        
        // Show welcome message after a short delay
        setTimeout(() => {
            this.addMessageToChat('assistant', welcomeMessage);
        }, 1000);
    }

    clearConversation() {
        if (confirm('আপনি কি এই কথোপকথন মুছে ফেলতে চান?')) {
            this.conversationHistory = [];
            this.messagesContainer.innerHTML = '';
            localStorage.removeItem('aiChatHistory');
            this.showWelcomeMessage();
            this.showNotification('কথোপকথন মুছে ফেলা হয়েছে', 'success');
        }
    }

    loadConversationHistory() {
        try {
            const saved = localStorage.getItem('aiChatHistory');
            if (saved) {
                this.conversationHistory = JSON.parse(saved);
                this.renderSavedConversation();
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }

    saveConversationHistory() {
        try {
            // Keep only last 50 messages to prevent storage overflow
            const recentHistory = this.conversationHistory.slice(-50);
            localStorage.setItem('aiChatHistory', JSON.stringify(recentHistory));
        } catch (error) {
            console.error('Error saving conversation history:', error);
        }
    }

    renderSavedConversation() {
        this.messagesContainer.innerHTML = '';
        
        this.conversationHistory.forEach(message => {
            this.addMessageToChat(message.role, message.content);
        });
        
        this.scrollToBottom();
    }

    showNotification(message, type = 'info') {
        if (window.exnessAI && window.exnessAI.showNotification) {
            window.exnessAI.showNotification(message, type);
        } else {
            // Fallback notification
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Quick action methods for common queries
    async askAboutMarket() {
        this.inputField.value = 'বর্তমান মার্কেট কন্ডিশন কেমন?';
        await this.sendMessage();
    }

    async askAboutSignals() {
        this.inputField.value = 'আজকের জন্য কোন ট্রেডিং সিগন্যাল আছে?';
        await this.sendMessage();
    }

    async askAboutRisk() {
        this.inputField.value = 'ট্রেডিং এ রিস্ক কিভাবে ম্যানেজ করব?';
        await this.sendMessage();
    }

    async askAboutPerformance() {
        this.inputField.value = 'AI ট্রেডিং এর পারফরম্যান্স কেমন?';
        await this.sendMessage();
    }

    // Export conversation
    exportConversation() {
        const conversationText = this.conversationHistory
            .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join('\n\n');
        
        const blob = new Blob([conversationText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('কথোপকথন এক্সপোর্ট করা হয়েছে', 'success');
    }

    // Search in conversation
    searchInConversation(query) {
        const results = this.conversationHistory.filter(msg => 
            msg.content.toLowerCase().includes(query.toLowerCase())
        );
        
        return results;
    }

    // Analytics for conversation
    getConversationStats() {
        const userMessages = this.conversationHistory.filter(msg => msg.role === 'user').length;
        const aiMessages = this.conversationHistory.filter(msg => msg.role === 'assistant').length;
        const totalMessages = this.conversationHistory.length;
        
        return {
            userMessages,
            aiMessages,
            totalMessages,
            averageUserMessageLength: this.getAverageMessageLength('user'),
            averageAIMessageLength: this.getAverageMessageLength('assistant')
        };
    }

    getAverageMessageLength(role) {
        const messages = this.conversationHistory.filter(msg => msg.role === role);
        if (messages.length === 0) return 0;
        
        const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
        return Math.round(totalLength / messages.length);
    }
}

// Initialize AI chat when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aiChat = new AIChatAssistant();
});

// CSS for chat interface (would typically be in a separate CSS file)
const chatStyles = `
.ai-chat-messages {
    max-height: 500px;
    overflow-y: auto;
    padding: 1rem;
}

.ai-chat-message {
    display: flex;
    margin-bottom: 1rem;
    animation: fadeIn 0.3s ease;
}

.ai-chat-message-user {
    justify-content: flex-end;
}

.ai-chat-message-assistant {
    justify-content: flex-start;
}

.ai-chat-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0.5rem;
    flex-shrink: 0;
}

.user-avatar {
    background: #0ea5e9;
    color: white;
}

.assistant-avatar {
    background: #22c55e;
    color: white;
}

.ai-chat-message-content {
    max-width: 70%;
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    position: relative;
}

.user-message {
    background: #0ea5e9;
    color: white;
    border-bottom-right-radius: 0.25rem;
}

.assistant-message {
    background: #374151;
    color: white;
    border-bottom-left-radius: 0.25rem;
}

.message-text {
    line-height: 1.5;
}

.message-time {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-top: 0.25rem;
}

.message-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.message-actions button {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
    padding: 0.25rem;
}

.message-actions button:hover {
    opacity: 1;
}

.typing-indicator .ai-chat-message-content {
    background: #374151;
}

.typing-dots {
    display: flex;
    gap: 0.25rem;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #94a3b8;
    animation: typingBounce 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typingBounce {
    0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
    }
    40% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.trading-term {
    color: #0ea5e9;
    font-weight: 600;
}

.signal-buy {
    color: #22c55e;
    font-weight: 600;
}

.signal-sell {
    color: #ef4444;
    font-weight: 600;
}

.signal-hold {
    color: #f59e0b;
    font-weight: 600;
}

.risk-term {
    color: #ef4444;
    font-weight: 600;
}

.profit-term {
    color: #22c55e;
    font-weight: 600;
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = chatStyles;
document.head.appendChild(styleSheet);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIChatAssistant;
              }
