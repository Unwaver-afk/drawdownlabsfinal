import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, ReferenceLine, Legend 
} from 'recharts';
import { ShieldCheck, Activity, PlayCircle, Calendar, AlertTriangle } from 'lucide-react';

const HedgingDemo = () => {
  const [ticker, setTicker] = useState('SPY');
  const [strike, setStrike] = useState('');
  const [expiry, setExpiry] = useState('');
  const [availableExpiries, setAvailableExpiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simData, setSimData] = useState(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`/api/stock/${ticker}`);
        const data = await res.json();
        if (data.current_price) {
          // Default strike: 5% below current price (OTM Put)
          if (!strike) setStrike(Math.floor(data.current_price * 0.95));
          if (data.expirations?.length > 0) {
            setAvailableExpiries(data.expirations);
            if (!expiry) setExpiry(data.expirations[0]);
          }
        }
      } catch (e) {}
    };
    if (ticker.length >= 2) init();
  }, [ticker]);

  // Run Hedging Sim
  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hedging-calc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticker, 
          strike: parseFloat(strike), 
          expiry, 
          option_type: 'put', // We are buying a Put
          shares: 100         // Assume standard lot
        })
      });
      const data = await res.json();
      setSimData(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col xl:flex-row justify-between items-end gap-6 shadow-2xl">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <ShieldCheck className="text-emerald-400" size={32} /> Hedging Simulator
          </h1>
          <p className="text-slate-400">
            See how buying a <strong>Put Option</strong> protects your portfolio from a crash.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-700 w-full xl:w-auto">
          <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white font-bold w-24 outline-none" placeholder="TICKER" />
          <input type="number" value={strike} onChange={e => setStrike(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white font-bold w-24 outline-none" placeholder="STRIKE" />
          <select value={expiry} onChange={e => setExpiry(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white font-bold w-32 outline-none cursor-pointer">
            {availableExpiries.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={runSimulation} className="bg-emerald-600 hover:bg-emerald-500 text-white h-[42px] px-6 rounded-lg font-bold ml-2 flex items-center gap-2 transition-all">
            {loading ? <Activity className="animate-spin" /> : <PlayCircle />} Simulate
          </button>
        </div>
      </div>

      {/* CHART */}
      {simData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simData.simulation} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="stock_price" reversed={true} label={{ value: 'Stock Price (Falling →)', position: 'insideBottom', offset: -5, fill: '#64748b' }} />
                <YAxis label={{ value: 'Portfolio P&L ($)', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}} />
                <Legend verticalAlign="top" height={36}/>
                <ReferenceLine y={0} stroke="white" strokeDasharray="3 3" />
                
                {/* RED LINE: UNHEDGED */}
                <Line name="Unhedged (Loss)" type="monotone" dataKey="unhedged_pl" stroke="#ef4444" strokeWidth={3} dot={false} />
                
                {/* GREEN LINE: HEDGED */}
                <Line name="Hedged (Protected)" type="monotone" dataKey="hedged_pl" stroke="#10b981" strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* STATS PANEL */}
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <h3 className="text-slate-400 text-sm font-bold uppercase mb-4">Protection Analysis</h3>
              
              <div className="mb-4">
                <div className="text-slate-500 text-xs">Cost of Insurance (Put Option)</div>
                <div className="text-xl font-mono text-red-400">-${simData.protection_cost}</div>
              </div>
              
              <div className="mb-4">
                <div className="text-slate-500 text-xs">Entry Price</div>
                <div className="text-xl font-mono text-white">${simData.entry_price}</div>
              </div>

              <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                <div className="flex gap-2 text-emerald-400 text-sm font-bold items-center">
                   <ShieldCheck size={16} /> Protection Active
                </div>
                <p className="text-xs text-emerald-200/70 mt-1">
                  If the stock crashes to $0, your maximum loss is capped.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HedgingDemo;