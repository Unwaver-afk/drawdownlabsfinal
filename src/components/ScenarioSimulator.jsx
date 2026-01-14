import React, { useState, useEffect } from 'react';
import { Timer, TrendingUp, DollarSign, Activity, PlayCircle } from 'lucide-react';

const ScenarioSimulator = () => {
  const [ticker, setTicker] = useState('SPY');
  const [strike, setStrike] = useState('');
  const [expiry, setExpiry] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  
  // Scenario Inputs
  const [targetPrice, setTargetPrice] = useState(0);
  const [targetVol, setTargetVol] = useState(40);
  const [daysAhead, setDaysAhead] = useState(7);
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Init
  useEffect(() => {
    fetch(`/api/stock/${ticker}`)
      .then(res => res.json())
      .then(data => {
        if(data.current_price) {
          setCurrentPrice(data.current_price);
          setTargetPrice(data.current_price);
          setStrike(Math.floor(data.current_price));
          if(data.expirations?.[0]) setExpiry(data.expirations[0]);
        }
      });
  }, [ticker]);

  const runSim = async () => {
    setLoading(true);
    const res = await fetch('/api/scenario', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        ticker, strike: parseFloat(strike), expiry, option_type: 'call',
        target_price: parseFloat(targetPrice), target_vol: parseFloat(targetVol), days_ahead: parseInt(daysAhead)
      })
    });
    setResult(await res.json());
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <Timer className="text-orange-400" /> Scenario Simulator
        </h1>
        
        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-slate-400 font-bold uppercase text-sm">Base Setup</h3>
            <div className="flex gap-2">
              <input value={ticker} onChange={e=>setTicker(e.target.value)} className="bg-slate-800 p-2 rounded w-full text-white font-bold" placeholder="Ticker" />
              <input value={strike} onChange={e=>setStrike(e.target.value)} className="bg-slate-800 p-2 rounded w-full text-white font-bold" placeholder="Strike" />
            </div>
            
            <h3 className="text-slate-400 font-bold uppercase text-sm mt-4">"What If" Scenario</h3>
            <div>
              <label className="text-xs text-slate-500">Target Stock Price ($)</label>
              <input type="range" min={currentPrice*0.8} max={currentPrice*1.2} value={targetPrice} onChange={e=>setTargetPrice(e.target.value)} className="w-full accent-orange-500" />
              <div className="text-right text-orange-400 font-mono">${parseFloat(targetPrice).toFixed(2)}</div>
            </div>
            <div>
              <label className="text-xs text-slate-500">Target Volatility (%)</label>
              <input type="range" min="10" max="100" value={targetVol} onChange={e=>setTargetVol(e.target.value)} className="w-full accent-blue-500" />
              <div className="text-right text-blue-400 font-mono">{targetVol}%</div>
            </div>
            <div>
              <label className="text-xs text-slate-500">Days into Future</label>
              <input type="range" min="0" max="30" value={daysAhead} onChange={e=>setDaysAhead(e.target.value)} className="w-full accent-purple-500" />
              <div className="text-right text-purple-400 font-mono">{daysAhead} Days</div>
            </div>
            
            <button onClick={runSim} className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-xl font-bold text-white flex justify-center gap-2">
              {loading ? <Activity className="animate-spin"/> : <PlayCircle />} Run Simulation
            </button>
          </div>

          {/* Results Panel */}
          <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 flex flex-col justify-center">
            {result ? (
              <div className="space-y-6 text-center">
                <div>
                  <div className="text-slate-500 text-sm">New Option Price</div>
                  <div className="text-4xl font-mono text-white">${result.future_price}</div>
                  <div className="text-xs text-slate-600">Old Price: ${result.current_price}</div>
                </div>
                
                <div className={`p-4 rounded-xl border ${result.pl >= 0 ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                  <div className="text-sm font-bold uppercase mb-1">{result.pl >= 0 ? 'Profit' : 'Loss'}</div>
                  <div className={`text-3xl font-bold ${result.pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.pl >= 0 ? '+' : ''}{result.pl} ({result.percent_change}%)
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-600 text-center">Run simulation to see results</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ScenarioSimulator;