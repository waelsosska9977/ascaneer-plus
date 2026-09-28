import React, { useCallback, useEffect, useState } from 'react';
import { BacktestView } from './components/BacktestView.tsx';
import { ChartModal } from './components/ChartModal.tsx';
import { CryptoTable } from './components/CryptoTable.tsx';
import { Footer } from './components/Footer.tsx';
import { Header } from './components/Header.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { MarketOverviewBar } from './components/MarketOverviewBar.tsx';
import { MobileCardView } from './components/MobileCardView.tsx';
import { PerformanceView } from './components/PerformanceView.tsx';
import { RiskCalculatorModal } from './components/RiskCalculatorModal.tsx';
import { ScoreBreakdownModal } from './components/ScoreBreakdownModal.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { TelegramSimulatorModal } from './components/TelegramSimulatorModal.tsx';
import { TopSetupsBanner } from './components/TopSetupsBanner.tsx';
import { WhaleFlowView } from './components/WhaleFlowView.tsx';
import { MarketOverview, ScreenerSettings, TradingSetup } from './types/crypto.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'screener' | 'whale' | 'history' | 'performance' | 'backtest' | 'settings'>('screener');
  const [setups, setSetups] = useState<TradingSetup[]>([]);
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [settings, setSettings] = useState<ScreenerSettings | null>(null);

  const [selectedSetup, setSelectedSetup] = useState<TradingSetup | null>(null);
  const [selectedScoreSetup, setSelectedScoreSetup] = useState<TradingSetup | null>(null);
  const [isRiskCalcOpen, setIsRiskCalcOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  // Fetch initial data
  const loadMarketData = useCallback(async () => {
    try {
      const [overviewRes, scanRes, settingsRes] = await Promise.all([
        fetch('/api/overview'),
        fetch('/api/scan'),
        fetch('/api/settings'),
      ]);

      if (overviewRes.ok) {
        const oData = await overviewRes.json();
        setOverview(oData);
        if (oData.nextScanTimestamp) {
          const rem = Math.max(0, Math.round((oData.nextScanTimestamp - Date.now()) / 1000));
          setSecondsRemaining(rem);
        }
      }

      if (scanRes.ok) {
        const sData = await scanRes.json();
        if (Array.isArray(sData)) setSetups(sData);
      }

      if (settingsRes.ok) {
        const setts = await settingsRes.json();
        setSettings(setts);
      }
    } catch (err) {
      console.error('Error loading market data:', err);
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
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 60));
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, [loadMarketData]);

  // On-demand manual scan trigger
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/scan/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.setups) {
        setSetups(data.setups);
      }
      await loadMarketData();
    } catch (err) {
      console.error('Error refreshing scan:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<ScreenerSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error('Error updating settings:', err);
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
      />

      {/* Market Overview Statistics Banner */}
      <MarketOverviewBar
        overview={overview}
        secondsRemaining={secondsRemaining}
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

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <CryptoTable
                setups={setups}
                onSelectSetup={setup => setSelectedSetup(setup)}
                onOpenScoreModal={setup => setSelectedScoreSetup(setup)}
              />
            </div>

            {/* Mobile Cards View */}
            <div className="block lg:hidden">
              <MobileCardView
                setups={setups}
                onSelectSetup={setup => setSelectedSetup(setup)}
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

      {/* Terminal Footer */}
      <Footer />
    </div>
  );
}
