import React, { useState } from 'react';
import { Award, CheckCircle2, ChevronRight, Play, RotateCcw, ShieldAlert, Target, TrendingUp, XCircle } from 'lucide-react';
import { BacktestResult } from '../types/crypto.ts';

export const BacktestView: React.FC = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [candleLimit, setCandleLimit] = useState(250);
  const [minScore, setMinScore] = useState(70);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const handleRunBacktest = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          timeframe,
          candleLimit,
          minScore,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch {
      // Quiet fail during network reconnect
    } finally {
      setIsRunning(false);
    }
  };

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-mono">
      {/* Backtest Config Card */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Play className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Quantitative Strategy Backtest Studio
          </h2>
        </div>
        <p className="text-xs text-neutral-400 font-sans max-w-3xl leading-relaxed mb-4">
          Runs historical algorithmic setup detection candle-by-candle over actual Binance market candles with strict lookahead prevention. Evaluates real TP1/TP2 and Stop Loss milestones to compute empirical PnL and maximum drawdown.
        </p>

        {/* Parameter Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs mb-4">
          <div>
            <label className="block text-neutral-400 mb-1 text-[11px]">Symbol Pair:</label>
            <select
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="BTCUSDT">BTCUSDT (Bitcoin)</option>
              <option value="ETHUSDT">ETHUSDT (Ethereum)</option>
              <option value="SOLUSDT">SOLUSDT (Solana)</option>
              <option value="SEIUSDT">SEIUSDT (Sei)</option>
              <option value="BNBUSDT">BNBUSDT (Binance Coin)</option>
              <option value="XRPUSDT">XRPUSDT (Ripple)</option>
              <option value="SUIUSDT">SUIUSDT (Sui)</option>
              <option value="NEARUSDT">NEARUSDT (Near)</option>
              <option value="LINKUSDT">LINKUSDT (Chainlink)</option>
            </select>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1 text-[11px]">Timeframe:</label>
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="15m">15m Candles</option>
              <option value="1h">1h Candles (Recommended)</option>
              <option value="4h">4h Candles</option>
            </select>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1 text-[11px]">Historical Candles:</label>
            <select
              value={candleLimit}
              onChange={e => setCandleLimit(parseInt(e.target.value, 10))}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value={150}>150 Historical Bars</option>
              <option value={250}>250 Historical Bars</option>
              <option value={400}>400 Historical Bars</option>
            </select>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1 text-[11px]">Min Trigger Score:</label>
            <input
              type="number"
              min={50}
              max={95}
              value={minScore}
              onChange={e => setMinScore(parseInt(e.target.value, 10) || 70)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunBacktest}
              disabled={isRunning}
              className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Simulating...' : 'Run Backtest'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5">
              <div className="text-neutral-500 text-[11px] mb-1">Setups Identified</div>
              <div className="text-xl font-bold text-white">{result.totalSetups}</div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5">
              <div className="text-neutral-500 text-[11px] mb-1">TP1 Win Rate</div>
              <div className="text-xl font-bold text-emerald-400">{result.winRateTP1}%</div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5">
              <div className="text-neutral-500 text-[11px] mb-1">Total Return PnL</div>
              <div className={`text-xl font-bold ${result.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.totalPnL >= 0 ? '+' : ''}{result.totalPnL}%
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5">
              <div className="text-neutral-500 text-[11px] mb-1">Max Drawdown</div>
              <div className="text-xl font-bold text-rose-400">-{result.maxDrawdown}%</div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5">
              <div className="text-neutral-500 text-[11px] mb-1">Average R-Multiple</div>
              <div className="text-xl font-bold text-cyan-400">+{result.averageR}R</div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5">
              <div className="text-neutral-500 text-[11px] mb-1">Candles Tested</div>
              <div className="text-xl font-bold text-neutral-300">{result.candleCount}</div>
            </div>
          </div>

          {/* Trade Journal Table */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase tracking-wider">
                Simulated Trade Log ({result.trades.length} executions)
              </span>
              <span className="text-neutral-400">
                TP1: {result.tp1Hits} | TP2: {result.tp2Hits} | SL: {result.slHits}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/60 text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Entry</th>
                    <th className="py-2.5 px-3">TP1</th>
                    <th className="py-2.5 px-3">TP2</th>
                    <th className="py-2.5 px-3">SL</th>
                    <th className="py-2.5 px-3">Exit Price</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">R-Multiple</th>
                    <th className="py-2.5 px-3 text-right">PnL %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 font-mono text-neutral-300">
                  {result.trades.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-neutral-500 font-sans">
                        No setups triggered with the selected minimum score of {minScore}/100 in the {result.candleCount} candle historical window. Try lowering the threshold or selecting a longer candle window.
                      </td>
                    </tr>
                  ) : (
                    result.trades.map(trade => {
                      const dateStr = new Date(trade.entryTimestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const isWin = trade.outcome === 'TP1 Hit' || trade.outcome === 'TP2 Hit';

                      return (
                        <tr key={trade.id} className="hover:bg-neutral-900/40 transition-colors">
                          <td className="py-2 px-3 whitespace-nowrap text-neutral-500 text-[11px]">
                            {dateStr}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={trade.type === 'LONG' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {trade.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-white">
                            ${formatPrice(trade.entryPrice)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-emerald-400">
                            ${formatPrice(trade.tp1)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-emerald-500">
                            ${formatPrice(trade.tp2)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-rose-400">
                            ${formatPrice(trade.sl)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-neutral-300">
                            ${formatPrice(trade.exitPrice)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isWin
                                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                                  : 'bg-rose-950 border border-rose-800 text-rose-400'
                              }`}
                            >
                              {trade.outcome}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-cyan-400">
                            {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple}R
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-right font-bold">
                            <span className={trade.pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
