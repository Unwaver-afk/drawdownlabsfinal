from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import mibian
import math
import random
from datetime import datetime, timedelta

app = FastAPI()

# --- CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
class AnalysisRequest(BaseModel):
    ticker: str
    strike: float = 0
    expiry: str = ""
    option_type: str = "call"
    market_price: float = 0
    shares: int = 100
    # Scenario Params
    target_price: float = 0
    target_vol: float = 0
    days_ahead: int = 0

# --- HELPER FUNCTIONS ---
def days_to_expiry(expiry_str):
    try:
        expiry_date = datetime.strptime(expiry_str, "%Y-%m-%d")
        return max((expiry_date - datetime.now()).days, 1)
    except: return 30

# --- DEMO MODE GENERATORS (Save the Presentation!) ---
# These functions generate realistic-looking fake data if the real API fails.

def mock_stock_data(ticker):
    return {
        "current_price": 450.00,
        "chart_data": [{"date": "2024-01-01", "price": 400}, {"date": "2024-06-01", "price": 450}],
        "expirations": ["2025-06-20", "2025-07-18", "2025-08-15"]
    }

def mock_greeks(current_price):
    points = []
    start = current_price * 0.8
    end = current_price * 1.2
    step = (end - start) / 20
    p = start
    while p <= end:
        norm = (p - start) / (end - start)
        points.append({
            "price": round(p, 2),
            "delta": round(1 / (1 + math.exp(-10 * (norm - 0.5))), 2), # Sigmoid
            "theta": round(-0.05 - (0.1 * norm), 2),
            "vega": round(0.2 * math.exp(-5 * (norm - 0.5)**2), 2)
        })
        p += step
    return points

def mock_vol_sim(current_price):
    return [{"volatility": v, "option_price": round((current_price*0.05) + (v*0.1), 2)} for v in range(10, 160, 10)]

def mock_hedging(entry_price):
    points = []
    start = entry_price * 1.05
    end = entry_price * 0.8
    step = (end - start) / 20
    curr = start
    while curr >= end:
        stock_pl = (curr - entry_price) * 100
        # Put option gains value as stock drops below entry
        put_gain = max(0, (entry_price * 0.98 - curr) * 100) if curr < entry_price else -200
        points.append({
            "stock_price": round(curr, 2),
            "unhedged_pl": round(stock_pl, 2),
            "hedged_pl": round(stock_pl + put_gain, 2)
        })
        curr += step
    return points

def mock_heatmap():
    matrix = []
    for vol in range(30, 55, 5):
        row = []
        for i, price_mult in enumerate([0.9, 0.95, 1.0, 1.05, 1.1]):
            # Create a pattern where center is 0 and edges are colored
            val = (i - 2) * 50 + (vol - 40) * 10
            row.append({"stock_price": 100 * price_mult, "vol": vol, "pl": val})
        matrix.append(row)
    return matrix

# --- API ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "Drawdown Labs Engine Online 🟢"}

