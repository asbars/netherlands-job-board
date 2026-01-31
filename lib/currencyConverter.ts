/**
 * Currency Conversion Service
 * Uses Frankfurter API (European Central Bank rates)
 * Free, no API key required
 */

export const SUPPORTED_CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
];

interface ExchangeRateResponse {
  amount: number;
  base: string;
  date: string;
  rates: { [key: string]: number };
}

/**
 * Fetch exchange rate from one currency to another
 * @param from Source currency code (e.g., 'EUR')
 * @param to Target currency code (e.g., 'USD')
 * @returns Exchange rate (1 FROM = X TO)
 */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  // If same currency, rate is 1
  if (from === to) {
    return 1;
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
    }

    const data: ExchangeRateResponse = await response.json();

    if (!data.rates || !data.rates[to]) {
      throw new Error(`Exchange rate not found for ${from} to ${to}`);
    }

    return data.rates[to];
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error;
  }
}

/**
 * Get exchange rates from one currency to multiple target currencies
 * @param from Source currency code
 * @param toCurrencies Array of target currency codes
 * @returns Map of currency code to exchange rate
 */
export async function getExchangeRates(
  from: string,
  toCurrencies: string[]
): Promise<Map<string, number>> {
  const rates = new Map<string, number>();

  // If only one target or all same as source, skip API call
  if (toCurrencies.length === 0) {
    return rates;
  }

  // Filter out same-currency conversions
  const differentCurrencies = toCurrencies.filter((to) => to !== from);
  if (differentCurrencies.length === 0) {
    // All are same currency
    toCurrencies.forEach((to) => rates.set(to, 1));
    return rates;
  }

  try {
    const toParam = differentCurrencies.join(',');
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${toParam}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }

    const data: ExchangeRateResponse = await response.json();

    // Add fetched rates
    Object.entries(data.rates).forEach(([currency, rate]) => {
      rates.set(currency, rate);
    });

    // Add same-currency rate
    rates.set(from, 1);

    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
}

/**
 * Convert amount from one currency to another
 * @param amount Amount to convert
 * @param from Source currency code
 * @param to Target currency code
 * @param rate Optional pre-fetched exchange rate
 * @returns Converted amount
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rate?: number
): Promise<number> {
  if (from === to) {
    return amount;
  }

  const exchangeRate = rate ?? (await getExchangeRate(from, to));
  return amount * exchangeRate;
}

/**
 * Format currency with symbol
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;

  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
