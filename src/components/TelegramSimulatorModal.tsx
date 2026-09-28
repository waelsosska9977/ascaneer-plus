import React, { useState } from 'react';
import { Bot, Check, Copy, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { ScreenerSettings, TradingSetup } from '../types/crypto.ts';

interface TelegramSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ScreenerSettings;
  setups: TradingSetup[];
  onUpdateSettings: (newSettings: Partial<ScreenerSettings>) => void;
}

export const TelegramSimulatorModal: React.FC<TelegramSimulatorModalProps> = ({
  isOpen,
  onClose,
  settings,
  setups,
  onUpdateSettings,
}) => {
  const [botToken, setBotToken] = useState(settings.telegramBotToken || '');
  const [chatId, setChatId] = useState(settings.telegramChatId || '');
  const [commandInput, setCommandInput] = useState('/top');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'bot'; text: string; time: string }[]>([
    {
      sender: 'bot',
      text: `👋 Welcome to SOSSKA Crypto Screener V2 Bot!\n\nSend /top, /long, /short, or /scan to test commands.`,
      time: new Date().toLocaleTimeString(),
    },
  ]);

  if (!isOpen) return null;

  const handleSaveCredentials = () => {
    onUpdateSettings({
      telegramBotToken: botToken,
      telegramChatId: chatId,
      enableTelegram: true,
    });
    setTestResult({ success: true, message: 'Telegram credentials saved to Screener settings.' });
  };

  const handleSendTestAlert = async () => {
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken, chatId }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commandInput.trim()) return;

    const userMsg = commandInput.trim();
    const time = new Date().toLocaleTimeString();

    setChatLog(prev => [...prev, { sender: 'user', text: userMsg, time }]);
    setCommandInput('');

    try {
      const res = await fetch('/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: userMsg }),
      });
      const data = await res.json();
      setChatLog(prev => [
        ...prev,
        { sender: 'bot', text: data.reply || 'No response', time: new Date().toLocaleTimeString() },
      ]);
    } catch {
      setChatLog(prev => [
        ...prev,
        { sender: 'bot', text: 'Error executing bot command.', time: new Date().toLocaleTimeString() },
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-5 font-mono text-neutral-200 my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Telegram Bot Alert Engine & Command Simulator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content split in 2 columns: Credentials/Settings on left, Simulator on right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto pr-1">
          {/* Left Column: API Setup */}
          <div className="space-y-4 text-xs font-sans">
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5 space-y-3">
              <span className="font-mono font-bold text-white text-xs uppercase tracking-wider block">
                Telegram Credentials
              </span>

              <div>
                <label className="block text-neutral-400 mb-1 font-mono text-[11px]">
                  BOT TOKEN (from @BotFather):
                </label>
                <input
                  type="password"
                  value={botToken}
                  onChange={e => setBotToken(e.target.value)}
                  placeholder="e.g. 7123456789:AAH...example"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-mono text-[11px]">
                  CHAT ID / CHANNEL ID:
                </label>
                <input
                  type="text"
                  value={chatId}
                  onChange={e => setChatId(e.target.value)}
                  placeholder="e.g. -1001234567890 or @your_channel"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSaveCredentials}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-mono font-medium transition-colors cursor-pointer"
                >
                  Save Credentials
                </button>
                <button
                  onClick={handleSendTestAlert}
                  disabled={isSendingTest}
                  className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded text-xs font-mono font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSendingTest ? 'Sending...' : 'Send Live Test'}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded text-xs font-mono border ${
                    testResult.success
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>

            {/* Alert Rules & Anti-Spam Notice */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5 space-y-2 text-[11px] text-neutral-400">
              <span className="font-mono font-bold text-white text-xs uppercase tracking-wider block">
                Alert Engine Rules
              </span>
              <p>
                ✓ <strong>State Change / New Setup:</strong> Alerts fire only when a new confirmed setup is identified or state shifts (e.g. 🟡 WAIT → 🟢 LONG).
              </p>
              <p>
                ✓ <strong>Anti-Spam Filter:</strong> Same coin state alerts are deduplicated to avoid continuous noise.
              </p>
              <p>
                ✓ <strong>Min Score Filter:</strong> Default {settings.minScoreAlert}/100 minimum threshold.
              </p>
            </div>
          </div>

          {/* Right Column: Live Telegram Bot Terminal Simulator */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col h-96 overflow-hidden">
            {/* Telegram Chat Header */}
            <div className="px-3 py-2 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-white">@SOSSKA_Crypto_Bot</span>
              </div>
              <span className="text-[10px] text-neutral-500">Live Simulator</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 font-mono text-xs">
              {chatLog.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] p-2.5 rounded-lg whitespace-pre-wrap leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-sky-900 text-white rounded-br-none'
                        : 'bg-neutral-950 text-neutral-200 border border-neutral-800 rounded-bl-none text-[11px]'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-neutral-500 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Quick Command Suggestions */}
            <div className="px-2 py-1.5 bg-neutral-950/80 border-t border-neutral-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono scrollbar-none">
              {['/top', '/long', '/short', '/scan', '/status', '/settings', '/start'].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => {
                    setCommandInput(cmd);
                  }}
                  className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  {cmd}
                </button>
              ))}
            </div>

            {/* Command Input Box */}
            <form onSubmit={handleSendCommand} className="p-2 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
              <input
                type="text"
                value={commandInput}
                onChange={e => setCommandInput(e.target.value)}
                placeholder="Type command (/top, /long...)"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded text-xs font-mono font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
