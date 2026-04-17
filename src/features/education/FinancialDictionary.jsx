import React, { useState } from 'react';
import { BookOpen, Search, Tag, ChevronRight, Book, Lightbulb, TrendingUp } from 'lucide-react';

const FinancialDictionary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // --- THE KNOWLEDGE BASE ---
  const terms = [
    // --- BASICS ---
    {
      term: "Stock (Equity)",
      category: "Basics",
      definition: "A security that represents the ownership of a fraction of a corporation.",
      theory: "When you buy a stock, you are buying a piece of the company. Your profit comes from price appreciation (Buy Low, Sell High) or dividends (profit sharing).",
      example: "Buying 1 share of Apple (AAPL) means you are a partial owner of Apple Inc."
    },
    {
      term: "Market Capitalization",
      category: "Basics",
      definition: "The total value of a company's shares of stock.",
      theory: "Calculated by multiplying the stock price by the total number of outstanding shares. It tells you how big a company is (Small Cap vs. Large Cap).",
      example: "If a company has 1 million shares selling for $50 each, its Market Cap is $50 million."
    },
    {
      term: "Volatility",
      category: "Basics",
      definition: "A statistical measure of the dispersion of returns for a given security or market index.",
      theory: "High volatility means the price swings wildly (high risk, high reward). Low volatility means the price is stable. Traders love volatility; investors fear it.",
      example: "Crypto is high volatility. Government bonds are low volatility."
    },
    {
      term: "Liquidity",
      category: "Basics",
      definition: "How easily an asset can be bought or sold without affecting its price.",
      theory: "High liquidity means you can sell instantly. Low liquidity means you might be stuck with the asset because no one wants to buy it.",
      example: "SPY ETF is highly liquid. A penny stock with low volume is illiquid."
    },

    // --- OPTIONS TRADING ---
    {
      term: "Call Option",
      category: "Options",
      definition: "A contract giving the buyer the right, but not the obligation, to BUY a stock at a specific price.",
      theory: "You buy a Call if you think the stock will go UP. It offers leverage—you control 100 shares for a fraction of the cost.",
      example: "Buying a $150 Call on AAPL when it trades at $145. You profit if AAPL goes above $150 + premium."
    },
    {
      term: "Put Option",
      category: "Options",
      definition: "A contract giving the buyer the right to SELL a stock at a specific price.",
      theory: "You buy a Put if you think the stock will go DOWN, or to protect (hedge) shares you already own.",
      example: "Buying a Put on TSLA acts as insurance. If TSLA crashes, your Put increases in value to offset the loss."
    },
    {
      term: "Strike Price",
      category: "Options",
      definition: "The set price at which an option contract can be exercised.",
      theory: "This is your 'target'. For a Call, you want the stock to go ABOVE the strike. For a Put, you want it BELOW.",
      example: "If you have a Call with a Strike of $100, the option only has intrinsic value if the stock is at $101+."
    },
    {
      term: "Premium",
      category: "Options",
      definition: "The current market price of an option contract.",
      theory: "This is what you pay to buy the option. It is determined by Intrinsic Value + Time Value (Theta) + Volatility (Vega).",
      example: "If an option is quoted at $2.50, one contract costs $250 (since it covers 100 shares)."
    },
    {
      term: "Expiration Date",
      category: "Options",
      definition: "The date on which an option contract becomes void.",
      theory: "Options are 'wasting assets'. They lose value every day as they get closer to this date (Time Decay).",
      example: "A '0DTE' option expires today. A 'LEAPS' option might expire in 2 years."
    },

    // --- THE GREEKS ---
    {
      term: "Delta",
      category: "Greeks",
      definition: "Measures how much an option's price changes for every $1 change in the stock price.",
      theory: "Delta is also your probability of profit. A Delta of 0.50 means a 50% chance of expiring in the money.",
      example: "If Delta is 0.60, and the stock goes up $1, your option gains $0.60."
    },
    {
      term: "Theta",
      category: "Greeks",
      definition: "Measures the rate of time decay of an option.",
      theory: "Theta is the enemy of option buyers. It represents how much value the option loses every single day just by existing.",
      example: "If Theta is -0.10, your option loses $10 of value every day, even if the stock price doesn't move."
    },
    {
      term: "Gamma",
      category: "Greeks",
      definition: "Measures the rate of change of Delta.",
      theory: "Gamma is the 'acceleration' of your profits. High Gamma means your Delta changes rapidly, which is risky but explosive.",
      example: "Gamma is highest for At-The-Money options near expiration (Gamma Risk)."
    },
    {
      term: "Vega",
      category: "Greeks",
      definition: "Measures sensitivity to Volatility (IV).",
      theory: "If Vega is high, the option price will skyrocket if the market gets scared (Implied Volatility goes up).",
      example: "Buying options before earnings is expensive because Vega (Volatility expectation) is high."
    },

    // --- RISK & STRATEGY ---
    {
      term: "Hedging",
      category: "Risk",
      definition: "A strategy used to offset the risk of any adverse price movements.",
      theory: "Think of it as insurance. You pay a small cost to prevent a catastrophic loss.",
      example: "Owning 100 shares of SPY and buying 1 Put Option is a 'Protective Put' hedge."
    },
    {
      term: "Drawdown",
      category: "Risk",
      definition: "The peak-to-trough decline during a specific period.",
      theory: "This measures the 'pain' of an investment. A 50% drawdown requires a 100% gain just to break even.",
      example: "If your account goes from $10,000 to $6,000, you have a 40% drawdown."
    },
    {
      term: "Stop Loss",
      category: "Risk",
      definition: "An order to sell a security when it reaches a certain price.",
      theory: "It automates discipline. It prevents one bad trade from wiping out your account.",
      example: "Buying at $100 and setting a stop loss at $90 limits your risk to $10 per share."
    }
  ];

  // --- FILTER LOGIC ---
  const categories = ['All', 'Basics', 'Options', 'Greeks', 'Risk'];
  
  const filteredTerms = terms.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.definition.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in pb-24 w-full max-w-7xl mx-auto">
      
      {/* 1. HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-blue-400" /> Financial Encyclopedia
          </h2>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Master the language of the markets. Understand the "Theory" behind the "Term".
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search for 'Delta', 'Stock', 'Hedge'..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* 2. CATEGORY TABS */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-800">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              px-4 py-2 rounded-full text-xs font-bold transition-all border
              ${activeCategory === cat 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. DICTIONARY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((item, index) => (
            <div 
              key={index} 
              className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300 flex flex-col"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  {item.term}
                </h3>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                  {item.category}
                </span>
              </div>

              {/* Definition */}
              <div className="mb-4">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {item.definition}
                </p>
              </div>

              {/* Theory / Why it matters */}
              <div className="mt-auto pt-4 border-t border-slate-800/50 space-y-3">
                <div className="flex gap-2">
                  <TrendingUp size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block mb-1">THEORY & CONTEXT</span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.theory}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <Lightbulb size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-yellow-400 block mb-1">EXAMPLE</span>
                    <p className="text-xs text-slate-500 italic">
                      "{item.example}"
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ))
        ) : (
          // Empty State
          <div className="col-span-full py-20 text-center">
            <Book size={48} className="mx-auto text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-500">No terms found</h3>
            <p className="text-slate-600">Try adjusting your search query.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default FinancialDictionary;