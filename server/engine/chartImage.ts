import { Candle, TradingSetup } from '../../src/types/crypto.ts';
import { fetchKlines } from '../data/binance.ts';

function calculateEMA(prices: number[], period: number): (number | null)[] {
  if (prices.length < period) return prices.map(() => null);
  const k = 2 / (period + 1);
  const result: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += prices[i];
  let ema = sum / period;
  for (let i = 0; i < period - 1; i++) result.push(null);
  result.push(ema);
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * k + ema;
    result.push(ema);
  }
  return result;
}

function formatPriceNumber(val: number): string {
  if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val >= 1) return val.toFixed(3);
  if (val >= 0.01) return val.toFixed(4);
  return val.toFixed(6);
}

export async function generateChartImageBuffer(
  setup: TradingSetup,
  inputCandles?: Candle[]
): Promise<Buffer | null> {
  try {
    let candles = inputCandles;
    if (!candles || candles.length < 10) {
      candles = await fetchKlines(setup.symbol, '15m', 35);
    }

    if (!candles || candles.length === 0) {
      return null;
    }

    // Limit to latest 30 candles for optimal candle width and readability
    const sliceCandles = candles.slice(-30);
    const closePrices = sliceCandles.map(c => c.close);
    const ema9Values = calculateEMA(closePrices, 9);
    const ema21Values = calculateEMA(closePrices, 21);

    const candleData = sliceCandles.map((c, i) => {
      const d = new Date(c.timestamp);
      const timeStr = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
      return {
        x: timeStr,
        o: Number(c.open.toFixed(6)),
        h: Number(c.high.toFixed(6)),
        l: Number(c.low.toFixed(6)),
        c: Number(c.close.toFixed(6)),
      };
    });

    const firstX = candleData[0].x;
    const lastX = candleData[candleData.length - 1].x;

    const isLong = setup.state === 'CONFIRMED_LONG';
    const entryLabel = `Entry: $${formatPriceNumber(setup.entry)}`;
    const tp1Label = `TP1: $${formatPriceNumber(setup.tp1)}`;
    const tp2Label = `TP2: $${formatPriceNumber(setup.tp2)}`;
    const slLabel = `SL: $${formatPriceNumber(setup.sl)}`;

    const chartConfig = {
      type: 'candlestick',
      data: {
        datasets: [
          {
            type: 'candlestick',
            label: `${setup.symbol} 15M`,
            data: candleData,
            color: {
              up: '#10b981',
              down: '#ef4444',
              unchanged: '#64748b',
            },
          },
          {
            type: 'line',
            label: 'EMA 9',
            borderColor: '#38bdf8',
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            data: sliceCandles.map((c, i) => ({
              x: candleData[i].x,
              y: ema9Values[i] !== null ? Number(ema9Values[i]!.toFixed(6)) : undefined,
            })).filter(pt => pt.y !== undefined),
          },
          {
            type: 'line',
            label: 'EMA 21',
            borderColor: '#f59e0b',
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            data: sliceCandles.map((c, i) => ({
              x: candleData[i].x,
              y: ema21Values[i] !== null ? Number(ema21Values[i]!.toFixed(6)) : undefined,
            })).filter(pt => pt.y !== undefined),
          },
          {
            type: 'line',
            label: tp2Label,
            borderColor: '#10b981',
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            data: [
              { x: firstX, y: setup.tp2 },
              { x: lastX, y: setup.tp2 },
            ],
          },
          {
            type: 'line',
            label: tp1Label,
            borderColor: '#22c55e',
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            data: [
              { x: firstX, y: setup.tp1 },
              { x: lastX, y: setup.tp1 },
            ],
          },
          {
            type: 'line',
            label: entryLabel,
            borderColor: '#0284c7',
            borderDash: [4, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            data: [
              { x: firstX, y: setup.entry },
              { x: lastX, y: setup.entry },
            ],
          },
          {
            type: 'line',
            label: slLabel,
            borderColor: '#f43f5e',
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            data: [
              { x: firstX, y: setup.sl },
              { x: lastX, y: setup.sl },
            ],
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: `⚡ ${setup.symbol} • ${isLong ? 'LONG 🟢' : 'SHORT 🔴'} (${setup.setupType}) | Score: ${setup.score}/100`,
          fontColor: '#ffffff',
          fontSize: 15,
          fontStyle: 'bold',
          padding: 12,
        },
        legend: {
          display: true,
          labels: {
            fontColor: '#cbd5e1',
            boxWidth: 14,
            fontSize: 11,
          },
        },
        scales: {
          xAxes: [
            {
              gridLines: { color: 'rgba(255, 255, 255, 0.08)' },
              ticks: { fontColor: '#94a3b8', fontSize: 10, maxTicksLimit: 12 },
            },
          ],
          yAxes: [
            {
              position: 'right',
              gridLines: { color: 'rgba(255, 255, 255, 0.08)' },
              ticks: { fontColor: '#94a3b8', fontSize: 11 },
            },
          ],
        },
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch('https://quickchart.io/chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chart: chartConfig,
        width: 860,
        height: 480,
        backgroundColor: '#0a0d14',
        version: '3',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`QuickChart returned status ${res.status} for ${setup.symbol}`);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err: any) {
    console.warn(`Failed to generate chart image for ${setup.symbol}:`, err.message);
    return null;
  }
}
