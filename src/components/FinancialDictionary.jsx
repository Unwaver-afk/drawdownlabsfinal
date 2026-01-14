import React, { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';

const terms = [
  { t: 'Call Option', d: 'A contract giving the right to BUY a stock at a set price.' },
  { t: 'Put Option', d: 'A contract giving the right to SELL a stock at a set price.' },
  { t: 'Strike Price', d: 'The specific price at which the option can be exercised.' },
  { t: 'Implied Volatility (IV)', d: 'A forecast of how much the stock price is likely to move.' },
  { t: 'Delta', d: 'How much an option price changes for every $1 move in the stock.' },
  { t: 'Theta', d: 'How much value an option loses every day due to time decay.' },
  { t: 'Gamma', d: 'The rate of change of Delta. Indicates risk stability.' },
  { t: 'Vega', d: 'Sensitivity to changes in Volatility.' },
  { t: 'In The Money (ITM)', d: 'An option that has intrinsic value (e.g., Strike < Stock Price for Calls).' },
];

const FinancialDictionary = () => {
  const [filter, setFilter] = useState('');
  
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BookOpen className="text-indigo-400" /> Dictionary
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4"/>
          <input onChange={e=>setFilter(e.target.value.toLowerCase())} className="bg-slate-950 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-white outline-none focus:border-indigo-500" placeholder="Search terms..." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {terms.filter(i => i.t.toLowerCase().includes(filter)).map((item, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-indigo-500/50 transition-colors">
            <h3 className="text-lg font-bold text-indigo-300 mb-2">{item.t}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{item.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default FinancialDictionary;