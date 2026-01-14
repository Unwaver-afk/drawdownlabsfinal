import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, ReferenceLine 
} from 'recharts';
import { Zap, Activity, PlayCircle, AlertTriangle, Calendar } from 'lucide-react';

const VolatilitySim = () => {
  const [ticker, setTicker] = useState('TSLA');
  const [strike, setStrike] = useState('');
  const [expiry, setExpiry] = useState('');
  const [availableExpiries, setAvailableExpiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simData, setSimData] = useState(null);
  const [error, setError] = useState('');

  // 1. Initialize Default Data
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`/api/stock/${ticker}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.current_price) {
          if (!strike) setStrike(Math.floor(data.current_price));
          if (data.expirations && data.expirations.length > 0) {
            setAvailableExpiries(data.expirations);
            if (!expiry) setExpiry(data.expirations[0]);
          }
        }
      } catch (e) {
        console.error("Init failed", e);
      }
    };
    if (ticker.length >= 2) init();
  }, [ticker]);

  // 2. Run Simulation
  const runSimulation = async () => {
    setLoading(true);
    setError('');
    try {
      if (!ticker || !strike || !expiry) throw new Error("Missing Inputs");

      const res = await fetch('/api/vol-sim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker, strike: parseFloat(strike), expiry, option_type: 'call', market_price: 0
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Server Error");
      
      setSimData(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col xl:flex-row justify-between items-end gap-6 shadow-2xl">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <Zap className="text-yellow-400" size={32} /> Volatility Simulator
          </h1>
          <p className="text-slate-400">
            Visualize "IV Crush": See how option prices collapse when volatility drops.
          </p>
        </div>

        {/* INPUTS */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-700 w-full xl:w-auto">
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Ticker</label>
            <input 
              value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
              className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white font-bold w-24 focus:border-yellow-500 outline-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Strike ($)</label>
            <input 
              type="number" value={strike} onChange={e => setStrike(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white font-bold w-24 focus:border-yellow-500 outline-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 flex items-center gap-1">
              <Calendar size={10}/> Expiry
            </label>
            <select 
              value={expiry} onChange={e => setExpiry(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white font-bold w-32 focus:border-yellow-500 outline-none cursor-pointer"
            >
              {availableExpiries.map(date => <option key={date} value={date}>{date}</option>)}
            </select>
          </div>
          <button 
            onClick={runSimulation}
            className="bg-yellow-500 hover:bg-yellow-400 text-black h-[42px] px-6 rounded-lg font-bold ml-2 flex items-center gap-2 shadow-lg shadow-yellow-500/20 active:scale-95 transition-all mt-auto"
          >
            {loading ? <Activity className="animate-spin" /> : <PlayCircle />} Run
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl text-red-200 flex items-center gap-3">
          <AlertTriangle size={20} /> <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {/* CHART SECTION */}
      {simData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Option Price vs. Volatility</h2>
              <div className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">
                Underlying Price: ${simData.underlying_price}
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simData.simulation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="volatility" 
                    label={{ value: 'Implied Volatility (%)', position: 'insideBottom', offset: -5, fill: '#64748b' }} 
                  />
                  <YAxis 
                    label={{ value: 'Option Price ($)', angle: -90, position: 'insideLeft', fill: '#64748b' }} 
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}}
                    itemStyle={{color: '#facc15'}}
                    formatter={(value) => [`$${value}`, "Option Price"]}
                    labelFormatter={(label) => `Volatility: ${label}%`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="option_price" 
                    stroke="#facc15" 
                    strokeWidth={4} 
                    dot={false} 
                    activeDot={{r: 8}} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Educational Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                <AlertTriangle size={18} /> What is IV Crush?
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Notice how the price crashes as you move left on the chart? 
                <br/><br/>
                Even if the stock price stays the same, if <strong>Volatility drops</strong> (like after an Earnings Call), your option value can be wiped out.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-slate-900 border border-yellow-500/20 rounded-xl p-5">
              <h3 className="text-white font-bold mb-2">Pro Tip</h3>
              <p className="text-sm text-slate-400">
                Buying options when IV is high (right side of chart) is expensive. 
                <br/>
                Professional traders prefer to <strong>Sell Options</strong> in high IV environments.
              </p>
            </div>
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
          <Zap size={48} className="text-slate-600 mb-4" />
          <p className="text-slate-400 font-semibold">Ready to Simulate</p>
          <p className="text-slate-500 text-sm">Select options above and click "Run"</p>
        </div>
      )}
    </div>
  );
};

export default VolatilitySim;