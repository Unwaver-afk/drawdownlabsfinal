# Drawdown Labs

Drawdown Labs is an interactive risk and options strategy dashboard. It combines live market data, options analytics, visual simulations, and a lightweight AI assistant to help users understand portfolio risk in a more visual way.

> Educational project only. This is not financial advice.

## What The App Does

- Live market pricing with stock chart data and option-chain lookup
- Black-Scholes option analysis with model price, mispricing, and Greeks
- Greeks visualizer for delta, theta, and vega movement
- Volatility simulator for implied-volatility impact
- Hedging demo for protective-put risk protection
- Scenario lab for option profit and loss projections
- Risk heatmap for price and time sensitivity
- Financial dictionary for beginner-friendly explanations
- AI chatbot powered by Gemini through the backend API

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | FastAPI, yfinance, mibian |
| Hosting | Firebase Hosting for frontend, Render-compatible backend |
| AI | Google Gemini API |

## Repository Layout

```text
.
├── api/                         # FastAPI backend
├── docs/                        # Project notes and structure guide
├── src/
│   ├── app/                     # App router and auth shell
│   ├── components/              # Shared UI, layout, chat widget
│   ├── features/                # Dashboard modules
│   ├── pages/                   # Public pages
│   ├── config.js                # API base URL helper
│   └── main.jsx                 # React entry point
├── firebase.json                # Firebase Hosting config
├── requirements.txt             # Python backend dependencies
├── package.json                 # Frontend scripts and dependencies
└── vite.config.js               # Vite build configuration
```

For a more detailed map, see [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## Getting Started

### 1. Clone And Install

```bash
git clone <your-repo-url>
cd drawdownlabsfinal
npm install
```

### 2. Create Local Environment File

Copy the example file:

```bash
cp .env.example .env
```

Then set your values:

```text
GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_BASE=https://your-backend-service.example.com/api
```

For local frontend development, `src/config.js` uses `/api` in dev mode and relies on the Vite proxy.

### 3. Install Backend Dependencies

Use a Python virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Run The Backend

```bash
uvicorn api.index:app --reload --host 127.0.0.1 --port 8000
```

### 5. Run The Frontend

In a second terminal:

```bash
npm run dev
```

Open the Vite URL shown in the terminal.

## Useful Scripts

```bash
npm run dev       # Start Vite dev server
npm run build     # Build production frontend into dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

Backend syntax check:

```bash
python3 -m py_compile api/index.py
```

## Deployment

### Frontend: Firebase Hosting

Build and deploy:

```bash
npm run build
firebase deploy --only hosting
```

Firebase serves the `dist/` folder. Static assets under `/assets/**` are cached long-term through `firebase.json`.

### Backend: Render

Set these environment variables in Render:

```text
GEMINI_API_KEY=your_gemini_api_key_here
```

If your deployed frontend should call a different backend URL, set this before building the frontend:

```text
VITE_API_BASE=https://your-render-service.onrender.com/api
```

Then redeploy the Render backend after pushing changes.

## Performance Notes

The frontend uses lazy-loaded dashboard modules so visitors do not download every simulator on the first page load. The backend also caches common stock and option-chain responses to reduce repeated Yahoo Finance calls.

Key optimizations:

- Route-level lazy loading for public pages and dashboard modules
- Separate Vite chunks for React, charts, and icons
- Firebase immutable caching for hashed assets
- Backend in-memory caching for stock and option-chain endpoints
- Smaller chart and option-chain payloads

## Environment Variables

| Name | Used By | Required | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Backend | Yes for chat | Enables the AI chatbot endpoint |
| `VITE_API_BASE` | Frontend build | Optional | Overrides production API base URL |

Do not commit `.env`. Use `.env.example` as the shareable template.

## API Overview

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/stock/{ticker}` | GET | Current price, chart data, expirations |
| `/api/chain/{ticker}/{date}` | GET | Calls and puts for an expiration date |
| `/api/analyze` | POST | Black-Scholes option analysis |
| `/api/greeks-profile` | POST | Greeks simulation |
| `/api/vol-sim` | POST | Volatility simulation |
| `/api/hedging-calc` | POST | Protective-put hedge simulation |
| `/api/scenario` | POST | Scenario profit and loss simulation |
| `/api/heatmap` | POST | Time and price risk heatmap |
| `/api/chat` | POST | Gemini-powered assistant response |

## Troubleshooting

### Chat says "AI chat is not configured yet"

The backend cannot find `GEMINI_API_KEY`. Add it to your local `.env` file for local development, or add it to Render environment variables for production.

### Chat says a Gemini model was not found

Redeploy the latest backend. The backend now tries current Gemini model names in fallback order.

### Firebase site does not show latest changes

Rebuild and redeploy:

```bash
npm run build
firebase deploy --only hosting
```

Then hard refresh the browser.

### Market data loads slowly

The hosted backend may be waking from an idle state, especially on free hosting tiers. Repeated requests for the same ticker should be faster because the backend caches common responses.

## Contributing Notes

- Keep public route screens in `src/pages`.
- Keep dashboard tools in `src/features`.
- Keep shared layout or widgets in `src/components`.
- Keep secrets in environment variables, never in source files.
- Run `npm run lint` and `npm run build` before deploying.

## License

No license has been selected yet. Add one before accepting external contributions.
