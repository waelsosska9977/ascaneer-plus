import React from 'react';
import { Calculator, RefreshCw, Send } from 'lucide-react';
import { MarketOverview } from '../types/crypto.ts';

interface HeaderProps {
  activeTab: 'screener' | 'whale' | 'history' | 'performance' | 'backtest' | 'settings';
  setActiveTab: (tab: 'screener' | 'whale' | 'history' | 'performance' | 'backtest' | 'settings') => void;
  marketOverview: MarketOverview | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenRiskCalc: () => void;
  onOpenTelegramModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  marketOverview,
  onRefresh,
  isRefreshing,
  onOpenRiskCalc,
  onOpenTelegramModal,
}) => {
  const statusColor = marketOverview?.dataProviderStatus === 'LIVE'
    ? 'bg-emerald-500'
    : marketOverview?.dataProviderStatus === 'DELAYED'
    ? 'bg-amber-500'
    : 'bg-rose-500';

  const statusText = marketOverview?.dataProviderStatus || 'CONNECTING';

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('screener')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-base sm:text-lg font-bold tracking-tight text-white font-mono group-hover:text-emerald-400 transition-colors">
              SOSSKA CRYPTO SCREENER V2
            </span>
          </button>
          
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900/80 text-[10px] font-mono text-neutral-400">
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor} ${isRefreshing ? 'animate-ping' : ''}`} />
            <span>{statusText}</span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-neutral-400">
          <button
            onClick={() => setActiveTab('screener')}
            className={`transition-colors hover:text-white whitespace-nowrap ${
              activeTab === 'screener' ? 'text-emerald-400 font-semibold border-b border-emerald-400 pb-0.5' : ''
            }`}
          >
            Screener
          </button>
          <button
            onClick={() => setActiveTab('whale')}
            className={`transition-colors hover:text-white whitespace-nowrap ${
              activeTab === 'whale' ? 'text-emerald-400 font-semibold border-b border-emerald-400 pb-0.5' : ''
            }`}
          >
            Whale Flow
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`transition-colors hover:text-white whitespace-nowrap ${
              activeTab === 'history' ? 'text-emerald-400 font-semibold border-b border-emerald-400 pb-0.5' : ''
            }`}
          >
            Signal History
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`transition-colors hover:text-white whitespace-nowrap ${
              activeTab === 'performance' ? 'text-emerald-400 font-semibold border-b border-emerald-400 pb-0.5' : ''
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveTab('backtest')}
            className={`transition-colors hover:text-white whitespace-nowrap ${
              activeTab === 'backtest' ? 'text-emerald-400 font-semibold border-b border-emerald-400 pb-0.5' : ''
            }`}
          >
            Backtest
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`transition-colors hover:text-white whitespace-nowrap ${
              activeTab === 'settings' ? 'text-emerald-400 font-semibold border-b border-emerald-400 pb-0.5' : ''
            }`}
          >
            Settings
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenTelegramModal}
            title="Telegram Bot Integration & Commands"
            className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-md hover:border-neutral-700 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Telegram</span>
          </button>

          <button
            onClick={onOpenRiskCalc}
            title="Risk Management & Position Size Calculator"
            className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-md hover:border-neutral-700 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Risk Calc</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">{isRefreshing ? 'Scanning...' : 'Scan Now'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-2 border-t border-neutral-900 gap-4 text-xs font-medium text-neutral-400 scrollbar-none">
        <button
          onClick={() => setActiveTab('screener')}
          className={`whitespace-nowrap ${activeTab === 'screener' ? 'text-emerald-400 font-semibold' : ''}`}
        >
          Screener
        </button>
        <button
          onClick={() => setActiveTab('whale')}
          className={`whitespace-nowrap ${activeTab === 'whale' ? 'text-emerald-400 font-semibold' : ''}`}
        >
          Whale Flow
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`whitespace-nowrap ${activeTab === 'history' ? 'text-emerald-400 font-semibold' : ''}`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`whitespace-nowrap ${activeTab === 'performance' ? 'text-emerald-400 font-semibold' : ''}`}
        >
          Performance
        </button>
        <button
          onClick={() => setActiveTab('backtest')}
          className={`whitespace-nowrap ${activeTab === 'backtest' ? 'text-emerald-400 font-semibold' : ''}`}
        >
          Backtest
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`whitespace-nowrap ${activeTab === 'settings' ? 'text-emerald-400 font-semibold' : ''}`}
        >
          Settings
        </button>
      </div>
    </header>
  );
};
