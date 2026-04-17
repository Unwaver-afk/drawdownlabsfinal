# Project Structure

This project keeps deploy-critical files at the repository root and groups application code by responsibility.

```text
drawdownlabsfinal/
├── api/
│   └── index.py                 # FastAPI backend for market data, simulations, and chat
├── docs/
│   ├── PROJECT_STRUCTURE.md     # Repository guide
│   └── firebase-studio-guidelines.md
├── src/
│   ├── app/
│   │   └── App.jsx              # Router and authentication shell
│   ├── components/
│   │   ├── chat/                # Floating AI assistant
│   │   └── layout/              # Dashboard shell and navigation
│   ├── features/
│   │   ├── education/           # Dictionary and learning modules
│   │   ├── pricing/             # Live pricing screen
│   │   └── simulators/          # Greeks, volatility, hedging, scenario, heatmap tools
│   ├── pages/                   # Public pages
│   ├── config.js                # API base URL helper
│   ├── index.css                # Global Tailwind styles
│   └── main.jsx                 # React entry point
├── firebase.json                # Firebase Hosting config
├── requirements.txt             # Python backend dependencies
├── package.json                 # Frontend dependencies and scripts
└── vite.config.js               # Vite build configuration
```

## Why It Is Organized This Way

- `src/pages` contains public route screens such as landing, signup, and about.
- `src/features` contains the dashboard product modules users interact with after login.
- `src/components` contains shared interface pieces that support the features.
- `api` stays at the root because Render and Vercel-style Python deployments often expect a stable backend entry path.
- Firebase, Vite, Tailwind, PostCSS, and ESLint config files stay at the root because their tools look there by default.
