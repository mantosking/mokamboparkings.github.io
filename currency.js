// ============================================
// CURRENCY.JS - Gestion des devises
// ============================================

class CurrencyManager {
    constructor() {
        this.currencies = {
            CDF: {
                code: 'CDF',
                symbol: 'FC',
                name: 'Franc Congolais',
                flag: '🇨🇩',
                rate: 1
            },
            USD: {
                code: 'USD',
                symbol: '$',
                name: 'Dollar Américain',
                flag: '🇺🇸',
                rate: 2700
            }
        };
        
        const savedRates = localStorage.getItem('mokamboExchangeRates');
        if (savedRates) {
            const rates = JSON.parse(savedRates);
            if (rates.USD) this.currencies.USD = rates.USD;
        }
        
        this.currentCurrency = localStorage.getItem('mokamboCurrency') || 'USD';
    }

    formatPrice(amount, currencyCode = null) {
        const currency = this.currencies[currencyCode || this.currentCurrency];
        const convertedAmount = this.convert(amount, 'CDF', currencyCode || this.currentCurrency);
        
        if (currency.code === 'CDF') {
            return `${convertedAmount.toLocaleString('fr-CD')} ${currency.symbol}`;
        } else {
            return `${currency.symbol}${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
        }
    }

    convert(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;
        const fromRate = this.currencies[fromCurrency].rate;
        const toRate = this.currencies[toCurrency].rate;
        return (amount * fromRate) / toRate;
    }

    setCurrency(currencyCode) {
        if (this.currencies[currencyCode]) {
            this.currentCurrency = currencyCode;
            localStorage.setItem('mokamboCurrency', currencyCode);
            return true;
        }
        return false;
    }

    getCurrentCurrency() {
        return this.currencies[this.currentCurrency];
    }

    updateExchangeRate(currencyCode, newRate) {
        if (this.currencies[currencyCode] && newRate > 0) {
            this.currencies[currencyCode].rate = newRate;
            localStorage.setItem('mokamboExchangeRates', JSON.stringify(this.currencies));
            return true;
        }
        return false;
    }

    displayPriceInBoth(amountInCDF) {
        return {
            CDF: this.formatPrice(amountInCDF, 'CDF'),
            USD: this.formatPrice(amountInCDF, 'USD')
        };
    }
}

const currencyManager = new CurrencyManager();