import React, { useCallback, useState, useEffect } from 'react';
import { Play, TrendingUp, TrendingDown, Info, X, DollarSign, AlertTriangle, Lightbulb } from 'lucide-react';
import { API_BASE } from "../../config"; 

const ScenarioLab = () => {
  // --- STATE ---
  const [showIntro, setShowIntro] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [inputs, setInputs] = useState({
    ticker: 'SPY',
    currentPrice: 450,
    strike: 455,
    targetPrice: 460,
    days: 15,
    optionType: 'call'
  });

  const [result, setResult] = useState(null);

  // --- TICKER LIST ---
  const popularTickers = ["SPY", "QQQ", "IWM", "NVDA", "TSLA", "AAPL", "AMD", "MSFT", "AMZN"];

  const runSimulation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: inputs.ticker,
          market_price: inputs.currentPrice,
          strike: inputs.strike,
          target_price: inputs.targetPrice,
          days_ahead: inputs.days,
          option_type: inputs.optionType
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error("Sim error", e);
    }
    setLoading(false);
  }, [inputs]);

  // --- LIVE SIMULATION ENGINE ---
  // This runs every time 'inputs' changes (Debounced for performance)
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 300); // 300ms delay to prevent flickering while typing

    return () => clearTimeout(timer);
  }, [runSimulation]);

  // --- HANDLERS ---
  const update = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const adjust = (field, amount) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat((prev[field] + amount).toFixed(2)) }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-center">
      <div className="pl-4 pt-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Simulation Playground
          </h2>
          <p className="text-slate-400 text-sm">Test "What If" scenarios instantly.</p>
          </div>
        </div>
        <div className="bg-slate-800 px-3 py-1 rounded-full text-xs text-slate-400 border border-slate-700">
          🟢 Live Calculation Active
        </div>
      </div>

      {/* 2. WELCOME BANNER (Dismissible) */}
      {showIntro && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 relative shadow-xl">
          <button 
            onClick={() => setShowIntro(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
          <div className="flex gap-4">
            <div className="bg-blue-500/20 p-3 rounded-full h-fit">
              <Play className="text-blue-400 fill-blue-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Welcome to the Lab! 🧪</h3>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                This isn't just a calculator—it's a time machine. Adjust the <span className="text-blue-400 font-bold">Target Price</span> and <span className="text-emerald-400 font-bold">Time Left</span> to see exactly how your options will react to market changes.
                <br/><br/>
                <span className="opacity-70">💡 Tip: Try moving the "Days Left" slider to see how Time Decay eats away profit!</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 3. CONTROL PANEL (Left Side) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-400"/> Scenario Controls
            </h3>

            {/* Ticker Select */}
            <div className="mb-6">
              <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider">Select Asset</label>
              <div className="grid grid-cols-3 gap-2">
                {popularTickers.map(t => (
                  <button 
                    key={t}
                    onClick={() => update('ticker', t)}
                    className={`text-sm py-2 rounded-lg border transition-all ${
                      inputs.ticker === t 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Strike Price Control */}
            <div className="mb-6">
              <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider">Strike Price (Target)</label>
              <div className="flex items-center gap-2">
                <button onClick={() => adjust('strike', -5)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-white transition-colors text-lg font-bold w-12">-</button>
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 text-center text-xl font-mono text-white">
                  ${inputs.strike}
                </div>
                <button onClick={() => adjust('strike', 5)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-white transition-colors text-lg font-bold w-12">+</button>
              </div>
            </div>

            {/* Target Price Control */}
            <div className="mb-6">
              <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider">Projected Stock Price</label>
              <div className="flex items-center gap-2">
                <button onClick={() => adjust('targetPrice', -2)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-white transition-colors text-lg font-bold w-12">-</button>
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 text-center text-xl font-mono text-blue-400 font-bold">
                  ${inputs.targetPrice}
                </div>
                <button onClick={() => adjust('targetPrice', 2)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-white transition-colors text-lg font-bold w-12">+</button>
              </div>
            </div>

            {/* Days Slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Days to Expiration</label>
                <span className="text-xs text-emerald-400 font-bold">{inputs.days} Days</span>
              </div>
              <input 
                type="range" 
                min="1" max="60" 
                value={inputs.days}
                onChange={(e) => update('days', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>Tomorrow</span>
                <span>2 Months</span>
              </div>
            </div>

          </div>
        </div>

        {/* 4. RESULTS PANEL (Right Side) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Main P&L Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-lg min-h-[200px]">
            {loading ? (
              <div className="flex flex-col items-center gap-2 animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin"></div>
                <span className="text-slate-500 text-sm">Crunching numbers...</span>
              </div>
            ) : result ? (
              <>
                <h4 className="text-slate-400 text-sm uppercase tracking-widest mb-2">Projected Profit / Loss</h4>
                <div className={`text-5xl font-black mb-2 ${result.pl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {result.pl >= 0 ? '+' : ''}${result.pl}
                </div>
                <div className={`text-lg font-bold px-3 py-1 rounded-full ${
                  result.pl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {result.pl >= 0 ? '▲' : '▼'} {result.percent_change}% Return
                </div>
                <div className="mt-6 w-full h-px bg-slate-800"></div>
                <div className="flex justify-between w-full mt-4 text-sm">
                  <div className="text-center">
                    <div className="text-slate-500">Option Price Now</div>
                    <div className="text-white font-mono">${result.option_price_now}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500">Projected Price</div>
                    <div className="text-white font-mono">${result.option_price_future}</div>
                  </div>
                </div>
              </>
            ) : (
              <span className="text-slate-500">Adjust inputs to start</span>
            )}
          </div>

          {/* Analysis Cards Grid */}
          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* The "Why" Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Info size={16} className="text-blue-400"/> Why this result?
                </h4>
                <ul className="space-y-2">
                  {result.reasons.map((reason, idx) => (
                    <li key={idx} className="text-xs text-slate-300 bg-slate-800 p-2 rounded border border-slate-700">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Consultant Tips */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Lightbulb size={60} className="text-yellow-400"/>
                </div>
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Lightbulb size={16} className="text-yellow-400"/> Consultant Tips
                </h4>
                {result.tips.length > 0 ? (
                  <ul className="space-y-2 relative z-10">
                    {result.tips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex gap-2">
                        <span className="text-yellow-500">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No specific warnings for this safe scenario.</p>
                )}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default ScenarioLab;
