import React, { useState, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Search, TrendingUp, Activity, AlertCircle, ChevronDown } from 'lucide-react';

// --- 1. Top 12 Major Companies Data ---
const POPULAR_STOCKS = [
  { ticker: 'SPY', name: 'S&P 500 ETF' },
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.' },
  { ticker: 'MSFT', name: 'Microsoft' },
  { ticker: 'GOOGL', name: 'Alphabet (Google)' },
  { ticker: 'AMZN', name: 'Amazon.com' },
  { ticker: 'TSLA', name: 'Tesla Inc.' },
  { ticker: 'META', name: 'Meta Platforms' },
  { ticker: 'NFLX', name: 'Netflix' },
  { ticker: 'AMD', name: 'Adv. Micro Devices' },
  { ticker: 'DIS', name: 'Walt Disney' },
  { ticker: 'COIN', name: 'Coinbase Global' }
];

const LivePricing = () => {
  const [ticker, setTicker] = useState('SPY');
  const [showDropdown, setShowDropdown] = useState(false); // Controls the list visibility
  const [stockData, setStockData] = useState(null);
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [chain, setChain] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const dropdownRef = useRef(null); // To detect clicks outside

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // 1. Fetch Basic Stock Data
  const fetchStock = async (overrideTicker) => {
    const symbol = overrideTicker || ticker; // Use override if provided (for clicks)
    if (!symbol) return;
    
    setLoading(true);
    setStockData(null);
    setChain(null);
    setShowDropdown(false); // Close list on search

    try {
      const res = await fetch(`/api/stock/${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStockData(data);
      if (data.expirations && data.expirations.length > 0) {
        setSelectedExpiry(data.expirations[0]);
      }
    } catch (err) {
      console.error("Error:", err);
    }
    setLoading(false);
  };

  // 2. Fetch Option Chain
  useEffect(() => {
    if (selectedExpiry && ticker && stockData) {
      fetch(`/api/chain/${ticker}/${selectedExpiry}`)
        .then(res => res.json())
        .then(data => {
           if (data && data.calls) setChain(data);
           else setChain(null);
        })
        .catch(err => console.error("Chain Error:", err));
    }
  }, [selectedExpiry]); 

  // 3. Analyze Specific Option
  const handleAnalyze = async (strike, price, type) => {
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          strike,
          expiry: selectedExpiry,
          option_type: type,
          market_price: price
        })
      });
      const result = await res.json();
      setAnalysis(result);
    } catch (err) {
      console.error("Analysis Error:", err);
    }
    setLoading(false);
  };

  // Helper: Handle clicking a suggestion
  const handleSelectStock = (item) => {
    setTicker(item.ticker);
    fetchStock(item.ticker); // Immediately fetch
  };

  return (
    <div className="p-6 space-y-6 text-slate-100 max-w-7xl mx-auto" onClick={() => setShowDropdown(false)}>
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 relative z-50">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Live Market Pricing
          </h1>
          <p className="text-slate-400 text-sm">Real-time Black-Scholes Valuation Model</p>
        </div>
        
        <div className="flex gap-2 relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            
            {/* INPUT FIELD */}
            <input 
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onFocus={() => setShowDropdown(true)} // Show list when clicked
              className="bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-10 text-white w-48 focus:border-blue-500 outline-none placeholder:text-slate-700 font-mono tracking-wider"
              placeholder="TICKER"
            />
            
            {/* Arrow Icon indicating dropdown */}
            <ChevronDown 
              size={14} 
              className={`absolute right-3 top-3.5 text-slate-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
            />

            {/* DROPDOWN LIST */}
            {showDropdown && (
              <div className="absolute top-full mt-2 left-0 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar z-50">
                <div className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-950/50 uppercase tracking-wider sticky top-0">
                  Popular Assets
                </div>
                {POPULAR_STOCKS.map((item) => (
                  <button
                    key={item.ticker}
                    onClick={() => handleSelectStock(item)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-600/20 hover:text-blue-400 transition-colors flex justify-between items-center group border-b border-slate-800/50 last:border-0"
                  >
                    <span className="font-bold font-mono">{item.ticker}</span>
                    <span className="text-xs text-slate-500 group-hover:text-blue-300">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => fetchStock(null)}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            {loading ? <Activity className="animate-spin" size={16} /> : 'Load Data'}
          </button>
        </div>
      </div>

      {stockData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          
          {/* LEFT: Stock Chart */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-4xl font-bold text-white">${stockData.current_price}</h2>
                <span className="text-emerald-400 font-mono text-sm">LIVE MARKET DATA</span>
              </div>
              <select 
                className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm outline-none cursor-pointer hover:border-blue-500 transition-colors"
                onChange={(e) => setSelectedExpiry(e.target.value)}
                value={selectedExpiry}
              >
                {stockData.expirations?.map(date => <option key={date} value={date}>{date}</option>)}
              </select>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockData.chart_data || []}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                    itemStyle={{ color: '#94a3b8' }}
                  />
                  <XAxis dataKey="date" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Area type="monotone" dataKey="price" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT: Option Chain Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-[400px] overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-400"/> Option Chain
            </h3>
            
            <div className="flex-1 overflow-auto custom-scrollbar space-y-2 pr-2">
              {chain?.calls?.length > 0 ? (
                chain.calls.map((opt, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleAnalyze(opt.strike, opt.lastPrice, 'call')}
                    className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-800 cursor-pointer border border-transparent hover:border-blue-500/30 transition-all group"
                  >
                    <div>
                      <div className="font-bold text-blue-400">{opt.strike} CALL</div>
                      <div className="text-xs text-slate-500">Vol: {opt.volume}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-white">${opt.lastPrice}</div>
                      <div className="text-xs text-slate-500 group-hover:text-blue-400">Analyze →</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-center mt-10 flex flex-col items-center">
                  <AlertCircle size={32} className="mb-2 opacity-50"/>
                  {selectedExpiry ? "Loading Chain..." : "Select Expiry"}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-500 py-20">
          Select a popular asset from the search bar or type a custom ticker.
        </div>
      )}

      {/* BOTTOM: Analysis Result Card */}
      {analysis && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-2xl p-8 shadow-2xl relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 p-32 bg-blue-600/10 blur-3xl rounded-full pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="space-y-4">
              <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Valuation Verdict</h3>
              <div className={`text-3xl font-black ${analysis.verdict.includes('CHEAP') ? 'text-emerald-400' : analysis.verdict.includes('EXPENSIVE') ? 'text-red-400' : 'text-yellow-400'}`}>
                {analysis.verdict}
              </div>
              <p className="text-slate-400 leading-relaxed">
                The market price is <span className="text-white font-bold">{Math.abs(analysis.percent_mispricing)}%</span> {analysis.percent_mispricing > 0 ? 'higher' : 'lower'} than the theoretical Black-Scholes value.
              </p>
            </div>
            {/* ... Same Analysis Grid as before ... */}
            {/* Just ensuring the closing tags are correct */}
             <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-800">
              <div className="flex justify-between mb-4">
                <span className="text-slate-500">Market Price</span>
                <span className="font-mono text-xl">${analysis.market_price}</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-4 mb-4">
                <span className="text-blue-400">Model Price (Fair)</span>
                <span className="font-mono text-xl text-blue-400">${analysis.model_price}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Implied Volatility</span>
                <span className="bg-slate-800 text-xs px-2 py-1 rounded text-slate-300">{analysis.volatility_used}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Delta</div>
                <div className="text-lg font-mono text-white">{analysis.greeks.delta}</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Theta</div>
                <div className="text-lg font-mono text-red-400">{analysis.greeks.theta}</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Vega</div>
                <div className="text-lg font-mono text-emerald-400">{analysis.greeks.vega}</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Rho</div>
                <div className="text-lg font-mono text-white">{analysis.greeks.rho}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePricing;