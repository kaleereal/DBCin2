import React from 'react';
import { Layers, Tag, Check, Sparkles } from 'lucide-react';
import { CustomFieldDefinition } from '../types';

interface DynamicRankFilterBarProps {
  fieldDefinitions: CustomFieldDefinition[];
  activeFieldId: string | null;
  onSelectField: (fieldId: string | null) => void;
  selectedOption: string | null;
  onSelectOption: (option: string | null) => void;
  /** Optional custom extra options discovered from data */
  dynamicOptionsByField?: Record<string, string[]>;
}

export const DynamicRankFilterBar: React.FC<DynamicRankFilterBarProps> = ({
  fieldDefinitions,
  activeFieldId,
  onSelectField,
  selectedOption,
  onSelectOption,
  dynamicOptionsByField = {},
}) => {
  // Extract all single_choice and multi_choice fields created/managed in Settings
  const choiceFields = React.useMemo(() => {
    return fieldDefinitions
      .filter((f) => f.type === 'single_choice' || f.type === 'multi_choice')
      .sort((a, b) => a.order - b.order);
  }, [fieldDefinitions]);

  // Current active field object (if a specific field tab is selected)
  const currentField = React.useMemo(() => {
    if (!activeFieldId) return null;
    return choiceFields.find((f) => f.id === activeFieldId) || null;
  }, [choiceFields, activeFieldId]);

  // Items/Options available for current active field (options from field config + discovered data)
  const currentOptions = React.useMemo(() => {
    if (!currentField) return [];
    const configuredOptions = currentField.options || [];
    const discovered = dynamicOptionsByField[currentField.id] || [];
    // Combine and deduplicate
    const combined = Array.from(new Set([...configuredOptions, ...discovered]));
    return combined.filter((opt) => opt && opt.trim().length > 0);
  }, [currentField, dynamicOptionsByField]);

  return (
    <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md pb-2.5 -mx-4 px-4 pt-1.5 border-b border-slate-800/80 space-y-2">
      {/* 1. STICKY FIELD CATEGORY TABS (Horizontal Scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {/* Tab: Semua Kategori */}
        <button
          type="button"
          onClick={() => {
            onSelectField(null);
            onSelectOption(null);
          }}
          className={`shrink-0 min-h-[36px] px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
            activeFieldId === null
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
              : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Semua</span>
        </button>

        {/* Dynamic Tabs from Settings Fields */}
        {choiceFields.map((field) => {
          const isActive = activeFieldId === field.id;
          const optionsCount = (field.options || []).length;

          return (
            <button
              key={field.id}
              type="button"
              onClick={() => {
                if (activeFieldId === field.id) {
                  // Keep active, or if already active user might toggle or keep
                } else {
                  onSelectField(field.id);
                  onSelectOption(null); // Reset option filter on tab switch
                }
              }}
              className={`shrink-0 min-h-[36px] px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800/60'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{field.label}</span>
              {optionsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-indigo-900/80 text-indigo-200' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {optionsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. HORIZONTAL SCROLLABLE CHIPS (Items/Values Filter under the Tab) */}
      {currentField ? (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pt-0.5">
          {/* Chip "Semua [Nama Field]" to show all in this field category */}
          <button
            type="button"
            onClick={() => onSelectOption(null)}
            className={`shrink-0 min-h-[32px] px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
              selectedOption === null
                ? 'bg-amber-500 text-amber-950 font-black shadow-sm shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {selectedOption === null && <Check className="w-3 h-3 stroke-[3]" />}
            <span>Semua {currentField.label}</span>
          </button>

          {/* Value Chips */}
          {currentOptions.map((opt) => {
            const isChipActive = selectedOption === opt;

            return (
              <button
                key={opt}
                type="button"
                onClick={() => onSelectOption(isChipActive ? null : opt)}
                className={`shrink-0 min-h-[32px] px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
                  isChipActive
                    ? 'bg-amber-500 text-amber-950 font-black shadow-sm shadow-amber-500/20 ring-1 ring-amber-300'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {isChipActive && <Check className="w-3 h-3 stroke-[3]" />}
                <span>{opt}</span>
              </button>
            );
          })}

          {currentOptions.length === 0 && (
            <span className="text-[11px] text-slate-500 italic py-1 px-1">
              Belum ada pilihan item di field ini. Tambahkan di Pengaturan.
            </span>
          )}
        </div>
      ) : (
        /* Hint when "Semua" tab is selected */
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 py-0.5">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Pilih tab kategori di atas untuk memfilter berdasarkan genre atau tag tertentu</span>
          </span>
        </div>
      )}
    </div>
  );
};
