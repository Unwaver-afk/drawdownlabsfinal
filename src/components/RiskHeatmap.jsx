import React, { useState, useEffect } from 'react';
import { Grid, Activity } from 'lucide-react';

const RiskHeatmap = () => {
  const [ticker, setTicker] = useState('SPY');
  const [strike, setStrike] = useState('');
  const [expiry, setExpiry] = useState('');
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/stock/${ticker}`).then(r=>r.json()).then(d=>{
      if(d.current_price) {
        setStrike(Math.floor(d.current_price));
        if(d.expirations?.[0]) setExpiry(d.expirations[0]);
      }
    });
  }, [ticker]);

  const loadHeatmap = async () => {
    setLoading(true);
    const res = await fetch('/api/heatmap', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ ticker, strike: parseFloat(strike), expiry, option_type: 'call' })
    });
    const data = await res.json();
    setMatrix(data.matrix);
    setLoading(false);
  };

  const getColor = (val) => {
    if(val > 50) return 'bg-emerald-500';
    if(val > 0) return 'bg-emerald-500/50';
    if(val < -50) return 'bg-red-500';
    return 'bg-red-500/50';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Grid className="text-pink-500" /> Risk Matrix (P&L)
        </h1>
        <div className="flex gap-2">
          <input value={ticker} onChange={e=>setTicker(e.target.value)} className="bg-slate-800 p-2 rounded text-white font-bold w-24 text-center" />
          <button onClick={loadHeatmap} className="bg-pink-600 hover:bg-pink-500 px-6 rounded font-bold text-white">
            {loading ? <Activity className="animate-spin"/> : 'Load'}
          </button>
        </div>
      </div>

      {matrix.length > 0 ? (
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 overflow-x-auto">
          <div className="text-center mb-4 text-slate-400 font-bold uppercase text-sm">Stock Price Change (X) vs Volatility (Y)</div>
          <div className="grid grid-cols-5 gap-2 min-w-[600px]">
            {/* Headers */}
            {['-10%', '-5%', '0%', '+5%', '+10%'].map(h => (
              <div key={h} className="text-center text-slate-500 font-mono text-sm pb-2">{h}</div>
            ))}
            
            {/* Rows */}
            {matrix.slice(0).reverse().map((row, i) => (
              <React.Fragment key={i}>
                {row.map((cell, j) => (
                  <div key={j} className={`${getColor(cell.pl)} h-20 rounded-lg flex flex-col items-center justify-center text-white font-bold shadow-lg transition-transform hover:scale-105`}>
                    <span className="text-lg">{cell.pl > 0 ? '+' : ''}{cell.pl}</span>
                    <span className="text-[10px] opacity-70">Vol: {cell.vol}%</span>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
          Load heatmap to view P&L Matrix
        </div>
      )}
    </div>
  );
};
export default RiskHeatmap;