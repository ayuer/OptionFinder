# Development Documentation

This document helps developers quickly get started with **Option Finder** development.

---

## 🛠 Tech Stack

This project is built with the following core technologies:

- **Framework**: [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 7.0](https://vitejs.dev/)
- **Chrome Extension**: [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **Charts**: [Recharts 3.6](https://recharts.org/)
- **AI SDKs**: OpenAI SDK, Anthropic SDK
- **Package Manager**: npm

---

## 📂 Project Structure

```text
option-finder/
├── src/
│   ├── assets/           # Static resources (images, icons)
│   ├── components/       # React components
│   │   ├── ChatInterface.tsx       # Main UI with charts
│   │   ├── WatchlistPanel.tsx      # Watchlist sidebar
│   │   ├── CandidatesDashboard.tsx # Candidates pool
│   │   ├── SettingsPanel.tsx       # Settings modal
│   │   └── Header.tsx              # Header component
│   ├── content/          # Content Scripts
│   │   └── yahoo-finance.ts        # Yahoo Finance data extraction
│   ├── services/         # Business logic
│   │   ├── AIService.ts            # AI provider integrations
│   │   ├── OptionChainService.ts   # Options data processing
│   │   ├── WatchlistService.ts     # Watchlist management
│   │   ├── CandidatesService.ts    # Candidates pool management
│   │   ├── messageTypes.ts         # TypeScript type definitions
│   │   ├── messageHooks.ts         # React hooks for messages
│   │   └── aiConfigHooks.ts        # React hooks for AI config
│   ├── App.tsx           # Main React app entry
│   ├── main.tsx          # React mount point
│   ├── index.css         # Global styles and Tailwind config
│   └── service_worker.ts # Background service worker
├── public/               # Public static assets (icons)
├── manifest.config.ts    # Chrome Extension Manifest V3 config
├── vite.config.ts        # Vite build configuration
└── package.json          # Dependencies and scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure your development environment has:
- [Node.js](https://nodejs.org/) >= 18 (LTS recommended)
- npm >= 9

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

This command starts the Vite dev server. Since this is a Chrome extension, you cannot preview all features directly at `localhost` - you need to load it into Chrome.

### 4. Load into Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist` folder from the project root (auto-generated after first `npm run dev`)
5. The extension is now installed. Vite will auto-reload (HMR) when you modify code.

> **Note**: If you modify `manifest.config.ts` or `service_worker.ts`, you need to click the **Reload** button on the extension card to restart the extension.

---

## 🏗 Build & Release

### Build Production Version

```bash
npm run build
```

This command will:
1. Run TypeScript type checking (`tsc -b`)
2. Build for production with Vite
3. Output to `dist/` directory
4. Package as `dist.zip` for distribution

After building, the `dist` folder can be:
- Uploaded to Chrome Web Store
- Distributed to users for local installation
- Shared as a ZIP file

---

## 🧩 Architecture Overview

This extension is built on **Chrome Extension Manifest V3** specifications.

### Side Panel (Main UI)

- **Entry**: `index.html` → `src/main.tsx` → `src/App.tsx`
- **Purpose**: Main user interface where users interact with the extension
- **Features**:
  - Configure AI provider and API keys
  - View options chain data and charts
  - Generate AI analysis reports
  - Manage watchlist and candidates pool

### Content Scripts

- **Entry**: `src/content/yahoo-finance.ts`
- **Matched Pages**: `https://finance.yahoo.com/quote/*/options/*`
- **Purpose**: Extract options chain data from Yahoo Finance pages
- **Functions**:
  - Parse options table DOM structure
  - Extract strikes, OI, volume, IV, prices
  - Calculate derived metrics (delta, yield)
  - Send data to service worker

### Service Worker (Background)

- **Entry**: `src/service_worker.ts`
- **Purpose**: Message routing and background tasks
- **Functions**:
  - Listen for messages from content scripts
  - Forward data to side panel
  - Handle extension lifecycle events
  - Manage persistent state

### Data Flow

```
User visits Yahoo Finance options page
              ↓
Content Script activates and extracts data
              ↓
Service Worker receives message
              ↓
Service Worker routes to Side Panel
              ↓
Side Panel processes and displays data
              ↓
User clicks "Generate AI Report"
              ↓
AI Service calls provider API
              ↓
Response displayed in Side Panel
```

---

## 🎨 UI/UX Design System

### Color Palette

- **Primary Blue**: `#2563eb` (blue-600) - Main actions, CTAs
- **Primary Blue Hover**: `#1d4ed8` (blue-700)
- **Emerald Green**: `#059669` (emerald-600) - Save actions
- **Slate Dark**: `#1e293b` to `#0f172a` - Headers, dark accents
- **Neutral Grays**: Semantic grays for text and borders

### Typography

- **Font Stack**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`
- **Size Scale**: Tailwind default + 2px (xs: 14px, sm: 16px, base: 18px)
- **Weights**: Normal (400), Medium (500), Semibold (600), Bold (700), Black (900)

### Spacing

- Uses Tailwind's spacing scale (4px base unit)
- Key gaps: `mb-8`, `mb-10`, `mb-12`, `mb-16` for vertical rhythm

### Components

- **Buttons**: Rounded (`rounded-3xl`), gradient backgrounds, hover lift effects
- **Cards**: White backgrounds, subtle borders, hover shadows
- **Charts**: Recharts with custom tooltips, offset for clarity
- **Modals**: Dark overlay, centered content, smooth animations

---

## 📊 Key Services

### AIService (`src/services/AIService.ts`)

Handles all AI provider integrations:

**Supported Providers:**
- OpenAI (ChatGPT)
- Anthropic (Claude 3.5 Sonnet)
- Google (Gemini 1.5/2.5/3)
- Alibaba Qwen

**Key Functions:**
- `analyzeOptionChain()` - Generates quantitative analysis
- Provider-specific API call wrappers
- Schema definitions for tool use
- Error handling and retries

**Adding a New AI Provider:**
1. Add provider to `AIConfig` type in `messageTypes.ts`
2. Implement provider case in `AIService.analyzeOptionChain()`
3. Add API key handling in `SettingsPanel.tsx`
4. Test with sample options data

### OptionChainService (`src/services/OptionChainService.ts`)

Processes raw options data:

**Key Functions:**
- `transformToStrikeView()` - Consolidate calls/puts by strike
- `calculateDTE()` - Days to expiration
- `calculateDelta()` - Black-Scholes delta approximation
- `calculateAnnualizedReturn()` - Yield calculation
- `parseUrlContext()` - Extract symbol and date from URL

**Metrics Calculated:**
- **Delta**: Using simplified Black-Scholes with IV
- **Annualized Yield**: `(Premium / Strike) * (365 / DTE)`
- **Moneyness**: Call/Put ITM status

### WatchlistService (`src/services/WatchlistService.ts`)

Manages saved options chains:

- LocalStorage-based persistence
- CRUD operations (add, delete, reorder)
- Custom event broadcasting (`watchlistUpdated`)
- Timestamp tracking

### CandidatesService (`src/services/CandidatesService.ts`)

Manages pinned strikes:

- Cross-ticker candidate comparison
- Duplicate prevention
- Pinned strikes tracking for current context
- URL references for navigation

---

## 🧪 Testing

### Manual Testing Checklist

**Scanning:**
- [ ] Visit AAPL options page on Yahoo Finance
- [ ] Click extension icon
- [ ] Verify data extraction completes
- [ ] Check all strikes are displayed
- [ ] Verify charts render correctly

**AI Analysis:**
- [ ] Configure API key in settings
- [ ] Click "GENERATE QUANTITATIVE REPORT"
- [ ] Verify report generates successfully
- [ ] Check sentiment, observations, support/resistance

**Candidates Pool:**
- [ ] Pin a strike with 📌 icon
- [ ] Verify it appears in Candidates Pool
- [ ] Check OI chart shows pin marker
- [ ] Navigate to Yahoo Finance via URL
- [ ] Delete candidate

**Watchlist:**
- [ ] Save an options chain
- [ ] Enter custom valuation
- [ ] Verify it appears in watchlist
- [ ] Drag to reorder
- [ ] Restore from watchlist
- [ ] Delete item

### Debugging

**Console Logs:**
```typescript
// Enable Delta calculation debug logs
// In src/services/OptionChainService.ts line 55:
const debugLog = true;
```

**Chrome DevTools:**
- Side Panel: Right-click in panel → "Inspect"
- Service Worker: `chrome://extensions/` → "Inspect service worker"
- Content Script: F12 on Yahoo Finance page → Console tab

---

## 🔧 Common Development Tasks

### Add a New Chart

1. Add data to `strikeView` in `ChatInterface.tsx`
2. Create new `ComposedChart` or `BarChart` component
3. Add custom tooltip
4. Add to chart selection state (`hoveredChart`)
5. Style with Tailwind classes

### Modify AI Prompt

1. Edit `analyzeOptionChain()` in `AIService.ts`
2. Update system prompt or tool schema
3. Test with different options chains
4. Adjust based on response quality

### Change Color Theme

1. Update CSS variables in `src/index.css`
2. Replace `--primary-blue` values
3. Update Tailwind classes in components
4. Test in both light and dark mode

### Add New Metric

1. Add calculation in `OptionChainService.ts`
2. Update `StrikeView` type in `messageTypes.ts`
3. Display in `ChatInterface.tsx` charts or tooltips
4. Add to AI analysis schema if relevant

---

## 🤝 Contributing

### Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Test thoroughly (see Testing section)
5. Commit with clear messages (`git commit -m 'Add some AmazingFeature'`)
6. Push to your branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

### Code Style

- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: Use JSDoc for public functions
- **Formatting**: Follow project ESLint config

### Pull Request Guidelines

- Provide clear description of changes
- Reference related issues if any
- Include screenshots for UI changes
- Ensure build succeeds (`npm run build`)
- Test in Chrome before submitting

---

## 📚 Additional Resources

### Official Documentation

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [React 19 Docs](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/en-US/api)

### Useful Tools

- [Chrome Extension Manifest Generator](https://developer.chrome.com/docs/extensions/mv3/manifest/)
- [Tailwind Play](https://play.tailwindcss.com/) - Test Tailwind classes
- [TypeScript Playground](https://www.typescriptlang.org/play)

---

## 🐛 Troubleshooting

### Extension doesn't load
- Check `dist/` folder exists (run `npm run dev` first)
- Verify Developer mode is enabled
- Look for errors in `chrome://extensions/`

### Data not extracting
- Verify you're on a Yahoo Finance options page
- Check content script is injected (F12 → Sources tab)
- Look for console errors in page devtools

### AI analysis fails
- Verify API key is correctly entered
- Check provider is selected in settings
- Look for network errors in devtools
- Test API key directly with provider's API

### Charts not rendering
- Check browser console for errors
- Verify Recharts data format
- Ensure window is wide enough (responsive design)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

<div align="center">
  <sub>Happy coding! 🚀</sub>
</div>
