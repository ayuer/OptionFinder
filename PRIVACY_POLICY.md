# Privacy Policy for Option Finder

**Last Updated:** January 2, 2026

---

## Introduction

Option Finder ("we", "our", or "the Extension") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our Chrome extension for Yahoo Finance options analysis.

**Key Principle: We prioritize your privacy.** Option Finder is designed with privacy-first principles - all core functionality operates locally on your device, and we do not collect, store, or transmit your personal information or trading data to any third-party servers controlled by us.

---

## Information We Collect

### 1. Local Data Storage

The following data is stored **locally** on your device using Chrome's local storage:

#### a. User Preferences
- **AI Provider Selection** (ChatGPT, Claude, Gemini, Qwen)
- **API Keys** for your chosen AI service
- **UI Settings** (language, theme preferences if any)

#### b. User-Generated Content
- **Watchlist Items** - Options chain snapshots you choose to save
  - Stock symbol
  - Expiration date
  - Strike prices
  - Options data (OI, Volume, IV, prices)
  - Your custom valuation prices (if entered)
  - Timestamps

- **Candidates Pool** - Individual options you pin for comparison
  - Symbol, strike, type (Call/Put)
  - Delta, yield, DTE
  - Timestamps
  - URL references to Yahoo Finance pages

#### c. Temporary Session Data
- Current options chain being viewed
- Chart display states
- AI analysis results (if generated)

**Important:** All this data remains on your local device. We do not have access to it.

---

## How We Use Information

### 1. Core Functionality (100% Local)

The following operations happen entirely on your device:

- **Data Extraction** - Reading publicly available options data from Yahoo Finance pages you visit
- **Calculations** - Computing Delta, annualized yields, and other metrics
- **Visualization** - Generating charts and graphs
- **Storage** - Saving your watchlist and candidates pool
- **UI State Management** - Remembering your preferences

**No server communication** occurs for these operations.

### 2. AI Analysis (Third-Party API Calls)

When you click **"GENERATE QUANTITATIVE REPORT"**, the extension will:

**What is sent:**
- Options chain statistical data only:
  - Strike prices
  - Open Interest values
  - Volume data
  - Implied Volatility percentages
  - Bid/Ask prices
  - Stock symbol and expiration date

**What is NOT sent:**
- Your personal information
- Your API key (sent separately in request headers as per API standards)
- Your watchlist or candidates pool
- Your browser history
- Any account information

**Where it goes:**
- Directly to the AI provider you selected (OpenAI, Anthropic, Google, or Alibaba)
- According to that provider's API endpoint
- Using HTTPS encryption

**Third-Party Privacy Policies:**
- OpenAI: https://openai.com/privacy
- Anthropic: https://www.anthropic.com/privacy
- Google: https://policies.google.com/privacy
- Alibaba Cloud: https://www.alibabacloud.com/help/en/legal/latest/alibaba-cloud-privacy-policy

---

## Data We Do NOT Collect

We explicitly **do not** collect, transmit, or store:

