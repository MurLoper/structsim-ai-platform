import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({ isOpen, onClose, title, children }) => (
  <>
    {isOpen && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
    <div
      className={`fixed top-0 right-0 h-full w-[480px] bg-white dark:bg-slate-800 shadow-2xl z-50
      transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto h-[calc(100%-64px)] custom-scrollbar">{children}</div>
    </div>
  </>
);
