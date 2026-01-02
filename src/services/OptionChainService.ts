import type { OptionChainData, OptionContract } from './messageTypes';

export class OptionChainService {
    /**
     * Calculates statistics from raw option chain data
     */
    public static calculateStats(data: OptionChainData) {
        const totalVolume = data.strikes.reduce((sum, c) => sum + c.volume, 0);
        const totalOI = data.strikes.reduce((sum, c) => sum + c.openInterest, 0);

        const callVolume = data.strikes.filter(c => c.type === 'call').reduce((sum, c) => sum + c.volume, 0);
        const putVolume = data.strikes.filter(c => c.type === 'put').reduce((sum, c) => sum + c.volume, 0);

        const pcr = callVolume > 0 ? putVolume / callVolume : 0;

        // Days to Expiration
        const dte = this.calculateDTE(data.expirationDate);

        return {
            totalVolume,
            totalOI,
            callVolume,
            putVolume,
            pcr,
            dte
        };
    }

    /**
     * Calculates Days To Expiration
     */
    public static calculateDTE(expStr: string): number {
        if (!expStr) return 0;
        try {
            const expDate = new Date(expStr);
            if (isNaN(expDate.getTime())) return 0;

            const now = new Date();
            now.setHours(0, 0, 0, 0);
            expDate.setHours(0, 0, 0, 0);

            const diffTime = expDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 ? diffDays : 0;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Approximate Delta calculation using Black-Scholes
     */
    public static calculateDelta(strike: number, spot: number, dte: number, iv: number, type: 'call' | 'put'): number {
        // Debug logging for delta calculation
        const debugLog = false; // Set to true for debugging
        if (debugLog) {
            console.log(`📐 calculateDelta inputs:`, { strike, spot, dte, iv, type });
        }

        // Guard against zero or negative inputs which crash the log/sqrt functions
        if (dte <= 0 || iv <= 0 || spot <= 0 || isNaN(iv) || isNaN(spot)) {
            const fallbackDelta = type === 'call' ? (spot >= strike ? 1 : 0) : (spot <= strike ? -1 : 0);
            if (debugLog) {
                console.warn(`⚠️ Delta fallback used (dte=${dte}, iv=${iv}, spot=${spot}). Returning ${fallbackDelta}`);
            }
            return fallbackDelta;
        }

        // Yahoo Finance IV data quality note:
        // According to research, Yahoo Finance's IV calculations have known issues.
        // However, we should NOT arbitrarily replace low IV values, as deep OTM options
        // naturally have low delta values when IV is low (this is mathematically correct).
        // We only use the original IV value provided by Yahoo Finance.
        const T = dte / 365;
        const sigma = iv / 100;
        const r = 0.04; // Assume 4% risk-free rate

        try {
            const d1 = (Math.log(spot / strike) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));

            const normSDist = (x: number) => {
                const b1 = 0.319381530;
                const b2 = -0.356563782;
                const b3 = 1.781477937;
                const b4 = -1.821255978;
                const b5 = 1.330274429;
                const p = 0.2316419;
                const c = 0.39894228;

                const absX = Math.abs(x);
                const t = 1.0 / (1.0 + p * absX);
                const y = 1.0 - c * Math.exp(-absX * absX / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);

                return x >= 0 ? y : 1.0 - y;
            };

            const delta = normSDist(d1);
            const result = type === 'call' ? delta : delta - 1;

            if (debugLog) {
                console.log(`✅ Delta calculated: ${result.toFixed(4)} (d1=${d1.toFixed(4)}, sigma=${sigma.toFixed(4)}, IV=${iv}%)`);
            }

            return isNaN(result) ? 0 : result;
        } catch (e) {
            const fallbackDelta = type === 'call' ? (spot >= strike ? 1 : 0) : (spot <= strike ? -1 : 0);
            console.error(`❌ Delta calculation error:`, e, `Returning fallback: ${fallbackDelta}`);
            return fallbackDelta;
        }
    }

    /**
     * Calculates Annualized Return (Yield)
     * For Cash Secured Puts: (Premium / Strike) * (365 / DTE)
     * For Covered Calls: (Premium / Underlying) * (365 / DTE) -- simplified to Strike here for consistency
     */
    public static calculateAnnualizedReturn(premium: number, collateral: number, dte: number): number {
        if (collateral <= 0 || dte <= 0) return 0;
        const rawReturn = premium / collateral;
        const annualized = rawReturn * (365 / dte);
        return annualized * 100; // Return as percentage
    }

    /**
     * Prepares data for charts (grouped by strike)
     */
    public static prepareChartData(data: OptionChainData) {
        const strikeMap: Record<number, {
            strike: number,
            volume: number,
            oi: number,
            price: number,
            iv: number,
            inTheMoney: boolean,
            hasCall: boolean,
            hasPut: boolean,
            callDelta: number,
            putDelta: number,
            change: number,
            percentChange: number,
            count: number,
            yield: number
        }> = {};
        const dte = this.calculateDTE(data.expirationDate);

        data.strikes.forEach(c => {
            if (!strikeMap[c.strike]) {
                strikeMap[c.strike] = {
                    strike: c.strike,
                    volume: 0,
                    oi: 0,
                    price: 0,
                    iv: 0,
                    inTheMoney: false,
                    hasCall: false,
                    hasPut: false,
                    callDelta: 0,
                    putDelta: 0,
                    change: 0,
                    percentChange: 0,
                    count: 0,
                    yield: 0
                };
            }
            strikeMap[c.strike].volume += c.volume;
            strikeMap[c.strike].oi += c.openInterest;

            // Only mark strike as ITM if the specific contract type says so
            if (c.inTheMoney) {
                strikeMap[c.strike].inTheMoney = true;
            }

            // Use maximum premium price for curve height
            strikeMap[c.strike].price = Math.max(strikeMap[c.strike].price, c.lastPrice);

            // Collect IV and Chg
            if (c.impliedVolatility > 0) {
                strikeMap[c.strike].iv = (strikeMap[c.strike].iv > 0)
                    ? (strikeMap[c.strike].iv + c.impliedVolatility) / 2
                    : c.impliedVolatility;
            }

            // For change, we average or take the most representative
            strikeMap[c.strike].change += c.change;
            strikeMap[c.strike].percentChange += c.percentChange;
            strikeMap[c.strike].count += 1;

            if (c.type === 'call') {
                strikeMap[c.strike].hasCall = true;
                // Use contract's IV, or strike's averaged IV, or fallback to 30% (typical default)
                const effectiveIV = c.impliedVolatility || strikeMap[c.strike].iv || 30;
                strikeMap[c.strike].callDelta = this.calculateDelta(c.strike, data.price, dte, effectiveIV, 'call');
            } else {
                strikeMap[c.strike].hasPut = true;
                // Use contract's IV, or strike's averaged IV, or fallback to 30% (typical default)
                const effectiveIV = c.impliedVolatility || strikeMap[c.strike].iv || 30;
                strikeMap[c.strike].putDelta = this.calculateDelta(c.strike, data.price, dte, effectiveIV, 'put');
            }

            // Calculate Yield (using Strike as collateral basis)
            // We use the MAX price found so far for this strike to approximate the best yield
            strikeMap[c.strike].yield = this.calculateAnnualizedReturn(strikeMap[c.strike].price, c.strike, dte);
        });

        return Object.values(strikeMap).map(s => ({
            ...s,
            change: s.count > 0 ? s.change / s.count : 0,
            percentChange: s.count > 0 ? s.percentChange / s.count : 0
        })).sort((a, b) => a.strike - b.strike);
    }

    /**
     * Formats data for AI prompt
     */
    public static formatForAI(data: OptionChainData): string {
        const stats = this.calculateStats(data);
        const topVolume = [...data.strikes].sort((a, b) => b.volume - a.volume).slice(0, 10);
        const topOI = [...data.strikes].sort((a, b) => b.openInterest - a.openInterest).slice(0, 10);

        return JSON.stringify({
            symbol: data.symbol,
            spotPrice: data.price,
            expiration: data.expirationDate,
            dte: stats.dte,
            summary: {
                totalVolume: stats.totalVolume,
                putCallRatio: stats.pcr.toFixed(2),
                callVolume: stats.callVolume,
                putVolume: stats.putVolume,
            },
            topActivity: topVolume.map(c => ({
                strike: c.strike,
                volume: c.volume,
                oi: c.openInterest,
                iv: c.impliedVolatility,
                type: c.type,
                itm: c.inTheMoney
            })),
            openInterestStructure: topOI.map(c => ({
                strike: c.strike,
                oi: c.openInterest,
                type: c.type,
                itm: c.inTheMoney
            }))
        }, null, 2);
    }

    /**
     * Extracts symbol and date from Yahoo Finance Options URL
     */
    public static parseUrl(url: string): { symbol?: string; date?: string } {
        try {
            const urlObj = new URL(url);
            // Matches /quote/SYMBOL/options
            const symbolMatch = urlObj.pathname.match(/\/quote\/([^\/]+)\/options/);
            const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : undefined;
            const date = urlObj.searchParams.get('date') || undefined;

            return { symbol, date };
        } catch (e) {
            return { symbol: undefined, date: undefined };
        }
    }
}
