import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-neutral-800 bg-neutral-950 py-8 px-4 sm:px-6 font-mono text-neutral-500 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-bold text-neutral-300">SOSSKA CRYPTO SCREENER V2</span>
          <span className="mx-2">·</span>
          <span>Professional Market Analysis Terminal</span>
        </div>

        <div className="text-center sm:text-right text-[11px] text-neutral-500">
          Not financial advice. Cryptocurrency trading involves substantial risk of loss.
        </div>
      </div>
    </footer>
  );
};
