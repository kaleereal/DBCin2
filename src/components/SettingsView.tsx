import React, { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Download,
  Upload,
  RotateCcw,
  Check,
  X,
  ShieldAlert,
  Sparkles,
  Smartphone,
  FolderPlus,
  Folder,
  Layers,
  ChevronDown,
  ChevronUp,
  ListPlus,
  Scale,
  RefreshCw,
  Lock,
  Unlock,
  Percent,
  Database,
  FileText,
  AlertCircle,
  CheckCircle2,
  Copy,
  Palette,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  CustomFieldDefinition,
  FieldType,
  RatingTemplateFolder,
  RatingTemplateItem,
  RoleWeight,
} from '../types';
import {
  exportDatabaseEntriesJson,
  importDatabaseEntriesJson,
  exportCustomizationRulesJson,
  importCustomizationRulesJson,
  exportAllDataJson,
  importDataJson,
  resetAllDataToDefault,
  getStoredRatingTemplates,
  saveRatingTemplates,
  DEFAULT_RATING_TEMPLATES,
  getStoredRoleWeights,
  saveRoleWeights,
  syncRoleWeightsWithVideos,
  recalculateAllVideoPivots,
  getStoredVideos,
  getStoredArtists,
  getStoredPivots,
  savePivots,
  getStoredArtistFields,
  saveArtistFields,
} from '../utils/storage';
import { PWAInstallButton } from './PWAInstallButton';
import { ConfirmModal } from './ConfirmModal';

