import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  ReferenceLine, CartesianGrid 
} from 'recharts';
import { Brain, Activity, PlayCircle, AlertTriangle, Calendar } from 'lucide-react';

const GreeksVisualizer = () => {
  const [ticker, setTicker] = useState('SPY');
  const [strike, setStrike] = useState('');
  const [expiry, setExpiry] = useState('');
  const [availableExpiries, setAvailableExpiries] = useState([]); // Store valid dates
  const [loading, setLoading] = useState(false);
  const [simData, setSimData] = useState(null);
  const [error, setError] = useState('');

  // 1. On Load or Ticker Change: Get Stock Details & Expiries
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`/api/stock/${ticker}`);
        if (!res.ok) return; 
        const data = await res.json();
        
        if (data.current_price) {
          // Auto-set strike if empty
          if (!strike) setStrike(Math.floor(data.current_price));
          
          // Update Expiry List
          if (data.expirations && data.expirations.length > 0) {
            setAvailableExpiries(data.expirations);
            // Default to the first expiry if none selected
            if (!expiry) setExpiry(data.expirations[0]);
          }
        }
      } catch (e) {
        console.error("Init failed", e);
      }
    };
    // Only run if ticker is valid length to avoid spamming
    if (ticker.length >= 2) init();
  }, [ticker]); 

  // 2. The Simulation Function
  const runSimulation = async () => {
    setLoading(true);
    setError('');
    setSimData(null);

    try {
      // VALIDATION: Ensure we have all 3 needed values
      if (!ticker || !strike || !expiry) {
        throw new Error("Missing inputs. Please check Ticker, Strike, and Expiry.");
      }

      const payload = {
        ticker, 
        strike: parseFloat(strike), 
        expiry: expiry, 
        option_type: 'call', 
        market_price: 0
      };

      console.log("Sending Payload:", payload); // Debugging log

      const res = await fetch('/api/greeks-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Server Error");
      }
      
      setSimData(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* HEADER & CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col xl:flex-row justify-between items-end gap-6 shadow-2xl">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <Brain className="text-purple-500" size={32} /> Greeks Laboratory
          </h1>
          <p className="text-slate-400">
            Simulate how risk factors change as the stock price moves.
          </p>
        </div>
        
        {/* INPUTS BAR */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-700 w-full xl:w-auto">
          
          {/* Ticker Input */}
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Ticker</label>
            <input 
              value={ticker} 
              onChange={e => setTicker(e.target.value.toUpperCase())}
              className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white font-bold w-24 focus:border-purple-500 outline-none"
              placeholder="SPY"
            />
          </div>
          
          {/* Strike Input */}
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Strike ($)</label>
            <input 
              type="number"
              value={strike} 
              onChange={e => setStrike(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white font-bold w-24 focus:border-purple-500 outline-none"
              placeholder="400"
            />
          </div>

          {/* NEW: Expiry Dropdown */}
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 flex items-center gap-1">
              <Calendar size={10}/> Expiry
            </label>
            <select 
              value={expiry} 
              onChange={e => setExpiry(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white font-bold w-32 focus:border-purple-500 outline-none cursor-pointer"
            >
              {availableExpiries.length === 0 && <option value="">Loading...</option>}
              {availableExpiries.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={runSimulation}
            className="bg-purple-600 hover:bg-purple-500 text-white h-[42px] px-6 rounded-lg font-bold ml-2 flex items-center gap-2 shadow-lg shadow-purple-900/20 active:scale-95 transition-all mt-auto"
          >
            {loading ? <Activity className="animate-spin" /> : <PlayCircle />} Run
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl text-red-200 flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertTriangle size={20} /> 
          <div>
            <span className="font-bold">Simulation Failed:</span> {error}
          </div>
        </div>
      )}

      {/* GRAPHS SECTION */}
      {simData?.simulation ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* DELTA CHART */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <h3 className="text-xl font-bold text-blue-400 mb-1 flex items-center gap-2">
              Δ Delta <span className="text-xs bg-blue-900/30 px-2 py-0.5 rounded text-blue-300">Direction</span>
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simData.simulation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="price" hide />
                  <YAxis hide domain={[0, 1]} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}} 
                    itemStyle={{color: '#60a5fa'}}
                    labelFormatter={(price) => `Stock Price: $${price}`}
                  />
                  {simData.current_price && <ReferenceLine x={simData.current_price} stroke="white" strokeDasharray="3 3" />}
                  <Line type="monotone" dataKey="delta" stroke="#3b82f6" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* THETA CHART */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-red-500/30 transition-all">
            <h3 className="text-xl font-bold text-red-400 mb-1 flex items-center gap-2">
              Θ Theta <span className="text-xs bg-red-900/30 px-2 py-0.5 rounded text-red-300">Time Decay</span>
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simData.simulation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="price" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}} 
                    itemStyle={{color: '#f87171'}}
                    labelFormatter={(price) => `Stock Price: $${price}`}
                  />
                  {simData.current_price && <ReferenceLine x={simData.current_price} stroke="white" strokeDasharray="3 3" />}
                  <Line type="monotone" dataKey="theta" stroke="#f87171" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* VEGA CHART */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <h3 className="text-xl font-bold text-emerald-400 mb-1 flex items-center gap-2">
              ν Vega <span className="text-xs bg-emerald-900/30 px-2 py-0.5 rounded text-emerald-300">Volatility</span>
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simData.simulation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="price" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}} 
                    itemStyle={{color: '#34d399'}}
                    labelFormatter={(price) => `Stock Price: $${price}`}
                  />
                  {simData.current_price && <ReferenceLine x={simData.current_price} stroke="white" strokeDasharray="3 3" />}
                  <Line type="monotone" dataKey="vega" stroke="#34d399" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : (
        /* LOADING / EMPTY STATE */
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
          {!loading && !error && (
            <>
              <Brain size={48} className="text-slate-600 mb-4 animate-pulse" />
              <p className="text-slate-400 font-semibold">Ready to Simulate</p>
              <p className="text-slate-500 text-sm">Select options above and click "Run"</p>
            </>
          )}
          {loading && (
             <>
              <Activity size={48} className="text-purple-500 mb-4 animate-spin" />
              <p className="text-slate-400 font-semibold">Calculating Greeks...</p>
             </>
          )}
        </div>
      )}
    </div>
  );
};

export default GreeksVisualizer;