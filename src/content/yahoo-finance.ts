import type { OptionChainData, OptionContract } from '../services/messageTypes';

console.log('Yahoo Finance Option Finder Loaded');

// Helper to clean price strings (e.g., "1,234.56" -> 1234.56)
const parseNumber = (text: string): number => {
    if (!text || text === '-') return 0;
    const val = parseFloat(text.replace(/,/g, '').replace('+', ''));
    return isNaN(val) ? 0 : val;
};

const extractOptionChain = (): OptionChainData | null => {
    console.log('Starting Refined Option Chain Extraction...');

    // 1. Find the table.
    const tables = document.querySelectorAll('table');
    let targetTable: HTMLTableElement | null = null;
    let headerIndexMap: Record<string, number> = {};

    for (const table of Array.from(tables)) {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
        if (headers.includes('Strike') && headers.includes('Bid') && headers.includes('Ask')) {
            targetTable = table;
            headers.forEach((h, i) => headerIndexMap[h] = i);
            break;
        }
    }

    if (!targetTable) {
        console.warn('Option Chain table not found.');
        return null;
    }

    // 2. Get Underlying Symbol and Price
    let symbol = 'Unknown';
    let price = 0;
    // Target the main header specifically using multiple potential selectors including the ones from the snippet
    const headerElement =
        document.querySelector('[data-testid="quote-hdr"]') ||
        document.getElementById('quote-header-info') ||
        document.querySelector('[data-test="quote-header"]');

    if (headerElement) {
        // Robust Symbol Extraction
        const symbolFin = headerElement.querySelector('fin-streamer[data-symbol]');
        if (symbolFin) {
            symbol = symbolFin.getAttribute('data-symbol') || 'Unknown';
        } else {
            const h1 = headerElement.querySelector('h1');
            if (h1) {
                const match = h1.textContent?.match(/\(([^)]+)\)/);
                if (match) {
                    symbol = match[1];
                } else {
                    // Try to extract from the h1 text directly if no parentheses
                    symbol = h1.textContent?.split(' ').pop()?.replace(/[()]/g, '') || 'Unknown';
                }
            }
        }

        // Robust Price Extraction using snippet selectors
        const priceSelectors = [
            '[data-testid="qsp-price"]',
            'fin-streamer[data-field="regularMarketPrice"]',
            '[data-field="regularMarketPrice"]',
            '.livePrice span'
        ];

        for (const sel of priceSelectors) {
            const el = headerElement.querySelector(sel) || document.querySelector(sel);
            if (el) {
                const val = el.getAttribute('value') || el.textContent?.replace(/,/g, '');
                if (val) {
                    const p = parseFloat(val);
                    if (!isNaN(p) && p > 0) {
                        price = p;
                        break;
                    }
                }
            }
        }
    }

    // Fallbacks if header selector failed or provided incomplete data
    if (symbol === 'Unknown' || price === 0) {
        // Limited fallbacks, still avoiding global sidebars
        const mainContent = document.getElementById('main-0-Symbol-Proxy') || document.querySelector('main');
        if (mainContent) {
            if (price === 0) {
                const pEl = mainContent.querySelector('fin-streamer[data-field="regularMarketPrice"]');
                if (pEl) price = parseFloat(pEl.getAttribute('value') || '0');
            }
        }
    }

    // 3. Get Expiration Date
    let expirationDate = '';
    const dateSelectors = [
        'div[data-test="dropdown"] span',
        'section .active span',
        '#option_dates option[selected]'
    ];
    for (const selector of dateSelectors) {
        const sel = document.querySelector(selector);
        if (sel) {
            const text = sel.textContent || (sel as HTMLOptionElement).label || '';
            if (/^[A-Z][a-z]{2}\s\d{1,2},\s\d{4}$/.test(text.trim())) {
                expirationDate = text.trim();
                break;
            }
        }
    }

    if (!expirationDate) {
        const firstContract = targetTable.querySelector('tbody tr td:first-child')?.textContent || '';
        const dateMatch = firstContract.match(/[A-Z]+(\d{6})[CP]/);
        if (dateMatch) {
            const yy = dateMatch[1].substring(0, 2);
            const mm = dateMatch[1].substring(2, 4);
            const dd = dateMatch[1].substring(4, 6);
            expirationDate = `20${yy}-${mm}-${dd}`;
        }
    }

    const rows = Array.from(targetTable.querySelectorAll('tbody tr'));
    const strikes: OptionContract[] = [];

    for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) continue;

        const getText = (colName: string) => {
            const idx = headerIndexMap[colName];
            if (idx !== undefined && cells[idx]) {
                return cells[idx].textContent?.trim() || '';
            }
            return '';
        };

        const contractName = getText('Contract Name');
        const strikeStr = getText('Strike');
        const lastPriceStr = getText('Last Price');
        const bidStr = getText('Bid');
        const askStr = getText('Ask');
        const changeStr = getText('Change');
        const percentChangeStr = getText('% Change');
        const volStr = getText('Volume');
        const oiStr = getText('Open Interest');
        const ivStr = getText('Implied Volatility');

        let type: 'call' | 'put' = 'call';
        const match = contractName.match(/[A-Za-z]+(\d{6})([CP])(\d{8})/);
        if (match) {
            type = match[2] === 'C' ? 'call' : 'put';
        }

        const strike = parseNumber(strikeStr);
        const lastPrice = parseNumber(lastPriceStr);

        // Robust ITM check: Compare strike to price + check backdrop classes
        // Calls: ITM if Stock Price > Strike
        // Puts: ITM if Stock Price < Strike
        const mathITM = type === 'call' ? (price > strike) : (price < strike);
        const cssITM = row.classList.contains('in-the-money') ||
            row.getAttribute('class')?.includes('in-the-money') ||
            row.querySelector('.in-the-money'); // Sometimes class is on a cell

        const inTheMoney = !!(mathITM || cssITM);

        strikes.push({
            strike,
            contractName,
            lastPrice,
            bid: parseNumber(bidStr),
            ask: parseNumber(askStr),
            change: parseNumber(changeStr),
            percentChange: parseNumber(percentChangeStr.replace('%', '')),
            volume: parseNumber(volStr),
            openInterest: parseNumber(oiStr),
            impliedVolatility: parseNumber(ivStr.replace('%', '').replace(',', '')),
            type,
            inTheMoney,
        });
    }

    return {
        symbol,
        price,
        expirationDate,
        strikes,
        timestamp: Date.now()
    };
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'PING') {
        sendResponse({ status: 'OK' });
    } else if (request.action === 'SCAN_OPTION_CHAIN') {
        const data = extractOptionChain();
        if (data && data.strikes.length > 0) {
            chrome.runtime.sendMessage({
                action: 'optionChainReceived',
                data: { timestamp: Date.now(), content: data }
            });
            sendResponse({ success: true, count: data.strikes.length });
        } else {
            sendResponse({ success: false, error: 'Table or data not found' });
        }
    }
});
