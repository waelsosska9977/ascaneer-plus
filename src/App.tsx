import React, { useCallback, useEffect, useState } from 'react';
import { BacktestView } from './components/BacktestView.tsx';
import { ChartModal } from './components/ChartModal.tsx';
import { CryptoTable } from './components/CryptoTable.tsx';
import { Footer } from './components/Footer.tsx';
import { Header } from './components/Header.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { LiveSignalsTracker } from './components/LiveSignalsTracker.tsx';
import { MarketOverviewBar } from './components/MarketOverviewBar.tsx';
import { MobileCardView } from './components/MobileCardView.tsx';
import { PerformanceView } from './components/PerformanceView.tsx';
import { RiskCalculatorModal } from './components/RiskCalculatorModal.tsx';
import { ScoreBreakdownModal } from './components/ScoreBreakdownModal.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { StockTokensModal } from './components/StockTokensModal.tsx';
import { TelegramSimulatorModal } from './components/TelegramSimulatorModal.tsx';
import { TopSetupsBanner } from './components/TopSetupsBanner.tsx';
import { WhaleFlowView } from './components/WhaleFlowView.tsx';
import { MarketOverview, ScreenerSettings, TradingSetup } from './types/crypto.ts';

// Safe JSON fetcher with timeout and resilient error handling
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // Silently return null on transient connection/restarting states
    return null;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'screener' | 'whale' | 'history' | 'performance' | 'backtest' | 'settings'>('screener');
  const [setups, setSetups] = useState<TradingSetup[]>([]);
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [settings, setSettings] = useState<ScreenerSettings | null>(null);

  const [selectedSetup, setSelectedSetup] = useState<TradingSetup | null>(null);
  const [selectedScoreSetup, setSelectedScoreSetup] = useState<TradingSetup | null>(null);
  const [isRiskCalcOpen, setIsRiskCalcOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isStockTokensModalOpen, setIsStockTokensModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(300);

  // Fetch market data safely with resilient fallback
  const loadMarketData = useCallback(async () => {
    try {
      const [oData, sData, setts] = await Promise.all([
        safeFetchJson<MarketOverview>('/api/overview'),
        safeFetchJson<TradingSetup[]>('/api/scan'),
        safeFetchJson<ScreenerSettings>('/api/settings'),
      ]);

      if (oData) {
        setOverview(oData);
        if (oData.nextScanTimestamp) {
          const rem = Math.max(0, Math.round((oData.nextScanTimestamp - Date.now()) / 1000));
          setSecondsRemaining(rem);
        }
      }

      if (Array.isArray(sData) && sData.length > 0) {
        setSetups(sData);
      }

      if (setts) {
        setSettings(setts);
      }
    } catch {
      // Quiet fail during server restart or sleep
    }
  }, []);

  useEffect(() => {
    loadMarketData();

    // Poll every 12 seconds
    const pollInterval = setInterval(() => {
      loadMarketData();
    }, 12000);

    // 1-second countdown timer for next scan
    const countdownInterval = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : (settings?.scanIntervalSeconds || 300)));
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, [loadMarketData, settings?.scanIntervalSeconds]);

  // On-demand manual scan trigger
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await safeFetchJson<{ setups?: TradingSetup[] }>('/api/scan/refresh', { method: 'POST' });
      if (data?.setups && Array.isArray(data.setups)) {
        setSetups(data.setups);
      }
      await loadMarketData();
    } catch {
      // Handled safely
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<ScreenerSettings>) => {
    try {
      const data = await safeFetchJson<ScreenerSettings>('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (data) {
        setSettings(data);
      }
    } catch {
      // Handled safely
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        marketOverview={overview}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        onOpenStockTokensModal={() => setIsStockTokensModalOpen(true)}
      />

      {/* Market Overview Statistics Banner */}
      <MarketOverviewBar
        overview={overview}
        secondsRemaining={secondsRemaining}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'screener' && (
          <>
            {/* Top Setups Spotlight */}
            <TopSetupsBanner
              setups={setups}
              onSelectSetup={setup => setSelectedSetup(setup)}
            />

            {/* Live Signals & Real-Time Trajectory Tracker */}
            <LiveSignalsTracker
              onSelectSymbol={symbol => {
                const s = setups.find(x => x.symbol === symbol);
                if (s) setSelectedSetup(s);
              }}
            />

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <CryptoTable
                setups={setups}
                onSelectSetup={setup => setSelectedSetup(setup)}
                onOpenScoreModal={setup => setSelectedScoreSetup(setup)}
                onOpenStockTokensModal={() => setIsStockTokensModalOpen(true)}
                onRefresh={handleManualRefresh}
                isRefreshing={isRefreshing}
              />
            </div>

            {/* Mobile Cards View */}
            <div className="block lg:hidden">
              <MobileCardView
                setups={setups}
                onSelectSetup={setup => setSelectedSetup(setup)}
                onOpenStockTokensModal={() => setIsStockTokensModalOpen(true)}
                onRefresh={handleManualRefresh}
                isRefreshing={isRefreshing}
              />
            </div>
          </>
        )}

        {activeTab === 'whale' && (
          <WhaleFlowView
            setups={setups}
            onSelectSetup={setup => setSelectedSetup(setup)}
          />
        )}

        {activeTab === 'history' && <HistoryView />}

        {activeTab === 'performance' && <PerformanceView />}

        {activeTab === 'backtest' && <BacktestView />}

        {activeTab === 'settings' && settings && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Interactive Candlestick Chart & Details Modal */}
      {selectedSetup && (
        <ChartModal
          setup={selectedSetup}
          onClose={() => setSelectedSetup(null)}
          onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
        />
      )}

      {/* Score Breakdown Modal */}
      {selectedScoreSetup && (
        <ScoreBreakdownModal
          setup={selectedScoreSetup}
          onClose={() => setSelectedScoreSetup(null)}
        />
      )}

      {/* Risk & Position Size Calculator Modal */}
      <RiskCalculatorModal
        isOpen={isRiskCalcOpen}
        onClose={() => setIsRiskCalcOpen(false)}
        defaultEntry={selectedSetup?.entry || 100}
        defaultSL={selectedSetup?.sl || 95}
        defaultSymbol={selectedSetup?.symbol || 'BTCUSDT'}
      />

      {/* Telegram Alert Engine & Simulator Modal */}
      {settings && (
        <TelegramSimulatorModal
          isOpen={isTelegramModalOpen}
          onClose={() => setIsTelegramModalOpen(false)}
          settings={settings}
          setups={setups}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* Binance Stock Tokens & Equities Manager Modal */}
      <StockTokensModal
        isOpen={isStockTokensModalOpen}
        onClose={() => setIsStockTokensModalOpen(false)}
        setups={setups}
        stockTokens={settings?.stockTokens || []}
        onSelectSetup={setup => setSelectedSetup(setup)}
        onRefreshSetups={handleManualRefresh}
      />

      {/* Terminal Footer */}
      <Footer />
    </div>
  );
}
