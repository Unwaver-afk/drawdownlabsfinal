import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react';
import { API_BASE } from "../../config"; 

const ChatWidget = () => {
  const location = useLocation(); // Detects which page the user is on
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm the Drawdown AI. I can see your screen. How can I help?", sender: 'ai' }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Default suggestions based on context
  const [suggestions, setSuggestions] = useState(["What is on my screen?", "Explain this feature"]);
  
  const endRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper: Translate URL to readable Page Name
  const getPageName = () => {
    const path = location.pathname;
    if (path.includes('greeks')) return 'Greeks Visualizer';
    if (path.includes('volatility')) return 'Volatility Simulator';
    if (path.includes('hedging')) return 'Hedging Simulator';
    if (path.includes('scenario')) return 'Scenario Simulator';
    if (path.includes('risk')) return 'Risk Heatmap';
    if (path.includes('dictionary')) return 'Financial Dictionary';
    return 'Main Dashboard';
  };

  const sendMessage = async (textToSend = input) => {
    if (!textToSend.trim()) return;

    // 1. Show User Message Immediately
    setMessages(prev => [...prev, { text: textToSend, sender: 'user' }]);
    setInput("");
    setLoading(true);

    try {
      // 2. Send to Backend (Port 8000)
      const res = await fetch(`${API_BASE}/chat`,{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend,
          context: getPageName() // Send the current page name
        })
      });

      const data = await res.json();
      
      // 3. Show AI Response
      setMessages(prev => [...prev, { text: data.reply, sender: 'ai' }]);
      
      // 4. Update Suggestions if AI provided new ones
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
      
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { text: "I can't reach the server on port 8000. Is the backend running?", sender: 'ai' }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="bg-slate-900 border border-slate-700 w-80 h-[500px] rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2 font-bold text-white">
              <Bot size={20}/> 
              <div className="flex flex-col">
                <span>Drawdown AI</span>
                <span className="text-[10px] opacity-80 font-normal">Viewing: {getPageName()}</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors">
              <X size={18} className="text-white"/>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-950 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 text-sm shadow-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-xl rounded-bl-none p-3 border border-slate-700">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions Chips (Horizontal Scroll) */}
          <div className="bg-slate-900 px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-800">
            {suggestions.map((s, i) => (
              <button 
                key={i} 
                onClick={() => sendMessage(s)}
                className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs px-3 py-1.5 rounded-full border border-slate-700 transition-colors flex items-center gap-1 flex-shrink-0"
              >
                <Sparkles size={10} /> {s}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-white text-sm outline-none border border-transparent focus:border-blue-500 transition-all placeholder-slate-500"
              placeholder="Ask context aware question..."
              disabled={loading}
            />
            <button 
              onClick={() => sendMessage(input)} 
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg text-white transition-colors shadow-lg shadow-blue-900/20"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* TOGGLE BUTTON (Floating Bubble) */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="bg-blue-600 hover:bg-blue-500 text-white w-14 h-14 rounded-full shadow-2xl shadow-blue-900/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

    </div>
  );
};

export default ChatWidget;