interface SettingsViewProps {
  fieldDefinitions: CustomFieldDefinition[];
  onUpdateFields: (fields: CustomFieldDefinition[]) => void;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  fieldDefinitions,
  onUpdateFields,
  onRefreshData,
}) => {
  const { startThemeEditMode } = useTheme();

  // Modal for add/edit field
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for custom field
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('custom_text');
  const [optionsText, setOptionsText] = useState('');
  const [maxEntries, setMaxEntries] = useState<number>(10);
  // Option items with descriptions for multi_choice & single_choice
  const [optionItems, setOptionItems] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionDesc, setNewOptionDesc] = useState('');
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);

  // Master Rating Templates State
  const [ratingTemplates, setRatingTemplates] = useState<RatingTemplateFolder[]>([]);
  const [openFolderIds, setOpenFolderIds] = useState<Record<string, boolean>>({});

  // Collapsible main sections state (Default collapsed)
  const [isPwaOpen, setIsPwaOpen] = useState(false);
  const [isRatingTemplatesOpen, setIsRatingTemplatesOpen] = useState(false);
  const [isFieldsOpen, setIsFieldsOpen] = useState(false);
  const [isArtistFieldsOpen, setIsArtistFieldsOpen] = useState(false);
  const [isRoleWeightsOpen, setIsRoleWeightsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Artist Fields State
  const [artistFields, setArtistFields] = useState<CustomFieldDefinition[]>([]);
  const [editingArtistField, setEditingArtistField] = useState<CustomFieldDefinition | null>(null);
  const [isArtistFieldModalOpen, setIsArtistFieldModalOpen] = useState(false);
  const [artistFieldLabel, setArtistFieldLabel] = useState('');
  const [artistFieldDesc, setArtistFieldDesc] = useState('');
  const [artistFieldType, setArtistFieldType] = useState<FieldType>('custom_text');

  // Role Weights State
  const [roleWeights, setRoleWeights] = useState<RoleWeight[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcStatus, setRecalcStatus] = useState<string | null>(null);

  // Folder modal state (Add / Edit Folder)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<RatingTemplateFolder | null>(null);
  const [folderNameInput, setFolderNameInput] = useState('');

  // Item modal state (Add / Edit Item)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [targetFolderForNewItem, setTargetFolderForNewItem] = useState<RatingTemplateFolder | null>(null);
  const [editingItem, setEditingItem] = useState<RatingTemplateItem | null>(null);
  const [itemNameInput, setItemNameInput] = useState('');
  const [itemDescriptionInput, setItemDescriptionInput] = useState('');

  // Import / Export Feedback
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // In-app Confirm & Alert Modals (prevents iframe alert/confirm blockage)
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Load Rating Templates and Role Weights on mount
  useEffect(() => {
    const loaded = getStoredRatingTemplates();
    setRatingTemplates(loaded);
    // Open all folders by default in settings
    const initialOpen: Record<string, boolean> = {};
    loaded.forEach((f) => {
      initialOpen[f.id] = true;
    });
    setOpenFolderIds(initialOpen);

    // Sync role weights with videos
    const storedVideos = getStoredVideos();
    const synced = syncRoleWeightsWithVideos(storedVideos);
    setRoleWeights(synced);

    // Load artist custom field definitions
    setArtistFields(getStoredArtistFields());
  }, []);

  const handleWeightChange = (roleName: string, weight: number) => {
    const clamped = Math.max(0, Math.min(100, weight));
    const updated = roleWeights.map((rw) =>
      rw.roleName.toLowerCase() === roleName.toLowerCase() && !rw.isLocked
        ? { ...rw, weight: clamped }
        : rw
    );
    setRoleWeights(updated);
    saveRoleWeights(updated);
    onRefreshData();
  };

  const handleStepRoleWeight = (roleName: string, delta: number) => {
    const targetRole = roleWeights.find((r) => r.roleName.toLowerCase() === roleName.toLowerCase());
    if (!targetRole || targetRole.isLocked) return;
    handleWeightChange(roleName, targetRole.weight + delta);
  };

  const handleToggleLockRole = (roleName: string) => {
    const updated = roleWeights.map((rw) =>
      rw.roleName.toLowerCase() === roleName.toLowerCase()
        ? { ...rw, isLocked: !rw.isLocked }
        : rw
    );
    setRoleWeights(updated);
    saveRoleWeights(updated);
    onRefreshData();
  };

  const handleAddRoleWeight = () => {
    if (!newRoleName.trim()) return;
    const trimmed = newRoleName.trim();
    if (roleWeights.some((r) => r.roleName.toLowerCase() === trimmed.toLowerCase())) {
      alert('Status peran ini sudah terdaftar!');
      return;
    }
    const updated: RoleWeight[] = [
      ...roleWeights,
      {
        id: `rw_${Date.now()}`,
        roleName: trimmed,
        weight: Math.max(0, Math.min(100, newRoleWeight)),
        isLocked: false,
      },
    ];
    setRoleWeights(updated);
    saveRoleWeights(updated);
    setNewRoleName('');
    setNewRoleWeight(100);
    onRefreshData();
  };

  const handleDeleteRoleWeight = (roleName: string) => {
    if (roleWeights.length <= 1) {
      setAlertMessage('Minimal harus ada satu status peran.');
      return;
    }
    setConfirmModalData({
      title: 'Hapus Status Peran',
      message: `Apakah Anda yakin ingin menghapus konfigurasi bobot untuk peran "${roleName}"?`,
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: () => {
        const updated = roleWeights.filter(
          (rw) => rw.roleName.toLowerCase() !== roleName.toLowerCase()
        );
        setRoleWeights(updated);
        saveRoleWeights(updated);
        onRefreshData();
      },
    });
  };

  const handleRecalculateAllPivots = () => {
    setIsRecalculating(true);
    setRecalcStatus(null);
    try {
      const storedVideos = getStoredVideos();
      const currentPivots = getStoredPivots();
      const { updatedPivots, recalculatedCount, skippedLockedCount } = recalculateAllVideoPivots(
        storedVideos,
        roleWeights,
        currentPivots
      );
      savePivots(updatedPivots);
      setRecalcStatus(
        `Sukses menghitung ulang ${recalculatedCount} relasi video (${skippedLockedCount} peran terkunci dilewati)!`
      );
      onRefreshData();
    } catch (err) {
      setRecalcStatus('Terjadi kesalahan saat menghitung ulang.');
    } finally {
      setIsRecalculating(false);
      setTimeout(() => setRecalcStatus(null), 3500);
    }
  };

  const updateTemplates = (newTemplates: RatingTemplateFolder[]) => {
    setRatingTemplates(newTemplates);
    saveRatingTemplates(newTemplates);
  };

  // Toggle Folder Accordion in Settings
  const toggleFolderAccordion = (folderId: string) => {
    setOpenFolderIds((prev) => ({
      ...prev,
      [folderId]: prev[folderId] === undefined ? false : !prev[folderId],
    }));
  };

  // FOLDER ACTIONS
  const openAddFolderModal = () => {
    setEditingFolder(null);
    setFolderNameInput('');
    setIsFolderModalOpen(true);
  };

  const openEditFolderModal = (folder: RatingTemplateFolder) => {
    setEditingFolder(folder);
    setFolderNameInput(folder.name);
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim()) return;

    if (editingFolder) {
      // Edit existing folder name
      const updated = ratingTemplates.map((f) =>
        f.id === editingFolder.id ? { ...f, name: folderNameInput.trim() } : f
      );
      updateTemplates(updated);
    } else {
      // Add new folder with 1 default item
      const newFolderId = `tmpl_folder_${Date.now()}`;
      const newFolder: RatingTemplateFolder = {
        id: newFolderId,
        name: folderNameInput.trim(),
        items: [
          {
            id: `tmpl_item_${Date.now()}_1`,
            name: `${folderNameInput.trim()} - Parameter 1`,
            defaultScore: 80,
          },
        ],
      };
      updateTemplates([...ratingTemplates, newFolder]);
      setOpenFolderIds((prev) => ({ ...prev, [newFolderId]: true }));
    }

    setIsFolderModalOpen(false);
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    if (ratingTemplates.length <= 1) {
      setAlertMessage('Minimal harus ada 1 kategori folder penilaian.');
      return;
    }
    setConfirmModalData({
      title: 'Hapus Kategori Rating',
      message: `Apakah Anda yakin ingin menghapus kategori "${folderName}" beserta seluruh parameter penilaian di dalamnya?`,
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: () => {
        const updated = ratingTemplates.filter((f) => f.id !== folderId);
        updateTemplates(updated);
      },
    });
  };

  const handleMoveFolder = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= ratingTemplates.length) return;

    const copy = [...ratingTemplates];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    updateTemplates(copy);
  };

  // ITEM ACTIONS
  const openAddItemModal = (folder: RatingTemplateFolder) => {
    setTargetFolderForNewItem(folder);
    setEditingItem(null);
    setItemNameInput('');
    setItemDescriptionInput('');
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (folder: RatingTemplateFolder, item: RatingTemplateItem) => {
    setTargetFolderForNewItem(folder);
    setEditingItem(item);
    setItemNameInput(item.name);
    setItemDescriptionInput(item.description || '');
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemNameInput.trim() || !targetFolderForNewItem) return;

    const folderId = targetFolderForNewItem.id;
    const cleanDesc = itemDescriptionInput.trim() || undefined;

    if (editingItem) {
      // Edit existing item
      const updated = ratingTemplates.map((f) => {
        if (f.id !== folderId) return f;
        return {
          ...f,
          items: f.items.map((it) =>
            it.id === editingItem.id
              ? {
                  ...it,
                  name: itemNameInput.trim(),
                  description: cleanDesc,
                }
              : it
          ),
        };
      });
      updateTemplates(updated);
    } else {
      // Add new item to folder
      const newItem: RatingTemplateItem = {
        id: `tmpl_item_${Date.now()}`,
        name: itemNameInput.trim(),
        description: cleanDesc,
        defaultScore: 80,
      };
      const updated = ratingTemplates.map((f) => {
        if (f.id !== folderId) return f;
        return {
          ...f,
          items: [...f.items, newItem],
        };
      });
      updateTemplates(updated);
    }

    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (folderId: string, itemId: string, itemName: string) => {
    const folder = ratingTemplates.find((f) => f.id === folderId);
    if (folder && folder.items.length <= 1) {
      setAlertMessage('Setiap kategori folder minimal harus memiliki 1 parameter penilaian.');
      return;
    }
    setConfirmModalData({
      title: 'Hapus Parameter Penilaian',
      message: `Hapus parameter penilaian "${itemName}"?`,
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: () => {
        const updated = ratingTemplates.map((f) => {
          if (f.id !== folderId) return f;
          return {
            ...f,
            items: f.items.filter((it) => it.id !== itemId),
          };
        });
        updateTemplates(updated);
      },
    });
  };

  const handleResetRatingTemplates = () => {
    setConfirmModalData({
      title: 'Reset Template Rating',
      message: 'Kembalikan susunan folder & item rating ke template bawaan? Kustomisasi kategori Anda akan diatur ulang.',
      confirmText: 'Ya, Reset',
      isDanger: false,
      onConfirm: () => {
        updateTemplates(DEFAULT_RATING_TEMPLATES);
      },
    });
  };

  const openAddModal = () => {
    setEditingField(null);
    setLabel('');
    setDescription('');
    setFieldType('custom_text');
    setOptionsText('');
    setMaxEntries(10);
    setOptionItems([
      { id: 'opt_1', name: 'Pilihan 1', description: '' },
      { id: 'opt_2', name: 'Pilihan 2', description: '' },
    ]);
    setNewOptionName('');
    setNewOptionDesc('');
    setEditingOptionIndex(null);
    setIsModalOpen(true);
  };

  const openEditModal = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setLabel(field.label);
    setDescription(field.description);
    setFieldType(field.type);
    setOptionsText(field.options?.join(', ') || '');
    setMaxEntries(field.maxEntries || 10);
    const loadedOpts = (field.options || []).map((opt, idx) => ({
      id: `opt_${idx}_${Date.now()}`,
      name: opt,
      description: field.optionDescriptions?.[opt] || '',
    }));
    setOptionItems(loadedOpts);
    setNewOptionName('');
    setNewOptionDesc('');
    setEditingOptionIndex(null);
    setIsModalOpen(true);
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const isChoiceType = fieldType === 'multi_choice' || fieldType === 'single_choice';
    let finalOptions: string[] = [];
    const finalOptionDescriptions: Record<string, string> = {};

    if (isChoiceType) {
      finalOptions = optionItems.map((o) => o.name.trim()).filter(Boolean);
      if (finalOptions.length === 0 && optionsText.trim()) {
        finalOptions = optionsText.split(',').map((s) => s.trim()).filter(Boolean);
      }
      optionItems.forEach((o) => {
        const trimmedName = o.name.trim();
        const trimmedDesc = o.description.trim();
        if (trimmedName && trimmedDesc) {
          finalOptionDescriptions[trimmedName] = trimmedDesc;
        }
      });
    }

    if (editingField) {
      // Update existing
      const updated = fieldDefinitions.map((f) => {
        if (f.id === editingField.id) {
          return {
            ...f,
            label: label.trim(),
            description: description.trim(),
            options: isChoiceType ? (finalOptions.length > 0 ? finalOptions : f.options) : f.options,
            optionDescriptions: isChoiceType ? finalOptionDescriptions : f.optionDescriptions,
            maxEntries,
          };
        }
        return f;
      });
      onUpdateFields(updated);
    } else {
      // Add new custom field
      const newField: CustomFieldDefinition = {
        id: `field_custom_${Date.now()}`,
        key: `custom_${Date.now()}`,
        label: label.trim(),
        description: description.trim(),
        type: fieldType,
        order: fieldDefinitions.length + 1,
        options: isChoiceType ? (finalOptions.length > 0 ? finalOptions : ['Pilihan 1', 'Pilihan 2']) : undefined,
        optionDescriptions: isChoiceType ? finalOptionDescriptions : undefined,
        maxEntries,
      };
      onUpdateFields([...fieldDefinitions, newField]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteField = (fieldId: string) => {
    const field = fieldDefinitions.find((f) => f.id === fieldId);
    if (field?.isSystem) {
      setAlertMessage('Field sistem inti tidak dapat dihapus, namun bisa diubah nama dan posisinya.');
      return;
    }
    setConfirmModalData({
      title: 'Hapus Field Kustom',
      message: `Yakin ingin menghapus field "${field?.label}"?`,
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: () => {
        onUpdateFields(fieldDefinitions.filter((f) => f.id !== fieldId));
      },
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fieldDefinitions.length) return;

    const copy = [...fieldDefinitions];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    // Reassign order
    const reordered = copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    onUpdateFields(reordered);
  };

  // Safe file downloader with clipboard fallback
  const triggerDownload = (jsonStr: string, filename: string) => {
    try {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(href);
      }, 200);
      setBackupStatus({
        type: 'success',
        message: `Berkas cadangan "${filename}" berhasil diunduh.`,
      });
    } catch (err) {
      navigator.clipboard?.writeText(jsonStr);
      setBackupStatus({
        type: 'warning',
        message: `Izin unduh ditolak oleh peramban, data JSON telah disalin ke papan klip (clipboard).`,
      });
    }
    setTimeout(() => setBackupStatus(null), 5000);
  };

  // 1. Cadangan Entri Database (Videos, Artists, Pivots)
  const handleExportDatabase = () => {
    const jsonStr = exportDatabaseEntriesJson();
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(jsonStr, `cinerate_database_entries_${dateStr}.json`);
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDatabaseEntriesJson(content);
      if (res.success) {
        setBackupStatus({ type: 'success', message: res.message });
        onRefreshData();
      } else {
        setBackupStatus({ type: 'error', message: res.message });
      }
      setTimeout(() => setBackupStatus(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 2. Cadangan Kustomisasi Aturan (Fields, Rating Templates, Role Weights)
  const handleExportRules = () => {
    const jsonStr = exportCustomizationRulesJson();
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(jsonStr, `cinerate_rules_config_${dateStr}.json`);
  };

  const handleImportRules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importCustomizationRulesJson(content);
      if (res.success) {
        setBackupStatus({ type: 'success', message: res.message });
        setRatingTemplates(getStoredRatingTemplates());
        setRoleWeights(getStoredRoleWeights());
        onRefreshData();
      } else {
        setBackupStatus({ type: 'error', message: res.message });
      }
      setTimeout(() => setBackupStatus(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 3. Cadangan Penuh (Semua Data)
  const handleExportFull = () => {
    const jsonStr = exportAllDataJson();
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(jsonStr, `cinerate_backup_full_${dateStr}.json`);
  };

  const handleImportFull = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataJson(content);
      if (res.success) {
        setBackupStatus({ type: 'success', message: res.message });
        setRatingTemplates(getStoredRatingTemplates());
        setRoleWeights(getStoredRoleWeights());
        onRefreshData();
      } else {
        setBackupStatus({ type: 'error', message: res.message });
      }
      setTimeout(() => setBackupStatus(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    setConfirmModalData({
      title: 'Reset Semua Data',
      message:
        'Apakah Anda yakin ingin mengembalikan semua data ke sampel bawaan? Semua entri video dan profil artis buatan Anda akan digantikan dengan data sampel awal.',
      confirmText: 'Ya, Reset Semua',
      isDanger: true,
      onConfirm: () => {
        resetAllDataToDefault();
        setRatingTemplates(getStoredRatingTemplates());
        setRoleWeights(getStoredRoleWeights());
        onRefreshData();
        setBackupStatus({
          type: 'success',
          message: 'Semua data dan kustomisasi telah dikembalikan ke sampel awal.',
        });
        setTimeout(() => setBackupStatus(null), 4000);
      },
    });
  };

  return (
    <div id="settings-view" className="space-y-6 pb-28 animate-in fade-in">
      {/* Header */}
      <div className="px-1">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>Pengaturan &amp; Kustomisasi</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Atur urutan, nama, deskripsi, serta opsi field form entri video &amp; artis
        </p>
      </div>

      {/* Section Pengaturan Tema & Tipografi (Poin 7 & 8) */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Sistem Tema &amp; Tipografi Dinamis</h3>
            <p className="text-xs text-slate-400">Ubah warna dan ukuran font live dengan floating editor</p>
          </div>
        </div>
        <button
          type="button"
          onClick={startThemeEditMode}
          className="min-h-[42px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 shadow-md shadow-indigo-600/30"
        >
          <Palette className="w-4 h-4" />
          <span>Edit Tema</span>
        </button>
      </div>

      {/* PWA Section (Collapsible, default: collapsed) */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <button
          type="button"
          onClick={() => setIsPwaOpen(!isPwaOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-850 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Aplikasi PWA Mobile</h3>
              <p className="text-xs text-slate-400">Dukungan offline dan akses langsung dari layar HP</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold shrink-0 ml-2">
            <span>{isPwaOpen ? 'Tutup' : 'Buka'}</span>
            {isPwaOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isPwaOpen && (
          <div className="p-4 pt-1 border-t border-slate-800/80 animate-in fade-in">
            <PWAInstallButton />
          </div>
        )}
      </div>

      {/* Master Rating Folders & Items Management (Collapsible, default: collapsed) */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <button
          type="button"
          onClick={() => setIsRatingTemplatesOpen(!isRatingTemplatesOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-850 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Kategori &amp; Item Penilaian (Master Rating)</h3>
              <p className="text-xs text-slate-400">
                {ratingTemplates.length} Kategori folder &amp; parameter penilaian
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold shrink-0 ml-2">
            <span>{isRatingTemplatesOpen ? 'Tutup' : 'Buka'}</span>
            {isRatingTemplatesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isRatingTemplatesOpen && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Kelola nama kategori folder &amp; parameter penilaian di sini agar form video tetap bersih
              </p>
              <button
                type="button"
                onClick={handleResetRatingTemplates}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition shrink-0 cursor-pointer"
                title="Kembalikan kategori & item ke default"
              >
                Reset Bawaan
              </button>
            </div>

        {/* Rating Folders List */}
        <div className="space-y-3">
          {ratingTemplates.map((folder, fIdx) => {
            const isFolderOpen = openFolderIds[folder.id] !== false;
            return (
              <div
                key={folder.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-sm hover:border-slate-700 transition"
              >
                {/* Folder Header */}
                <div className="flex items-center justify-between p-3 bg-slate-900 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-0.5 text-slate-500 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveFolder(fIdx, 'up')}
                        disabled={fIdx === 0}
                        className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-20"
                        title="Pindah ke Atas"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveFolder(fIdx, 'down')}
                        disabled={fIdx === ratingTemplates.length - 1}
                        className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-20"
                        title="Pindah ke Bawah"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleFolderAccordion(folder.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-black shrink-0">
                        {fIdx + 1}
                      </span>
                      <span className="font-bold text-sm text-white truncate">
                        {folder.name}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                        {folder.items.length} Parameter
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => openEditFolderModal(folder)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                      title="Ubah Nama Kategori"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFolder(folder.id, folder.name)}
                      className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 transition"
                      title="Hapus Kategori Ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFolderAccordion(folder.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      {isFolderOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Folder Items List */}
                {isFolderOpen && (
                  <div className="p-3 bg-slate-950/50 space-y-2 animate-in fade-in">
                    <div className="space-y-1.5">
                      {folder.items.map((item, iIdx) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-xs"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 flex items-center justify-center shrink-0">
                                {iIdx + 1}
                              </span>
                              <span className="font-semibold text-slate-200 truncate">
                                {item.name}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-slate-400 mt-0.5 pl-6 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditItemModal(folder, item)}
                              className="p-1 rounded text-slate-400 hover:text-amber-400 transition"
                              title="Ubah Nama Parameter"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteItem(folder.id, item.id, item.name)
                              }
                              className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
                              title="Hapus Parameter"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Item Button for this folder */}
                    <button
                      type="button"
                      onClick={() => openAddItemModal(folder)}
                      className="w-full min-h-[38px] rounded-xl border border-dashed border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:bg-indigo-950/20 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-400" />
                      <span>+ Tambah Parameter di "{folder.name}"</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

            {/* Add Folder Button */}
            <button
              type="button"
              onClick={openAddFolderModal}
              className="w-full min-h-[44px] rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Tambah Kategori Folder Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* Custom Fields Management List (Collapsible, default: collapsed) */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <button
          type="button"
          onClick={() => setIsFieldsOpen(!isFieldsOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-850 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Struktur &amp; Urutan Field Form</h3>
              <p className="text-xs text-slate-400">
                {fieldDefinitions.length} Field aktif &amp; urutan form entri
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold shrink-0 ml-2">
            <span>{isFieldsOpen ? 'Tutup' : 'Buka'}</span>
            {isFieldsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isFieldsOpen && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-3 animate-in fade-in">

        {/* List View with drag/reorder handle, Edit, Delete */}
        <div className="space-y-2">
          {fieldDefinitions.map((field, idx) => (
            <div
              key={field.id}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-sm"
            >
              {/* Drag/Reorder buttons */}
              <div className="flex flex-col items-center gap-1 shrink-0 text-slate-400">
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 rounded hover:bg-slate-800 disabled:opacity-20 transition"
                  title="Pindah ke Atas"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center justify-center text-slate-600">
                  <GripVertical className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === fieldDefinitions.length - 1}
                  className="p-1 rounded hover:bg-slate-800 disabled:opacity-20 transition"
                  title="Pindah ke Bawah"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Field Label & Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">
                    {field.label}
                  </h4>
                  {field.isSystem && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      SISTEM
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {field.description}
                </p>
                {field.options && field.options.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {field.options.slice(0, 4).map((opt, oIdx) => (
                      <span
                        key={oIdx}
                        className="px-1.5 py-0.2 rounded bg-slate-950 text-[10px] text-indigo-300 font-medium border border-slate-800"
                      >
                        {opt}
                      </span>
                    ))}
                    {field.options.length > 4 && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        +{field.options.length - 4} opsi
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons: Edit & Delete */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal(field)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition active:scale-95"
                  title="Edit Field"
                >
                  <Edit2 className="w-4 h-4 text-amber-400" />
                </button>
                {!field.isSystem && (
                  <button
                    type="button"
                    onClick={() => handleDeleteField(field.id)}
                    className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 transition active:scale-95"
                    title="Hapus Field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Button to Add New Field (Min 48px height) */}
        <button
          type="button"
          onClick={openAddModal}
          className="w-full min-h-[48px] rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Field Baru</span>
        </button>
          </div>
        )}
      </div>

      {/* Section Pengaturan Baru: "Struktur & Urutan Field Artis" (Poin 3B) */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <button
          type="button"
          onClick={() => setIsArtistFieldsOpen(!isArtistFieldsOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-850 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Struktur &amp; Urutan Field Artis</h3>
              <p className="text-xs text-slate-400">
                {artistFields.length} Field kustomisasi form Buat/Edit Entri Artis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold shrink-0 ml-2">
            <span>{isArtistFieldsOpen ? 'Tutup' : 'Buka'}</span>
            {isArtistFieldsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isArtistFieldsOpen && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-3 animate-in fade-in">
            <p className="text-xs text-slate-400">
              Kustomisasi struktur form entri artis. Data field tambahan yang dihapus tidak hilang permanen di database.
            </p>

            {/* List View Field Artis */}
            <div className="space-y-2">
              {artistFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition shadow-sm"
                >
                  {/* Drag/Reorder buttons */}
                  <div className="flex flex-col items-center gap-1 shrink-0 text-slate-400">
                    <button
                      type="button"
                      onClick={() => {
                        if (idx === 0) return;
                        const copy = [...artistFields];
                        const temp = copy[idx];
                        copy[idx] = copy[idx - 1];
                        copy[idx - 1] = temp;
                        const reordered = copy.map((it, i) => ({ ...it, order: i + 1 }));
                        setArtistFields(reordered);
                        saveArtistFields(reordered);
                      }}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-slate-800 disabled:opacity-20 transition"
                      title="Pindah ke Atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <GripVertical className="w-4 h-4 text-slate-600" />
                    <button
                      type="button"
                      onClick={() => {
                        if (idx === artistFields.length - 1) return;
                        const copy = [...artistFields];
                        const temp = copy[idx];
                        copy[idx] = copy[idx + 1];
                        copy[idx + 1] = temp;
                        const reordered = copy.map((it, i) => ({ ...it, order: i + 1 }));
                        setArtistFields(reordered);
                        saveArtistFields(reordered);
                      }}
                      disabled={idx === artistFields.length - 1}
                      className="p-1 rounded hover:bg-slate-800 disabled:opacity-20 transition"
                      title="Pindah ke Bawah"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Field Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{field.label}</h4>
                      {field.isSystem && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                          WAJIB / SISTEM
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{field.description}</p>
                  </div>

                  {/* Delete button (Non-system fields only) */}
                  {!field.isSystem && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModalData({
                          title: 'Sembunyikan / Hapus Field Artis',
                          message: `Sembunyikan field "${field.label}" dari form artis? Data historis yang tersimpan tidak akan hilang secara permanen.`,
                          confirmText: 'Sembunyikan',
                          isDanger: true,
                          onConfirm: () => {
                            const updated = artistFields.filter((f) => f.id !== field.id);
                            setArtistFields(updated);
                            saveArtistFields(updated);
                          },
                        });
                      }}
                      className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-950/80 text-rose-400 transition"
                      title="Hapus / Sembunyikan Field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Button Tambah Field Artis Baru */}
            <button
              type="button"
              onClick={() => {
                setEditingArtistField(null);
                setArtistFieldLabel('');
                setArtistFieldDesc('');
                setArtistFieldType('custom_text');
                setIsArtistFieldModalOpen(true);
              }}
              className="w-full min-h-[48px] rounded-2xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Field Form Artis Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* Role Weights Configuration (Collapsible, default: collapsed) */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <button
          type="button"
          onClick={() => setIsRoleWeightsOpen(!isRoleWeightsOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-850 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Konfigurasi Bobot Status Peran</h3>
              <p className="text-xs text-slate-400">
                {roleWeights.length} Status peran terdaftar (0-100%)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold shrink-0 ml-2">
            <span>{isRoleWeightsOpen ? 'Tutup' : 'Buka'}</span>
            {isRoleWeightsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isRoleWeightsOpen && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-4 animate-in fade-in">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 text-xs text-slate-300 leading-relaxed space-y-2">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>Aturan Relasi Nilai &amp; Rumus Rating Artis:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                <li><strong className="text-slate-200">Nilai Video Utama:</strong> Merupakan nilai rata-rata entri video itu sendiri (dari parameter penilaian).</li>
                <li><strong className="text-slate-200">Nilai yang Didapat Artis:</strong> Dihitung dari rumus <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded font-mono">(Nilai Video × Bobot Status Peran) / 100</code>.</li>
                <li><strong className="text-slate-200">Rating Artis:</strong> Menghitung <strong className="text-amber-300">RATA-RATA</strong> dari seluruh nilai yang didapatkan artis tersebut dari daftar video yang tertaut, bukan dari nilai video utamanya.</li>
              </ul>
            </div>

            {/* Hitung Ulang Semua Nilai Video Action */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sinkronisasi Nilai Relasi</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kalkulasi ulang nilai semua relasi video berdasarkan bobot terbaru (kecuali yang statusnya terkunci).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRecalculateAllPivots}
                  disabled={isRecalculating}
                  className="min-h-[40px] px-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shrink-0 shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
                  <span>{isRecalculating ? 'Menghitung...' : 'Hitung Ulang Semua Nilai Video'}</span>
                </button>
              </div>

              {recalcStatus && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs font-semibold text-emerald-300 animate-in fade-in">
                  {recalcStatus}
                </div>
              )}
            </div>

            {/* Role Weights List with Lock & Step Navigation */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                <span>Daftar Status Peran &amp; Bobot (S)</span>
                <span>Bobot (%)</span>
              </div>

              {roleWeights.map((rw) => (
                <div
                  key={rw.id}
                  className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-bold text-white truncate">
                        {rw.roleName}
                      </span>
                      {rw.isLocked && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Lock Edit
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleLockRole(rw.roleName)}
                        className={`p-1.5 rounded-lg border transition text-xs flex items-center gap-1 cursor-pointer ${
                          rw.isLocked
                            ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title={rw.isLocked ? 'Buka kunci slider edit' : 'Kunci slider agar tidak dapat diubah manual'}
                      >
                        {rw.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRoleWeight(rw.roleName)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                        title="Hapus status peran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Weight Slider with Step +5 / -5 buttons */}
                  <div className="flex items-center gap-2">
                    {/* -5 Step Button */}
                    <button
                      type="button"
                      disabled={rw.isLocked || rw.weight <= 0}
                      onClick={() => handleStepRoleWeight(rw.roleName, -5)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 disabled:opacity-30 text-white text-xs font-black cursor-pointer transition shrink-0"
                      title="Turunkan 5%"
                    >
                      -5
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      disabled={rw.isLocked}
                      value={rw.weight}
                      onChange={(e) => handleWeightChange(rw.roleName, Number(e.target.value))}
                      className="flex-1 accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                    />

                    {/* +5 Step Button */}
                    <button
                      type="button"
                      disabled={rw.isLocked || rw.weight >= 100}
                      onClick={() => handleStepRoleWeight(rw.roleName, 5)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 disabled:opacity-30 text-white text-xs font-black cursor-pointer transition shrink-0"
                      title="Naikkan 5%"
                    >
                      +5
                    </button>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={rw.isLocked}
                        value={rw.weight}
                        onChange={(e) => handleWeightChange(rw.roleName, Number(e.target.value))}
                        className="w-14 min-h-[36px] px-1.5 text-center text-xs font-bold rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-40"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Backup & Data Persistence Management (Collapsible, default: collapsed) */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <button
          type="button"
          onClick={() => setIsBackupOpen(!isBackupOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-850 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Manajemen Data &amp; Cadangan</h3>
              <p className="text-xs text-slate-400">Ekspor berkas cadangan, impor JSON, atau reset data</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold shrink-0 ml-2">
            <span>{isBackupOpen ? 'Tutup' : 'Buka'}</span>
            {isBackupOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isBackupOpen && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-4 animate-in fade-in">
            {/* Status Notification */}
            {backupStatus && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 animate-in fade-in ${
                  backupStatus.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                    : backupStatus.type === 'error'
                    ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                    : backupStatus.type === 'warning'
                    ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                    : 'bg-indigo-950/80 border-indigo-800 text-indigo-300'
                }`}
              >
                {backupStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="flex-1 leading-relaxed">{backupStatus.message}</span>
              </div>
            )}

            {/* 1. Cadangan Entri Database (Videos, Artis, Relasi Peran) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Cadangan Entri Database
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  Data Konten
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mencakup semua data entri video, profil artis/aktor, dan data relasi pivot penilaian peran. Gunakan ini untuk mengamankan data yang Anda buat.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-semibold bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800/60">
                <span>{getStoredVideos().length} Video</span>
                <span>•</span>
                <span>{getStoredArtists().length} Profil Artis</span>
                <span>•</span>
                <span>{getStoredPivots().length} Relasi Peran</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportDatabase}
                  className="min-h-[42px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ekspor Entri DB</span>
                </button>
                <label className="min-h-[42px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Impor Entri DB</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportDatabase}
                  />
                </label>
              </div>
            </div>

            {/* 2. Cadangan Kustomisasi Aturan (Field Kustom, Folder & Item Rating, Bobot Peran) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Cadangan Kustomisasi Aturan
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded-full">
                  Aturan &amp; Rumus
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mencakup tata letak &amp; urutan field kustom, susunan folder &amp; parameter penilaian rating, serta bobot persentase status peran. Tidak mengubah data entri video atau artis Anda saat diimpor.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-semibold bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800/60">
                <span>{fieldDefinitions.length} Field Kustom</span>
                <span>•</span>
                <span>{ratingTemplates.length} Folder Rating</span>
                <span>•</span>
                <span>{roleWeights.length} Status Peran</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportRules}
                  className="min-h-[42px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ekspor Aturan</span>
                </button>
                <label className="min-h-[42px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Impor Aturan</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportRules}
                  />
                </label>
              </div>
            </div>

            {/* 3. Cadangan Penuh (Semua Data) & Reset Bawaan */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-300">
                  Cadangan Lengkap &amp; Reset
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportFull}
                  className="min-h-[38px] px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-3 h-3 text-slate-400" />
                  <span>Ekspor Lengkap</span>
                </button>
                <label className="min-h-[38px] px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer">
                  <Upload className="w-3 h-3 text-slate-400" />
                  <span>Impor Lengkap</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportFull}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={handleResetData}
                className="w-full min-h-[42px] rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/60 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua Data ke Sampel Bawaan</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Field Editor Dialog Pop-up */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 flex flex-col justify-end sm:justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
              <h3 className="text-base font-bold text-white">
                {editingField ? 'Edit Konfigurasi Field' : 'Tambah Field Kustom Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveField} className="p-5 space-y-4">
              {/* Field Label & Required Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Nama Field</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingField?.is_required}
                      onChange={(e) => {
                        if (editingField) {
                          setEditingField({ ...editingField, is_required: e.target.checked });
                        }
                      }}
                      className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-amber-400">Wajib Diisi (Required)</span>
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Contoh: Sutradara / Agensi / Lokasi"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Deskripsi Penjelasan</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan fungsi field ini..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Field Type (if new) */}
              {!editingField && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Tipe Input</label>
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value as FieldType)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="custom_text">Text Field Biasa</option>
                    <option value="multi_choice">MultiChoice (Bisa banyak tag)</option>
                    <option value="single_choice">SingleChoice (Pilihan tunggal)</option>
                  </select>
                </div>
              )}

              {/* Options for multi_choice or single_choice */}
              {(fieldType === 'multi_choice' ||
                fieldType === 'single_choice' ||
                editingField?.type === 'multi_choice' ||
                editingField?.type === 'single_choice') && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div>
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Kelola Item &amp; Deskripsi Opsi ({optionItems.length} Opsi)</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Setiap opsi bisa diberi deskripsi opsional (default tanpa deskripsi). Deskripsi akan muncul saat opsi dipilih di form video dan di catatan kaki profil artis.
                    </p>
                  </div>

                  {/* List of current option items */}
                  {optionItems.length > 0 && (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {optionItems.map((optItem, oIdx) => (
                        <div
                          key={optItem.id}
                          className="flex items-start justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/90 text-xs gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 flex items-center justify-center shrink-0">
                                {oIdx + 1}
                              </span>
                              <span className="font-bold text-white truncate">{optItem.name}</span>
                            </div>
                            {optItem.description ? (
                              <p className="text-[11px] text-indigo-300 mt-1 pl-5.5 leading-relaxed">
                                {optItem.description}
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-600 italic mt-0.5 pl-5.5">
                                (Tanpa deskripsi)
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOptionIndex(oIdx);
                                setNewOptionName(optItem.name);
                                setNewOptionDesc(optItem.description);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-amber-400 transition"
                              title="Edit Opsi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (optionItems.length <= 1) {
                                  alert('Minimal harus ada 1 opsi pilihan.');
                                  return;
                                }
                                setOptionItems(optionItems.filter((_, i) => i !== oIdx));
                                if (editingOptionIndex === oIdx) {
                                  setEditingOptionIndex(null);
                                  setNewOptionName('');
                                  setNewOptionDesc('');
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
                              title="Hapus Opsi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add / Edit Option Card */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-300 block">
                      {editingOptionIndex !== null ? 'Ubah Opsi Terpilih' : '+ Tambah Opsi Baru'}
                    </span>
                    <input
                      type="text"
                      value={newOptionName}
                      onChange={(e) => setNewOptionName(e.target.value)}
                      placeholder="Nama opsi (contoh: Action, Streaming, dll)"
                      className="w-full min-h-[38px] px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <textarea
                      rows={2}
                      value={newOptionDesc}
                      onChange={(e) => setNewOptionDesc(e.target.value)}
                      placeholder="Deskripsi opsi (opsional, default kosong / tanpa deskripsi)"
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newOptionName.trim()) return;
                          if (editingOptionIndex !== null) {
                            const updated = [...optionItems];
                            updated[editingOptionIndex] = {
                              ...updated[editingOptionIndex],
                              name: newOptionName.trim(),
                              description: newOptionDesc.trim(),
                            };
                            setOptionItems(updated);
                            setEditingOptionIndex(null);
                          } else {
                            setOptionItems([
                              ...optionItems,
                              {
                                id: `opt_${Date.now()}`,
                                name: newOptionName.trim(),
                                description: newOptionDesc.trim(),
                              },
                            ]);
                          }
                          setNewOptionName('');
                          setNewOptionDesc('');
                        }}
                        className="flex-1 min-h-[36px] rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{editingOptionIndex !== null ? 'Perbarui Opsi' : 'Tambahkan Opsi'}</span>
                      </button>
                      {editingOptionIndex !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOptionIndex(null);
                            setNewOptionName('');
                            setNewOptionDesc('');
                          }}
                          className="px-3 min-h-[36px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                        >
                          Batal
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Max Entries */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Jumlah Maksimal Entri</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="100"
                  value={maxEntries}
                  onChange={(e) => setMaxEntries(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full min-h-[48px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-4"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Konfigurasi Field</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Folder Kategori */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-60 flex flex-col justify-end sm:justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400" />
                <span>{editingFolder ? 'Ubah Nama Kategori' : 'Tambah Kategori Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFolder} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Nama Kategori Folder
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  placeholder="Contoh: Tata Artistik & Kostum"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500">
                  Kategori ini akan mengelompokkan beberapa parameter penilaian video.
                </p>
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2"
              >
                <Check className="w-4 h-4" />
                <span>{editingFolder ? 'Simpan Perubahan' : 'Buat Kategori'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Field Artis Baru */}
      {isArtistFieldModalOpen && (
        <div className="fixed inset-0 z-60 flex flex-col justify-end sm:justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
              <h3 className="text-base font-bold text-white">Tambah Field Form Artis Baru</h3>
              <button
                type="button"
                onClick={() => setIsArtistFieldModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!artistFieldLabel.trim()) return;

                const newF: CustomFieldDefinition = {
                  id: `art_field_${Date.now()}`,
                  key: artistFieldLabel.trim().toLowerCase().replace(/\s+/g, '_'),
                  label: artistFieldLabel.trim(),
                  description: artistFieldDesc.trim() || 'Field kustom entri artis',
                  type: artistFieldType,
                  order: artistFields.length + 1,
                  isSystem: false,
                };

                const updated = [...artistFields, newF];
                setArtistFields(updated);
                saveArtistFields(updated);
                setIsArtistFieldModalOpen(false);
              }}
              className="p-5 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Nama Field Artis</label>
                <input
                  type="text"
                  required
                  value={artistFieldLabel}
                  onChange={(e) => setArtistFieldLabel(e.target.value)}
                  placeholder="Contoh: Media Sosial / Lokasi Lahir / Agensi"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Deskripsi Field</label>
                <textarea
                  rows={2}
                  value={artistFieldDesc}
                  onChange={(e) => setArtistFieldDesc(e.target.value)}
                  placeholder="Penjelasan fungsi field ini pada profil artis..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Tipe Field</label>
                <select
                  value={artistFieldType}
                  onChange={(e) => setArtistFieldType(e.target.value as FieldType)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="custom_text">Text (Teks Kustom)</option>
                  <option value="number">Number (Angka - Support Dynamic Filtering)</option>
                  <option value="button_link">Button/Link (Tombol Tautan)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Field Artis</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Parameter Item */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-60 flex flex-col justify-end sm:justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-indigo-400" />
                  <span>{editingItem ? 'Ubah Parameter' : 'Tambah Parameter Penilaian'}</span>
                </h3>
                {targetFolderForNewItem && (
                  <p className="text-[11px] text-indigo-300 mt-0.5">
                    Kategori: {targetFolderForNewItem.name}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Nama Parameter Penilaian
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={itemNameInput}
                  onChange={(e) => setItemNameInput(e.target.value)}
                  placeholder="Contoh: Tata Rias & Karakterisasi"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500">
                  Parameter ini akan dinilai dengan skala nilai 0 - 100 di form video.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Deskripsi Parameter (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={itemDescriptionInput}
                  onChange={(e) => setItemDescriptionInput(e.target.value)}
                  placeholder="Contoh: Fokus pada sudut kamera dinamis, keharmonisan pencahayaan dan tone warna (default tanpa deskripsi)"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fungsi deskripsi item adalah sebagai deskripsi di bawah nama item di halaman buat/edit video. Default adalah tanpa deskripsi.
                </p>
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingItem ? 'Simpan Perubahan' : 'Tambahkan Parameter'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* In-app Confirmation Modal for Deletions and Resets */}
      <ConfirmModal
        isOpen={!!confirmModalData}
        title={confirmModalData?.title || 'Konfirmasi'}
        message={confirmModalData?.message || ''}
        confirmText={confirmModalData?.confirmText || 'Ya, Lanjutkan'}
        cancelText={confirmModalData?.cancelText || 'Batal'}
        isDanger={confirmModalData?.isDanger !== false}
        onConfirm={() => {
          confirmModalData?.onConfirm();
          setConfirmModalData(null);
        }}
        onClose={() => setConfirmModalData(null)}
      />

      {/* In-app Simple Alert Dialog */}
      {alertMessage && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-950/60 border border-amber-800/80 text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Pemberitahuan</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{alertMessage}</p>
            <button
              type="button"
              onClick={() => setAlertMessage(null)}
              className="w-full min-h-[42px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
