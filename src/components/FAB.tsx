import React from 'react';
import { Plus, Film } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  label?: string;
}

export const FAB: React.FC<FABProps> = ({ onClick, label = 'Tambah Video' }) => {
  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-30 max-w-md mx-auto pointer-events-none">
      <button
        id="fab-add-video"
        onClick={onClick}
        aria-label={label}
        className="pointer-events-auto flex items-center gap-2.5 h-13 pl-4 pr-5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/40 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition-all duration-200 border border-indigo-400/40"
      >
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
          <Plus className="w-4 h-4 stroke-[3px]" />
        </div>
        <span className="tracking-wide flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 opacity-80" />
          <span>{label}</span>
        </span>
      </button>
    </div>
  );
};
