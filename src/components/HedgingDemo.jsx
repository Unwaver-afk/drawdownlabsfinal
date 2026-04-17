import React, { useCallback, useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, TrendingDown, Play, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_BASE } from "../config"; 

const HedgingSimulator = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  
  const [inputs, setInputs] = useState({
    price: 450,
    shares: 100
  });

 const runSimulation = useCallback(async () => {
  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/hedging-calc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: "SPY",
        market_price: inputs.price,
        shares: inputs.shares
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Server Error");
    }

    const json = await res.json();
    setData(json);

  } catch (e) {
    console.error("Hedging sim failed:", e);
  } finally {
    setLoading(false);
  }
}, [inputs.price, inputs.shares]);

  useEffect(() => { runSimulation(); }, [runSimulation]);


  const handleInput = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const RiskBar = ({ score, color }) => (
    <div className="w-full h-4 bg-slate-800 rounded-full mt-2 overflow-hidden border border-slate-700">
      <div className={`h-full transition-all duration-1000 ${color === 'red' ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${score}%` }}></div>
    </div>
  );

  // Helper for data points
  const DataPoint = ({ label, value, color = "text-white" }) => (
    <div className="flex flex-col">
      <span className="text-[10px] text-slate-500 uppercase font-bold">{label}</span>
      <span className={`font-mono text-lg ${color}`}>{value}</span>
    </div>
  );
  

  return (
    <div className="p-8 space-y-8 animate-in fade-in pb-24 w-full max-w-7xl mx-auto">
      
      {/* HEADER & CONTROLS CONTAINER */}
      <div className="flex flex-col md:flex-row justify-between gap-6 items-end bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-blue-400" /> Portfolio Protection Lab
          </h2>
          <p className="text-slate-400 mt-1">Simulate insurance against market crashes.</p>
        </div>
        
        {/* BIG VISIBLE CONTROLS */}
        <div className="flex gap-4 items-end w-full md:w-auto">
          <div>
            <label className="text-xs text-slate-500 font-bold uppercase">Stock Price ($)</label>
            <input type="number" value={inputs.price} onChange={(e) => handleInput('price', e.target.value)}
              className="w-full md:w-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mt-1 outline-none font-mono focus:border-blue-500 transition-colors"/>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-bold uppercase">Shares Owned</label>
            <input type="number" value={inputs.shares} onChange={(e) => handleInput('shares', e.target.value)}
              className="w-full md:w-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mt-1 outline-none font-mono focus:border-blue-500 transition-colors"/>
          </div>
          
          {/* THE BIG BUTTON */}
          <button 
            onClick={runSimulation} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg transition-all shadow-lg flex items-center gap-2 font-bold disabled:opacity-50"
          >
            {loading ? (
              <>Calculating...</>
            ) : (
              <> <Play size={18} fill="currentColor" /> Run Simulation </>
            )}
          </button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* --- DANGER CARD --- */}
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
            <div>
                 <div className="absolute top-0 right-0 p-3 opacity-10"><ShieldAlert size={120} className="text-rose-500"/></div>
                <h3 className="text-rose-400 font-bold flex items-center gap-2 mb-4 text-lg"><ShieldAlert size={24}/> UNHEDGED PORTFOLIO</h3>
                <div className="mb-6 z-10 relative">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-xs text-slate-400 uppercase">Risk Exposure</span>
                    <span className="text-3xl font-black text-rose-500">{data.risk_analysis.unhedged.score}/100</span>
                </div>
                <RiskBar score={data.risk_analysis.unhedged.score} color="red" />
                <p className="text-xs text-rose-200 mt-3 bg-rose-500/20 p-3 rounded-lg border border-rose-500/30">{data.risk_analysis.unhedged.message}</p>
                </div>
            </div>
            <div className="text-center p-4 bg-black/20 rounded-xl z-10 relative">
              <div className="text-slate-500 text-xs uppercase tracking-widest">If Market Crashes 20%</div>
              <div className="text-4xl font-black text-rose-500 my-1">-${(data.entry_price * data.shares * 0.20).toLocaleString()}</div>
              <div className="text-xs text-rose-400 font-bold">You take the full hit.</div>
            </div>
          </div>

          {/* --- SAFE CARD (With Greeks) --- */}
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-3 opacity-10"><ShieldCheck size={120} className="text-emerald-500"/></div>
            <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-4 text-lg"><ShieldCheck size={24}/> HEDGED (Protective Puts)</h3>
            
            {/* Risk Meter */}
            <div className="mb-6 z-10 relative">
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs text-slate-400 uppercase">Risk Exposure</span>
                <span className="text-3xl font-black text-emerald-500">{data.risk_analysis.hedged.score}/100</span>
              </div>
              <RiskBar score={data.risk_analysis.hedged.score} color="green" />
            </div>

            {/* Option Details Grid */}
            <div className="bg-black/30 p-4 rounded-xl border border-slate-800 backdrop-blur-sm z-10 relative mb-4">
                <h4 className="text-xs text-emerald-400 font-bold flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                    <Activity size={14}/> INSURANCE CONTRACT DETAILS
                </h4>
                <div className="grid grid-cols-3 gap-4">
                    <DataPoint label="Contracts" value={data.option_details.contracts} />
                    <DataPoint label="Strike Price" value={`$${data.option_details.strike}`} />
                    <DataPoint label="Expiry" value={data.option_details.expiry} />
                    <DataPoint label="Delta" value={data.option_details.greeks.delta} color="text-blue-400" />
                    <DataPoint label="Theta" value={data.option_details.greeks.theta} color="text-rose-400" />
                    <DataPoint label="Cost" value={`$${data.protection_cost.toLocaleString()}`} color="text-yellow-400" />
                </div>
            </div>

            <div className="text-center p-4 bg-black/20 rounded-xl z-10 relative">
              <div className="text-slate-500 text-xs uppercase tracking-widest">If Market Crashes 20%</div>
              <div className="text-4xl font-black text-white my-1">-${data.protection_cost.toLocaleString()}</div>
              <div className="text-xs text-emerald-400 font-bold">Loss is capped at cost of insurance.</div>
            </div>
          </div>
          
        </div>
      )}

      {/* GRAPH */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
          <TrendingDown className="text-blue-400"/> Crash Simulation (Visual)
        </h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.simulation} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="stock_price" stroke="#64748b" reversed={true}
                label={{ value: 'Stock Price (Crashing)', position: 'bottom', offset: 0, fill: '#64748b' }} height={50}/>
              <YAxis stroke="#64748b" 
                label={{ value: 'Portfolio P&L ($)', angle: -90, position: 'insideLeft', fill: '#64748b' }}/>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} itemStyle={{ color: '#fff' }}/>
              <Legend verticalAlign="top" height={36}/>
              <Line type="monotone" dataKey="unhedged_pl" name="Danger (No Hedge)" stroke="#f43f5e" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="hedged_pl" name="Safe (With Puts)" stroke="#10b981" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default HedgingSimulator;