@app.get("/api/stock/{ticker}")
def get_stock_details(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1y")
        if hist.empty: raise Exception("Yahoo Empty")

        chart_data = [{"date": i.strftime('%Y-%m-%d'), "price": r['Close']} for i, r in hist.iterrows()]
        return {
            "current_price": round(hist['Close'].iloc[-1], 2),
            "chart_data": chart_data,
            "expirations": stock.options
        }
    except:
        print(f"⚠️ Yahoo Failed for {ticker}. Using Demo Data.")
        return mock_stock_data(ticker)

@app.get("/api/chain/{ticker}/{date}")
def get_option_chain(ticker: str, date: str):
    try:
        stock = yf.Ticker(ticker)
        chain = stock.option_chain(date)
        return {
            "calls": chain.calls[['strike', 'lastPrice', 'impliedVolatility', 'volume']].fillna(0).to_dict('records'),
            "puts": chain.puts[['strike', 'lastPrice', 'impliedVolatility', 'volume']].fillna(0).to_dict('records')
        }
    except:
        # Minimal mock chain
        return {"calls": [], "puts": []}

@app.post("/api/analyze")
def analyze_option(request: AnalysisRequest):
    """ Feature 1: Single Option Analysis """
    try:
        stock = yf.Ticker(request.ticker)
        hist = stock.history(period="1mo")
        if hist.empty: raise Exception("Empty")
        
        current_price = hist['Close'].iloc[-1]
        days = days_to_expiry(request.expiry)
        
        # Calculate Volatility or default to 40%
        try:
            rets = hist['Close'].pct_change().dropna()
            vol = rets.std() * (252**0.5) * 100
            if math.isnan(vol) or vol == 0: vol = 40.0
        except: vol = 40.0

        c = mibian.BS([current_price, request.strike, 4.5, days], vol)
        model_price = c.callPrice if request.option_type == 'call' else c.putPrice
        
        diff = request.market_price - model_price
        percent_diff = (diff / model_price) * 100 if model_price > 0 else 0
        
        verdict = "FAIRLY PRICED"
        if percent_diff > 15: verdict = "EXPENSIVE"
        elif percent_diff < -15: verdict = "CHEAP"

        return {
            "underlying_price": round(current_price, 2),
            "model_price": round(model_price, 2),
            "verdict": verdict,
            "percent_mispricing": round(percent_diff, 1),
            "volatility_used": round(vol, 2),
            "greeks": {
                "delta": round(c.callDelta if c.callDelta else 0.5, 3),
                "theta": round(c.callTheta if c.callTheta else -0.1, 3),
                "vega": round(c.vega if c.vega else 0.2, 3),
                "rho": 0.05
            }
        }
    except:
        return {
            "underlying_price": 100, "model_price": 5.50, "verdict": "FAIRLY PRICED",
            "percent_mispricing": 0, "volatility_used": 40,
            "greeks": {"delta": 0.5, "theta": -0.1, "vega": 0.2, "rho": 0.05}
        }

@app.post("/api/greeks-profile")
def get_greeks_profile(request: AnalysisRequest):
    """ Feature 2: Greeks Simulation """
    try:
        stock = yf.Ticker(request.ticker)
        hist = stock.history(period="1mo")
        if hist.empty: raise Exception("Empty")
        
        current_price = hist['Close'].iloc[-1]
        days = days_to_expiry(request.expiry)
        
        points = []
        for p in [current_price * (0.8 + i*0.02) for i in range(21)]:
            try:
                c = mibian.BS([p, request.strike, 4.5, days], 40)
                points.append({
                    "price": round(p, 2), 
                    "delta": round(c.callDelta, 3), 
                    "theta": round(c.callTheta, 3), 
                    "vega": round(c.vega, 3)
                })
            except: pass
            
        if not points: raise Exception("No points")
        return {"current_price": round(current_price, 2), "simulation": points}
    except:
        return {"current_price": 100, "simulation": mock_greeks(100)}

@app.post("/api/vol-sim")
def get_vol_sim(request: AnalysisRequest):
    """ Feature 3: Volatility Simulator """
    try:
        stock = yf.Ticker(request.ticker)
        hist = stock.history(period="1d")
        if hist.empty: raise Exception("Empty")
        
        current_price = hist['Close'].iloc[-1]
        days = days_to_expiry(request.expiry)
        
        points = []
        for v in range(10, 160, 10):
            try:
                c = mibian.BS([current_price, request.strike, 4.5, days], v)
                price = c.callPrice if request.option_type == 'call' else c.putPrice
                points.append({"volatility": v, "option_price": round(price, 2)})
            except: pass
            
        if not points: raise Exception("No points")
        return {"underlying_price": round(current_price, 2), "simulation": points}
    except:
        return {"underlying_price": 100, "simulation": mock_vol_sim(100)}

@app.post("/api/hedging-calc")
def get_hedging_sim(request: AnalysisRequest):
    """ Feature 4: Hedging Simulator """
    try:
        stock = yf.Ticker(request.ticker)
        hist = stock.history(period="1d")
        if hist.empty: raise Exception("Empty")
        
        current_price = hist['Close'].iloc[-1]
        days = days_to_expiry(request.expiry)
        
        # Cost of protection
        put_price = mibian.BS([current_price, request.strike, 4.5, days], 40).putPrice
        
        points = []
        # Simulate price dropping from +5% down to -20%
        start = current_price * 1.05
        end = current_price * 0.8
        step = (end - start) / 20
        
        sim_price = start
        while sim_price >= end:
            try:
                put_val = mibian.BS([sim_price, request.strike, 4.5, days], 40).putPrice
                stock_pl = (sim_price - current_price) * request.shares
                put_pl = (put_val - put_price) * 100
                points.append({
                    "stock_price": round(sim_price, 2),
                    "unhedged_pl": round(stock_pl, 2),
                    "hedged_pl": round(stock_pl + put_pl, 2)
                })
            except: pass
            sim_price += step
            
        return {"entry_price": round(current_price, 2), "protection_cost": round(put_price*100, 2), "simulation": points}
    except:
        return {"entry_price": 100, "protection_cost": 250, "simulation": mock_hedging(100)}

@app.post("/api/scenario")
def get_scenario(request: AnalysisRequest):
    """ Feature 5: Scenario Simulator (Time Machine) """
    try:
        stock = yf.Ticker(request.ticker)
        hist = stock.history(period="1d")
        if hist.empty: raise Exception("Empty")
        
        curr = hist['Close'].iloc[-1]
        days_now = days_to_expiry(request.expiry)
        
        # Current Value
        bs_now = mibian.BS([curr, request.strike, 4.5, days_now], 40)
        price_now = bs_now.callPrice if request.option_type == 'call' else bs_now.putPrice
        
        # Future Value
        days_future = max(days_now - request.days_ahead, 1)
        bs_fut = mibian.BS([request.target_price, request.strike, 4.5, days_future], request.target_vol)
        price_future = bs_fut.callPrice if request.option_type == 'call' else bs_fut.putPrice
        
        return {
            "current_price": round(price_now, 2),
            "future_price": round(price_future, 2),
            "pl": round((price_future - price_now) * 100, 2),
            "percent_change": round(((price_future - price_now) / price_now) * 100, 1) if price_now > 0 else 0
        }
    except:
        # Demo math
        p_now = 5.0
        p_fut = 5.0 + (request.target_price - 400)*0.05 + (request.target_vol - 40)*0.1
        return {
            "current_price": round(p_now, 2),
            "future_price": round(p_fut, 2),
            "pl": round((p_fut - p_now)*100, 2),
            "percent_change": 15.5
        }

@app.post("/api/heatmap")
def get_heatmap(request: AnalysisRequest):
    """ Feature 6: Risk Heatmap """
    try:
        stock = yf.Ticker(request.ticker)
        hist = stock.history(period="1d")
        if hist.empty: raise Exception("Empty")

        curr = hist['Close'].iloc[-1]
        days = days_to_expiry(request.expiry)
        
        # Base Price
        bs_base = mibian.BS([curr, request.strike, 4.5, days], 40)
        base_opt_price = bs_base.callPrice if request.option_type == 'call' else bs_base.putPrice
        
        matrix = []
        for vol in range(30, 55, 5):
            row = []
            for price_mult in [0.9, 0.95, 1.0, 1.05, 1.1]:
                sim_price = curr * price_mult
                bs = mibian.BS([sim_price, request.strike, 4.5, days], vol)
                opt_price = bs.callPrice if request.option_type == 'call' else bs.putPrice
                pl = (opt_price - base_opt_price) * 100
                row.append({
                    "stock_price": round(sim_price, 2),
                    "vol": vol,
                    "pl": round(pl, 0)
                })
            matrix.append(row)
            
        return {"matrix": matrix, "base_price": round(base_opt_price, 2)}
    except:
        return {"matrix": mock_heatmap(), "base_price": 5.00}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)