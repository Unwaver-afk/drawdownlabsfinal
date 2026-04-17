import React, { useCallback, useState, useEffect } from 'react';
import { Grid, Calendar, TrendingUp, Info, X, MousePointer, ArrowRight } from 'lucide-react';
import { API_BASE } from "../config"; 

const RiskHeatmap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Default Inputs
  const [inputs, setInputs] = useState({
    price: 450,
    strike: 455,
    days: 30,
    volatility: 20
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/heatmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticker: "SPY", 
          market_price: inputs.price, 
          strike: inputs.strike, 
          option_type: "call", 
          days_ahead: inputs.days 
        })
      });
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [inputs]);

  // Debounce: Auto-run simulation when user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500); 
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleInput = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const adjust = (field, amount) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat((prev[field] + amount).toFixed(2)) }));
  };

  // Helper: Color scaling for the heatmap
  const getCellColor = (value) => {
    if (value === 0) return 'bg-slate-800 border-slate-700';
    if (value > 0) {
      if (value < 50) return 'bg-emerald-900/40 text-emerald-400 border-emerald-900/50';
      if (value < 150) return 'bg-emerald-600/80 text-white border-emerald-500';
      return 'bg-emerald-400 text-black font-bold border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]'; // Jackpot
    } else {
      if (value > -50) return 'bg-rose-900/40 text-rose-400 border-rose-900/50';
      if (value > -150) return 'bg-rose-600/80 text-white border-rose-500';
      return 'bg-rose-500 text-white font-bold border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'; // Max Loss
    }
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in pb-24 w-full max-w-7xl mx-auto">
      
      {/* 1. HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center gap-3">
            <Grid className="text-blue-500" /> Risk Heatmap
          </h2>
          <p className="text-slate-400 mt-1">Visualize the future: See how Time (Y-Axis) and Price (X-Axis) affect your P&L.</p>
        </div>
        <div className="bg-slate-800 px-4 py-1.5 rounded-full text-xs text-slate-400 border border-slate-700 flex items-center gap-2">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Live Calculation
        </div>
      </div>

      {/* 2. INTRO CARD (Dismissible) */}
      {showIntro && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-blue-500/30 rounded-2xl p-6 relative shadow-xl">
          <button onClick={() => setShowIntro(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="flex gap-4">
            <div className="bg-blue-500/20 p-3 rounded-xl h-fit">
              <MousePointer className="text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">How to read this map?</h3>
              <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
                This grid shows every possible future for your trade.
                <br/>
                <span className="text-emerald-400 font-bold">Horizontal (X):</span> What happens if the stock price moves up or down?
                <br/>
                <span className="text-rose-400 font-bold">Vertical (Y):</span> What happens as days pass and expiration gets closer?
                <br/>
                <span className="italic opacity-70 mt-2 block">💡 Pro Tip: Look for the "Green Zone". If it shrinks as you go down (Time Passing), that is Theta Decay eating your profits!</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. CONTROL BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Price Control */}
          <div>
            <label className="text-xs text-slate-500 uppercase font-bold">Current Stock Price</label>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => adjust('price', -5)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors">-</button>
              <input 
                type="number" 
                value={inputs.price} 
                onChange={e => handleInput('price', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-center font-mono outline-none focus:border-blue-500"
              />
              <button onClick={() => adjust('price', 5)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors">+</button>
            </div>
          </div>

          {/* Strike Control */}
          <div>
            <label className="text-xs text-slate-500 uppercase font-bold">Target Strike Price</label>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => adjust('strike', -5)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors">-</button>
              <input 
                type="number" 
                value={inputs.strike} 
                onChange={e => handleInput('strike', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-center font-mono outline-none focus:border-blue-500"
              />
              <button onClick={() => adjust('strike', 5)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors">+</button>
            </div>
          </div>

          {/* Time Control */}
          <div>
             <label className="text-xs text-slate-500 uppercase font-bold flex justify-between">
                <span>Time Horizon</span>
                <span className="text-blue-400">{inputs.days} Days</span>
             </label>
             <input 
                type="range" 
                min="5" max="90" 
                value={inputs.days} 
                onChange={e => handleInput('days', e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-4"
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>Short Term</span>
                <span>Long Term</span>
              </div>
          </div>

        </div>
      </div>

      {/* 4. THE HEATMAP GRID */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-slate-500 animate-pulse">Running Monte Carlo Simulation...</span>
        </div>
      ) : data ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl overflow-hidden relative">
          
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[800px]">
              
              {/* X-AXIS LABELS */}
              <div className="flex mb-3 ml-24">
                {data.x_labels.map((label, i) => (
                  <div key={i} className="flex-1 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {label}
                  </div>
                ))}
              </div>

              {/* ROWS */}
              {data.matrix.map((row, i) => (
                <div key={i} className="flex items-center mb-2 group">
                  
                  {/* Y-AXIS LABEL (Date) */}
                  <div className="w-24 text-xs font-mono text-slate-400 flex items-center gap-2 border-r border-slate-800 pr-4 mr-2 group-hover:text-white transition-colors">
                    <Calendar size={12}/> 
                    {row.days_left === 0 ? <span className="text-rose-400 font-bold">EXPIRY</span> : `${row.days_left} Days`}
                  </div>

                  {/* CELL VALUES */}
                  <div className="flex-1 flex gap-1.5">
                    {row.values.map((cell, j) => (
                      <div 
                        key={j}
                        className={`flex-1 h-14 rounded-md flex flex-col items-center justify-center text-xs transition-all hover:scale-110 hover:z-10 cursor-help border ${getCellColor(cell.pl)}`}
                        title={`If Price hits $${cell.price} in ${row.days_left} days... P/L: $${cell.pl}`}
                      >
                        <span className="opacity-90 font-mono text-[11px]">${cell.pl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* X-AXIS TITLE */}
              <div className="text-center mt-6 text-slate-500 text-xs uppercase tracking-[0.2em] flex justify-center items-center gap-2 font-bold">
                <TrendingUp size={14}/> Stock Price Percentage Move
              </div>

            </div>
          </div>
          
          {/* LEGEND overlay */}
          <div className="flex gap-6 justify-center mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-3 h-3 bg-emerald-400 rounded-sm shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span> Big Profit
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-3 h-3 bg-emerald-900/50 border border-emerald-900 rounded-sm"></span> Profit
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-3 h-3 bg-slate-800 border border-slate-700 rounded-sm"></span> Break Even
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-3 h-3 bg-rose-900/50 border border-rose-900 rounded-sm"></span> Loss
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-3 h-3 bg-rose-500 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span> Danger Zone
            </div>
          </div>

        </div>
      ) : null}

    </div>
  );
};

export default RiskHeatmap;