- ❌ Your trading account credentials
- ❌ Your brokerage information
- ❌ Your personal trading history
- ❌ Your financial information
- ❌ Analytics or telemetry data
- ❌ Device identifiers
- ❌ IP addresses
- ❌ Browsing history (beyond the current options page you're viewing)
- ❌ Cookies (we don't set any cookies)

---

## Third-Party Services

### 1. Yahoo Finance

**What we access:**
- Publicly available options chain data on pages you visit at `https://finance.yahoo.com/quote/*/options/`

**How we access it:**
- Through Chrome Content Scripts that read the page's DOM

**Privacy note:**
- We do not interact with Yahoo Finance servers directly
- We only read data from pages you actively navigate to
- Yahoo Finance's privacy policy applies: https://legal.yahoo.com/us/en/yahoo/privacy/index.html

### 2. AI Service Providers

When you use the AI analysis feature, you are directly communicating with your chosen provider's API using your own API key.

**Your responsibilities:**
- Keeping your API key secure
- Understanding your chosen provider's privacy policy
- Managing your API usage and billing

**Our responsibilities:**
- Storing your API key securely in local Chrome storage only
- Not logging or transmitting your API key to any other service
- Sending only necessary options data to generate analysis

---

## Data Security

### Local Storage Security

- **API Keys:** Stored using Chrome's `chrome.storage.local` API, which is:
  - Encrypted at rest by Chrome
  - Isolated to the extension
  - Not accessible by websites or other extensions

- **Watchlist/Candidates:** Stored in `localStorage`, which is:
  - Domain-isolated
  - Persisted across browser sessions
  - Clearable by you at any time

### Best Practices We Follow

- ✅ **No backend servers** - We don't operate any servers to store your data
- ✅ **HTTPS only** - All API calls use encrypted HTTPS
- ✅ **Minimal permissions** - We request only the Chrome permissions needed
- ✅ **Open source** - Our code is publicly auditable on GitHub

### Your Security Responsibilities

- 🔒 Keep your API keys confidential
- 🔒 Use strong, unique API keys
- 🔒 Regularly rotate your API keys
- 🔒 Review your AI provider's usage logs for unusual activity

---

## Your Privacy Rights

### Data Access

Since all data is stored locally on your device:
- You can access it anytime through the extension UI
- Watchlist and Candidates Pool are visible in the extension
- Settings including your API keys are in the Settings panel

### Data Deletion

You can delete your data at any time:

**Delete specific items:**
- Watchlist items: Click the "×" button on any saved item
- Candidates: Click "Remove" in the Candidates Pool

**Delete all data:**
```
1. Open Chrome: chrome://extensions/
2. Find "Option Finder"
3. Click "Remove"
```

This will permanently delete all locally stored data.

### Data Portability

Currently, data export is not available. All data is stored in standard browser storage formats and could be accessed programmatically if needed.

---

## Children's Privacy

Option Finder is not intended for use by individuals under the age of 18. We do not knowingly collect information from children. Options trading is restricted to adults in most jurisdictions.

---

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Changes will be reflected by updating the "Last Updated" date at the top of this policy.

**How we notify you:**
- Major changes will be announced in extension update notes
- Policy is always available in the GitHub repository
- You can review it anytime at the link in the extension

**Your continued use** of Option Finder after changes constitutes acceptance of the updated policy.

---

## Compliance

### GDPR (European Users)

If you are in the European Economic Area:

- **Legal basis for processing:** Your consent (by using the extension)
- **Data controller:** You (all data is stored locally under your control)
- **Data processor:** Third-party AI providers (when you use AI features)
- **Right to erasure:** Delete the extension or clear specific data items
- **Right to portability:** Data is in your browser storage
- **Right to object:** Don't use the AI analysis feature

### CCPA (California Users)

If you are a California resident:

- We do not "sell" your personal information
- We do not share your personal information for monetary benefit
- You have the right to delete your data (by removing the extension)

---

## Open Source Transparency

Option Finder is fully open-source. You can:

- **Review the code:** https://github.com/yourusername/option-finder
- **Audit data flows:** Check `src/services/AIService.ts` for API calls
- **Verify claims:** See `src/services/*Service.ts` for storage logic
- **Report issues:** Open issues on GitHub

---

## Contact Us

If you have questions or concerns about this Privacy Policy:

- **GitHub Issues:** https://github.com/yourusername/option-finder/issues
- **Discussions:** https://github.com/yourusername/option-finder/discussions

---

## Disclaimer

**Option Finder is a tool for informational and analytical purposes only.**

- This extension does not provide financial advice
- We are not responsible for trading decisions you make
- AI-generated analysis is not investment advice
- Always conduct your own research and due diligence
- Options trading involves significant risk

---

<div align="center">
  <sub>Your privacy is our priority. Trade safely.</sub>
</div>
