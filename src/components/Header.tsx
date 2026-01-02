import React from 'react';
import settingIcon from '../assets/setting_icon.svg';

interface HeaderProps { }

export const Header: React.FC<HeaderProps> = () => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100">
      <div className="flex items-center gap-2">
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openHistory'))}
          className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors"
          title="历史记录"
        >
          <span className="text-lg">🕰️</span>
        </button>
      </div>
    </div>
  );
};
