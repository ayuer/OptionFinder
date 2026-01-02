# Option Finder - Yahoo Finance Options Analysis Tool

<div align="center">
  <img src="src/assets/logo.png" alt="Option Finder Logo" width="120">

  **Professional Yahoo Finance Options Chain Analysis Chrome Extension**

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19.1-61dafb)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-7.0-646cff)](https://vitejs.dev/)

  English | [简体中文](./README.md)
</div>

---

## 📖 Introduction

**Option Finder** is a Chrome extension designed for options traders to intelligently analyze Yahoo Finance options chain data. It uses AI-powered quantitative analysis to help you discover high-probability trading opportunities.

### Core Value

- 🎯 **Auto Scan** - One-click scan of entire options chain without manual browsing
- 📊 **Visual Analysis** - Multi-dimensional charts for OI, Volume, IV, and Price distribution
- 🤖 **AI Quant Analysis** - Supports ChatGPT, Claude, Gemini and more for professional analysis reports
- 💡 **Smart Filtering** - Automatically discover opportunities based on Delta, annualized yield, etc.
- 📌 **Candidates Pool** - Cross-ticker comparison and management
- 💾 **Watchlist** - Save important options chain snapshots and track price changes

---

## ✨ Key Features

### 1. One-Click Smart Scan

Click the extension icon on any Yahoo Finance options page to automatically extract:
- All strikes' Call/Put data
- Open Interest (OI)
- Volume
- Implied Volatility (IV)
- Bid/Ask prices
- Delta values (auto-calculated)

### 2. Multi-Dimensional Visualization

Four professional charts:
- **OI Distribution** - Identify support/resistance and gamma walls
- **Volume Distribution** - Discover unusual trading activity
- **IV Curve** - Analyze volatility skew
- **Price Distribution** - Compare Bid/Ask spreads

### 3. AI Quantitative Analysis

Generate professional analysis reports with one click, including:
- Market sentiment (Bullish/Bearish/Neutral)
- Key observations and anomalies
- Support/resistance analysis
- Trading strategy suggestions

Supported AI providers:
- OpenAI (ChatGPT)
- Anthropic (Claude 3.5 Sonnet)
- Google (Gemini 1.5/2.5/3)
- Alibaba Qwen

### 4. Candidates Pool

Cross-ticker comparison of potential trading opportunities:
- Filter by Delta, annualized yield, DTE
- One-click navigation back to Yahoo Finance
- Pin feature to mark saved strikes on charts
- Delete and manage candidates

### 5. Watchlist

Save important options chain snapshots:
- Record underlying price at scan time
- Save AI analysis results
- Manually set valuation price
- Drag-and-drop sorting
- One-click restore to scan state

---

## 🚀 Installation Guide

### Method 1: Build from Source (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/option-finder.git
   cd option-finder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```
   After building, extension files will be generated in the `dist/` directory and automatically packaged as `dist.zip`

4. **Load into Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** in the top right
   - Click **Load unpacked**
   - Select the `dist` folder from the project

### Method 2: Install from ZIP

1. Download the latest `dist.zip` release
2. Extract to a local folder
3. Load the extracted folder in Chrome extensions management page

---

## 📚 User Guide

### Step 1: Configure AI Model

1. Click the extension icon to open the sidebar
2. Click the gear icon ⚙️ on the homepage to open settings
3. Select your AI provider (ChatGPT/Claude/Gemini/Qwen)
4. Enter your API Key
5. Click Save

> 💡 **Get API Keys:**
> - ChatGPT: https://platform.openai.com/api-keys
> - Claude: https://console.anthropic.com/settings/keys
> - Gemini: https://aistudio.google.com/app/apikey
> - Qwen: https://dashscope.console.aliyun.com/apiKey

### Step 2: Scan Options Chain

1. Visit a Yahoo Finance options page
   - Example: `https://finance.yahoo.com/quote/AAPL/options/`
2. Select your desired expiration date
3. Click the Option Finder icon in Chrome toolbar
4. Wait for auto-scan to complete (typically 2-5 seconds)

### Step 3: Analyze Data

After scanning, you will see:

#### 📊 Visualization Charts
- **OI Chart** - Open Interest distribution, click chart to pin tooltip
- **Volume Chart** - Trading volume distribution
- **IV Chart** - Implied Volatility curve
- **Price Chart** - Bid/Ask price comparison

#### 📌 Pin Feature
- Click directly on any bar or line in the charts to add to Candidates Pool
- System automatically selects the option type (Call/Put) with higher absolute Delta
- Pinned strikes will show 📌 markers on the OI chart
- Toast notification displayed with Undo support
- Manage and compare in Candidates Pool

#### 🤖 Generate AI Analysis
1. Click the **GENERATE QUANTITATIVE REPORT** button
2. AI will analyze the entire options chain and generate a report
3. Report includes: sentiment, key observations, support/resistance, trading suggestions

#### 💾 Save to Watchlist
- Click the **SAVE** button to save current options chain
- Optional: Enter your valuation price (for future comparison)
- Manage saved items in Watchlist

---

## 🎯 Typical Use Cases

### Use Case 1: Selling Cash-Secured Puts

**Goal:** Find high-yield Put options

1. Scan options chain with 40-60 DTE
2. Review charts to find strikes with Delta between -0.3 and -0.2
3. Click directly on bar/line in charts to add to Candidates Pool
4. Check OI chart to confirm strong support at that strike
5. Generate AI analysis to confirm market sentiment and risks
6. Compare opportunities across different tickers in Candidates Pool
7. Click on row in Candidates Pool to navigate back to Yahoo Finance and place order

### Use Case 2: Identify Gamma Squeeze Risk

**Goal:** Discover abnormally high OI concentration

1. Scan near-term expiration options chain
2. Observe OI chart, look for extremely high Call OI walls
3. Combine with volume chart to check for unusual activity
4. Generate AI analysis to assess gamma risk
5. Save to Watchlist to track price movement

### Use Case 3: Volatility Trading

**Goal:** Find IV anomalies

1. Scan options chains across multiple tickers
2. Observe IV curves for skew or smile
3. Compare IV levels across different expirations
4. Use AI to analyze potential event-driven factors
5. Compare IV across tickers in Candidates Pool

---

## 🔧 Technical Architecture

### Tech Stack

- **Frontend:** React 19.1 + TypeScript 5.8
- **UI:** Tailwind CSS 4.1
- **Charts:** Recharts 3.6
- **Build Tool:** Vite 7.0 + @crxjs/vite-plugin
- **AI SDKs:** OpenAI SDK, Anthropic SDK
- **Chrome API:** Manifest V3

### Project Structure

```
option-finder/
├── src/
│   ├── assets/          # Icons and images
│   ├── components/      # React components
│   │   ├── ChatInterface.tsx      # Main UI and charts
│   │   ├── WatchlistPanel.tsx     # Watchlist panel
│   │   ├── CandidatesDashboard.tsx # Candidates pool
│   │   ├── SettingsPanel.tsx      # Settings panel
│   │   └── Header.tsx             # Header component
│   ├── services/        # Business logic
│   │   ├── AIService.ts           # AI service wrapper
│   │   ├── OptionChainService.ts  # Options data processing
│   │   ├── WatchlistService.ts    # Watchlist management
│   │   ├── CandidatesService.ts   # Candidates management
│   │   └── messageTypes.ts        # TypeScript definitions
│   ├── content/         # Content Scripts
│   │   └── yahoo-finance.ts       # Yahoo Finance data extraction
│   ├── service_worker.ts # Background Script
│   ├── App.tsx          # App entry
│   ├── main.tsx         # React mount
│   └── index.css        # Global styles
├── public/              # Static assets
├── manifest.config.ts   # Chrome extension config
├── vite.config.ts       # Vite config
└── package.json
```

### Data Flow

```
Yahoo Finance Page
      ↓
Content Script (Extract options data)
      ↓
Service Worker (Message routing)
      ↓
Side Panel UI (Display and interaction)
      ↓
AI Service (Call AI models for analysis)
      ↓
LocalStorage (Persistent storage)
```

---

## ⚙️ Development Guide

### Requirements

- Node.js >= 18
- npm >= 9
- Chrome/Edge >= 120

### Development Mode

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Load dist directory in Chrome
# Code changes will auto-reload
```

### Build for Production

```bash
# Build and package
npm run build

# Output in dist/ directory
# dist.zip can be distributed directly
```

### Code Quality

```bash
# Run ESLint check
npm run lint
```

---

## 📊 Feature Comparison

| Feature | Option Finder | Yahoo Finance Native |
|---------|---------------|---------------------|
| Options chain display | ✅ | ✅ |
| OI/Volume charts | ✅ | ❌ |
| Auto Delta calculation | ✅ | ❌ |
| AI quant analysis | ✅ | ❌ |
| Cross-ticker comparison | ✅ | ❌ |
| Watchlist | ✅ | ❌ |
| Pin markers | ✅ | ❌ |
| Annualized yield calc | ✅ | ❌ |

---

## 🛡️ Privacy & Security

- ✅ **Local Processing** - All data processing happens locally
- ✅ **Zero Upload** - No trading data sent to third-party servers
- ✅ **API Key Security** - API keys stored only in local Chrome Storage
- ✅ **Open Source** - Fully open-source and auditable

**AI Service Calls:**
- Option Finder only calls AI APIs when you click "Generate Report"
- Only statistical data (OI, Volume, Strikes, etc.) is sent
- No personal information or account details included

See [Privacy Policy](./PRIVACY_POLICY.md) for details

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 Changelog

### v1.0.0 (2026-01-02)
- 🎉 Initial release
- ✅ Yahoo Finance options chain auto-scan
- ✅ OI/Volume/IV/Price four-dimensional charts
- ✅ AI quantitative analysis (ChatGPT/Claude/Gemini/Qwen)
- ✅ Candidates Pool for cross-ticker comparison
- ✅ Watchlist management
- ✅ Pin feature and chart markers
- ✅ Auto Delta and annualized yield calculation

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE)

---

## 🙏 Acknowledgments

- [Yahoo Finance](https://finance.yahoo.com/) - Free options data provider
- [Recharts](https://recharts.org/) - Excellent React charting library
- [OpenAI](https://openai.com/) / [Anthropic](https://anthropic.com/) / [Google](https://ai.google/) - AI capabilities

---

## 📮 Contact

- **Issues:** [GitHub Issues](https://github.com/yourusername/option-finder/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/option-finder/discussions)

---

<div align="center">
  <sub>Built with ❤️ for options traders</sub>
</div>
