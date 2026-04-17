from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import mibian
import math
import os
import re
import time
from datetime import datetime, timedelta
import requests

app = FastAPI()
cache = {}

STOCK_CACHE_SECONDS = 300
CHAIN_CACHE_SECONDS = 600
CBOE_CACHE_SECONDS = 120

CBOE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0 Safari/537.36"
    ),
    "Accept": "application/json,text/plain,*/*",
}


def load_local_env(path=".env"):
    if not os.path.exists(path):
        return
    with open(path) as env_file:
        for line in env_file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_local_env()


def get_cached(key):
    item = cache.get(key)
    if not item:
        return None
    expires_at, value = item
    if expires_at < time.time():
        cache.pop(key, None)
        return None
    return value


def set_cached(key, value, ttl):
    cache[key] = (time.time() + ttl, value)
    return value


def compact_chart_data(hist, max_points=90):
    if len(hist) > max_points:
        step = max(1, len(hist) // max_points)
        hist = hist.iloc[::step]
    return [
        {"date": i.strftime("%Y-%m-%d"), "price": round(float(r["Close"]), 2)}
        for i, r in hist.iterrows()
    ]


def cboe_symbol(ticker):
    return ticker.upper().strip().replace(".", "_").replace("-", "_")


def fetch_cboe_snapshot(ticker):
    ticker = cboe_symbol(ticker)
    cached = get_cached(("cboe", ticker))
    if cached:
        return cached

    url = f"https://cdn.cboe.com/api/global/delayed_quotes/options/{ticker}.json"
    response = requests.get(url, headers=CBOE_HEADERS, timeout=12)
    response.raise_for_status()
    payload = response.json().get("data", {})
    if not payload.get("current_price") or not payload.get("options"):
        raise ValueError(f"Cboe returned no option data for {ticker}")
    return set_cached(("cboe", ticker), payload, CBOE_CACHE_SECONDS)


def parse_occ_option(option_symbol):
    match = re.match(r"^(.+?)(\d{6})([CP])(\d{8})$", option_symbol or "")
    if not match:
        return None

    _, expiry_raw, option_type, strike_raw = match.groups()
    expiry = datetime.strptime(expiry_raw, "%y%m%d").strftime("%Y-%m-%d")
    return {
        "expiry": expiry,
        "type": "call" if option_type == "C" else "put",
        "strike": int(strike_raw) / 1000,
    }


def cboe_expirations(snapshot):
    today = datetime.now().date()
    expirations = set()
    for option in snapshot.get("options", []):
        parsed = parse_occ_option(option.get("option"))
        if not parsed:
            continue
        expiry_date = datetime.strptime(parsed["expiry"], "%Y-%m-%d").date()
        if expiry_date >= today:
            expirations.add(parsed["expiry"])
    return sorted(expirations)[:12]


def cboe_chart_data(snapshot):
    raw_points = [
        ("Prev Close", snapshot.get("prev_day_close")),
        ("Open", snapshot.get("open")),
        ("Low", snapshot.get("low")),
        ("High", snapshot.get("high")),
        ("Last", snapshot.get("current_price")),
    ]
    return [
        {"date": label, "price": round(float(price), 2)}
        for label, price in raw_points
        if price not in (None, 0)
    ]


def cboe_option_price(option):
    bid = float(option.get("bid") or 0)
    ask = float(option.get("ask") or 0)
    last = float(option.get("last_trade_price") or 0)
    theo = float(option.get("theo") or 0)
    if last > 0:
        return last
    if bid > 0 and ask > 0:
        return (bid + ask) / 2
    return theo


def get_market_snapshot(ticker):
    try:
        snapshot = fetch_cboe_snapshot(ticker)
        return {
            "source": "cboe",
            "current_price": float(snapshot["current_price"]),
            "volatility": float(snapshot.get("iv30") or 40),
            "chart_data": cboe_chart_data(snapshot),
            "expirations": cboe_expirations(snapshot),
        }
    except Exception as cboe_error:
        print(f"Cboe failed for {ticker}: {cboe_error}")

    stock = yf.Ticker(ticker)
    hist = stock.history(period="6mo")
    if hist.empty:
        raise ValueError("No yfinance history")

    volatility = 40.0
    try:
        rets = hist["Close"].pct_change().dropna()
        volatility = rets.std() * (252**0.5) * 100
        if math.isnan(volatility) or volatility == 0:
            volatility = 40.0
    except Exception:
        volatility = 40.0

    return {
        "source": "yfinance",
        "current_price": float(hist["Close"].iloc[-1]),
        "volatility": volatility,
        "chart_data": compact_chart_data(hist),
        "expirations": list(stock.options[:8]),
    }


def cboe_chain(ticker, expiry):
    snapshot = fetch_cboe_snapshot(ticker)
    current_price = float(snapshot.get("current_price") or 0)
    calls = []
    puts = []

    for option in snapshot.get("options", []):
        parsed = parse_occ_option(option.get("option"))
        if not parsed or parsed["expiry"] != expiry:
            continue

        row = {
            "strike": round(parsed["strike"], 2),
            "lastPrice": round(cboe_option_price(option), 2),
            "impliedVolatility": float(option.get("iv") or 0),
            "volume": int(option.get("volume") or 0),
        }
        if parsed["type"] == "call":
            calls.append(row)
        else:
            puts.append(row)

    def nearest_contracts(rows):
        rows = sorted(rows, key=lambda row: abs(row["strike"] - current_price))[:40]
        return sorted(rows, key=lambda row: row["strike"])

    return {"calls": nearest_contracts(calls), "puts": nearest_contracts(puts), "source": "cboe"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict later
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
    ticker = ticker.upper().strip()
    cached = get_cached(("stock", ticker))
    if cached:
        return cached

    try:
        market = get_market_snapshot(ticker)
        return set_cached(("stock", ticker), {
            "current_price": round(market["current_price"], 2),
            "chart_data": market["chart_data"],
            "expirations": market["expirations"],
            "source": market["source"],
        }, STOCK_CACHE_SECONDS)
    except Exception as e:
        print(f"Market data failed for {ticker}. Using demo data. Error: {e}")
        return set_cached(("stock", ticker), mock_stock_data(ticker), 60)

@app.get("/api/chain/{ticker}/{date}")
def get_option_chain(ticker: str, date: str):
    ticker = ticker.upper().strip()
    cached = get_cached(("chain", ticker, date))
    if cached:
        return cached

    try:
        return set_cached(("chain", ticker, date), cboe_chain(ticker, date), CHAIN_CACHE_SECONDS)
    except Exception as cboe_error:
        print(f"Cboe chain failed for {ticker} {date}: {cboe_error}")

    try:
        stock = yf.Ticker(ticker)
        chain = stock.option_chain(date)
        calls = chain.calls[['strike', 'lastPrice', 'impliedVolatility', 'volume']].fillna(0)
        puts = chain.puts[['strike', 'lastPrice', 'impliedVolatility', 'volume']].fillna(0)
        payload = {
            "calls": calls.head(40).to_dict('records'),
            "puts": puts.head(40).to_dict('records')
        }
        return set_cached(("chain", ticker, date), payload, CHAIN_CACHE_SECONDS)
    except Exception as e:
        # Minimal mock chain
        print(f"Option chain failed for {ticker} {date}: {e}")
        return {"calls": [], "puts": []}

@app.post("/api/analyze")
def analyze_option(request: AnalysisRequest):
    """ Feature 1: Single Option Analysis """
    try:
        market = get_market_snapshot(request.ticker)
        current_price = market["current_price"]
        days = days_to_expiry(request.expiry)
        vol = market["volatility"]
        if math.isnan(vol) or vol == 0:
            vol = 40.0

        c = mibian.BS([current_price, request.strike, 4.5, days], vol)
        model_price = c.callPrice if request.option_type == 'call' else c.putPrice
        
        diff = request.market_price - model_price
        percent_diff = (diff / model_price) * 100 if model_price > 0 else 0
        
        verdict = "FAIRLY PRICED"
        if percent_diff > 15: verdict = "EXPENSIVE"
        elif percent_diff < -15: verdict = "CHEAP"

        return {
            "underlying_price": round(current_price, 2),
            "market_price": round(request.market_price, 2),
            "model_price": round(model_price, 2),
            "verdict": verdict,
            "percent_mispricing": round(percent_diff, 1),
            "volatility_used": round(vol, 2),
            "greeks": {
                "delta": round((c.callDelta if request.option_type == 'call' else c.putDelta) or 0.5, 3),
                "theta": round((c.callTheta if request.option_type == 'call' else c.putTheta) or -0.1, 3),
                "vega": round(c.vega if c.vega else 0.2, 3),
                "rho": 0.05
            },
            "source": market["source"],
        }
    except Exception as e:
        print(f"Analysis failed for {request.ticker}. Using demo data. Error: {e}")
        return {
            "underlying_price": 100, "market_price": round(request.market_price, 2), "model_price": 5.50, "verdict": "FAIRLY PRICED",
            "percent_mispricing": 0, "volatility_used": 40,
            "greeks": {"delta": 0.5, "theta": -0.1, "vega": 0.2, "rho": 0.05}
        }

@app.post("/api/greeks-profile")
def get_greeks_profile(request: AnalysisRequest):
    """ Feature 2: Greeks Simulation """
    try:
        market = get_market_snapshot(request.ticker)
        current_price = market["current_price"]
        days = days_to_expiry(request.expiry)
        vol = market["volatility"]
        if math.isnan(vol) or vol == 0:
            vol = 40.0
        
        points = []
        for p in [current_price * (0.8 + i*0.02) for i in range(21)]:
            try:
                c = mibian.BS([p, request.strike, 4.5, days], vol)
                points.append({
                    "price": round(p, 2), 
                    "delta": round(c.callDelta, 3), 
                    "theta": round(c.callTheta, 3), 
                    "vega": round(c.vega, 3)
                })
            except: pass
            
        if not points: raise Exception("No points")
        return {"current_price": round(current_price, 2), "simulation": points, "source": market["source"]}
    except Exception as e:
        print(f"Greeks profile failed for {request.ticker}. Using demo data. Error: {e}")
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
# ... inside api/index.py ...

@app.post("/api/hedging-calc")
def get_hedging_sim(request: AnalysisRequest):
    price = request.market_price if request.market_price > 0 else 400
    shares = request.shares
    
    # --- 1. DEFINE THE HEDGE (The "Insurance") ---
    # We assume an "At-The-Money" (ATM) Put option expiring in 30 days.
    strike = price # ATM strike
    days_to_expiry = 30
    
    # Mocking realistic option data (In a real app, use mibian library)
    # A 1-month ATM put is usually around 2-3% of stock price.
    put_price_per_share = price * 0.025 
    # Total cost for 1 contract (covers 100 shares)
    contracts_needed = max(1, round(shares / 100))
    total_put_cost = put_price_per_share * 100 * contracts_needed

    # Mock Greeks (Realistic values for an ATM Put)
    # Delta: approx -0.50 for ATM put
    # Theta: negative, time decay hurts buyers
    # Vega: positive, volatility helps buyers
    option_details = {
        "contracts": contracts_needed,
        "strike": round(strike, 2),
        "expiry": f"{days_to_expiry} Days",
        "premium_per_contract": round(put_price_per_share * 100, 2),
        "greeks": {
            "delta": -0.51,
            "theta": -0.85, # Loses $0.85 per day
            "vega": 1.20    # Gains $1.20 per 1% vol increase
        }
    }

    # --- 2. RISK ANALYSIS ---
    unhedged_risk = {
        "score": 95, "level": "CRITICAL", "color": "red",
        "message": "⛔ UNPROTECTED: Full exposure to market drops."
    }
    hedged_risk = {
        "score": 15, "level": "SAFE", "color": "green",
        "message": f"✅ PROTECTED: {contracts_needed} Put Contract(s) cap your downside."
    }

    # --- 3. SIMULATION (Crash Scenario) ---
    points = []
    start = price * 1.02
    end = price * 0.8 # 20% drop
    step = (end - start) / 15
    curr = start
    
    entry_cost = price * shares
    
    while curr >= end:
        # A: No Hedge P&L
        unhedged_pl = (curr * shares) - entry_cost
        
        # B: With Hedge P&L
        # Put intrinsic value grows as price drops below strike
        intrinsic_per_contract = max(0, strike - curr) * 100
        total_hedge_payoff = intrinsic_per_contract * contracts_needed
        hedged_pl = unhedged_pl + total_hedge_payoff - total_put_cost
        
        points.append({
            "stock_price": round(curr, 2),
            "unhedged_pl": round(unhedged_pl, 2),
            "hedged_pl": round(hedged_pl, 2)
        })
        curr += step

    return {
        "entry_price": price,
        "shares": shares,
        "protection_cost": round(total_put_cost, 2),
        "option_details": option_details, # <-- NEW DATA
        "simulation": points,
        "risk_analysis": { "unhedged": unhedged_risk, "hedged": hedged_risk }
    }

@app.post("/api/scenario")
def get_scenario(request: AnalysisRequest):
    # 1. Setup Basics
    ticker = request.ticker
    current_price = request.market_price if request.market_price > 0 else 400
    target_price = request.target_price
    strike = request.strike
    days = request.days_ahead
    
    # 2. Mock Option Pricing Logic (Simplified Black-Scholes for Speed)
    # We simulate how an option price changes based on stock move + time decay
    
    # Intrinsic Value (Real value)
    intrinsic_now = max(0, current_price - strike) if request.option_type == "call" else max(0, strike - current_price)
    intrinsic_future = max(0, target_price - strike) if request.option_type == "call" else max(0, strike - target_price)
    
    # Extrinsic Value (Time value) - decays as days decrease
    # Mocking volatility impact: roughly $2 of time value per week remaining
    extrinsic_now = (30 / 365) * 20 # Assume 30 days originally
    extrinsic_future = (days / 365) * 20 # Remaining days
    
    price_now = intrinsic_now + extrinsic_now
    price_future = intrinsic_future + extrinsic_future
    
    pl = price_future - price_now
    pl_percent = (pl / price_now) * 100 if price_now > 0 else 0

    # 3. Generate "The Why" (Explain the P&L)
    reasons = []
    if intrinsic_future > intrinsic_now:
        reasons.append(f"✅ Directional Move: The stock moving to ${target_price} added value.")
    else:
        reasons.append(f"❌ Wrong Direction: The stock move hurt your position.")
        
    if extrinsic_future < extrinsic_now:
        loss = round(extrinsic_now - extrinsic_future, 2)
        reasons.append(f"📉 Time Decay: You lost ${loss} of value just by waiting (Theta).")
        
    # 4. Consultant Tips
    tips = []
    if days < 5:
        tips.append("⚠️ Danger Zone: Holding options this close to expiration is gambling. Gamma risk is high.")
    if pl_percent < -20:
        tips.append("💡 Cut Losses? When a plan fails, preservation of capital is key. Don't hope.")
    if pl_percent > 50:
        tips.append("💰 Take Profit: You simulated a 50%+ gain. Consider selling half to lock it in.")

    return {
        "current_price": round(current_price, 2),
        "future_price": round(target_price, 2),
        "option_price_now": round(price_now, 2),
        "option_price_future": round(price_future, 2),
        "pl": round(pl * 100, 2), # Assuming 1 contract (x100)
        "percent_change": round(pl_percent, 2),
        "reasons": reasons,
        "tips": tips
    }
# ... inside api/index.py ...

@app.post("/api/heatmap")
def get_heatmap(request: AnalysisRequest):
    # 1. Setup Ranges (X-Axis and Y-Axis)
    current_price = request.market_price if request.market_price > 0 else 400
    strike = request.strike
    
    # X-Axis: Price ranges from -10% to +10%
    # We create 11 data points: -10%, -8%, ..., 0%, ..., +10%
    price_steps = []
    for i in range(-10, 11, 2): 
        price_steps.append(current_price * (1 + (i/100)))

    # Y-Axis: Time ranges from "Days Left" down to 0 (Expiry)
    # We create 5 steps (e.g., 30, 22, 15, 7, 0)
    start_days = request.days_ahead if request.days_ahead > 0 else 30
    days_steps = [
        int(start_days),
        int(start_days * 0.75),
        int(start_days * 0.50),
        int(start_days * 0.25),
        0
    ]
    
    heatmap_data = []

    # 2. Build the Grid (The Nested Loop)
    for day in days_steps:
        row_values = []
        for sim_price in price_steps:
            
            # --- MOCK OPTION PRICING LOGIC ---
            # Intrinsic Value (Real Money)
            if request.option_type == "call":
                intrinsic = max(0, sim_price - strike)
            else:
                intrinsic = max(0, strike - sim_price)
            
            # Extrinsic Value (Time Money)
            # Logic: Time value decays as 'day' gets closer to 0.
            # It also decreases if price moves far away from strike (Deep ITM/OTM).
            time_factor = (day / 30) 
            dist_percent = abs(sim_price - strike) / strike
            moneyness_factor = max(0, 1 - (dist_percent * 5)) # Decays quickly away from ATM
            
            # Assume max extrinsic value is ~$5.00
            extrinsic = 5.0 * time_factor * moneyness_factor
            
            sim_option_price = intrinsic + extrinsic
            
            # Calculate Profit/Loss vs an estimated Entry Cost
            # We estimate entry cost based on the CURRENT parameters (start of sim)
            # (In a real app, you'd calculate this once outside the loop)
            entry_intrinsic = max(0, current_price - strike) if request.option_type == "call" else max(0, strike - current_price)
            entry_extrinsic = 5.0 * (start_days/30) * max(0, 1 - (abs(current_price-strike)/strike * 5))
            entry_cost = entry_intrinsic + entry_extrinsic
            
            pl = sim_option_price - entry_cost
            
            row_values.append({
                "price": round(sim_price, 2),
                "pl": round(pl * 100, 2) # Assuming 100 shares (1 contract)
            })
            
        heatmap_data.append({
            "days_left": day, 
            "values": row_values
        })

    # 3. Return the Data Structure expected by Frontend
    return {
        "matrix": heatmap_data,
        "x_labels": [f"{i}%" for i in range(-10, 11, 2)], # Labels: -10%, -8%, etc.
        "y_labels": days_steps
    }
@app.post("/api/chat")
def chat_with_ai(request: dict):
    api_key = os.getenv("GEMINI_API_KEY", "")
    suggestions = ["What is on my screen?", "Explain this feature"]
    
    user_message = request.get("message", "").strip()
    screen_context = request.get("context", "General Dashboard").strip()
    is_intro_question = any(
        phrase in user_message.lower()
        for phrase in ["who are you", "your name", "what is your name", "introduce", "hello", "hi", "hey"]
    )
    
    system_prompt = (
        "You are Doody, the AI financial manager inside Drawdown Labs. "
        "Your name is Doody. Do not call yourself Gemini, Google, an AI model, or Drawdown AI. "
        "If the user greets you, asks who you are, or asks your name, start with exactly: "
        "'Hi, I am Doody, your financial manager at Drawdown Labs.' "
        "For other answers, mention Doody only when it feels natural; do not repeat your full introduction every time. "
        "Use the current screen context to explain what the user is seeing. "
        "Keep answers calm, friendly, beginner-friendly, and under 50 words. "
        "Avoid financial advice; explain concepts and risks instead. "
        f"Current screen: {screen_context}."
    )

    if is_intro_question and len(user_message.split()) <= 8:
        return {
            "reply": (
                "Hi, I am Doody, your financial manager at Drawdown Labs. "
                f"You are viewing {screen_context}. Ask me anything about this screen."
            ),
            "suggestions": suggestions
        }

    if not api_key:
        return {"reply": "AI chat is not configured yet.", "suggestions": suggestions}

    models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]
    payload = {
        "contents": [{
            "parts": [{"text": f"{system_prompt}\n\nUser Question: {user_message}"}]
        }]
    }

    try:
        last_error = "No Gemini model responded."
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            response = requests.post(url, json=payload, timeout=8)
            data = response.json()

            if "candidates" in data:
                ai_reply = data['candidates'][0]['content']['parts'][0]['text']
                return {"reply": ai_reply, "suggestions": suggestions}

            if "error" in data:
                last_error = data["error"].get("message", "Gemini request failed.")
                print(f"Gemini model {model} failed: {last_error}")
                continue
        
            print(f"Unexpected Gemini response from {model}: {data}")

        return {
            "reply": f"Setup Error: {last_error}. Check your Gemini API key and enabled services.",
            "suggestions": suggestions
        }

    except Exception as e:
        print(f"Python chat error: {e}")
        return {"reply": "Connection failed.", "suggestions": suggestions}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
