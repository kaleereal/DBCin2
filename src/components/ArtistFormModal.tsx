import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Image as ImageIcon, Link as LinkIcon, Info, Upload, AlertCircle } from 'lucide-react';
import { Artist, ArtistLink, GalleryNote, CustomFieldDefinition } from '../types';
import { getStoredGalleryNotes, saveGalleryNotes, getStoredArtistFields } from '../utils/storage';
import { GalleryNoteModal } from './GalleryNoteModal';

interface ArtistFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (artistData: Partial<Artist>) => void;
  initialArtist?: Artist | null;
}

export const ArtistFormModal: React.FC<ArtistFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialArtist,
}) => {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [bio, setBio] = useState('');
  const [birthMonthYear, setBirthMonthYear] = useState('');
  const [selectedGalleryNoteIds, setSelectedGalleryNoteIds] = useState<string[]>([]);
  const [links, setLinks] = useState<ArtistLink[]>([]);
  const [embedImages, setEmbedImages] = useState<string[]>([]);
  const [newEmbedUrl, setNewEmbedUrl] = useState('');
  const [embedUrlError, setEmbedUrlError] = useState('');
  const [formError, setFormError] = useState('');
  const [roleText, setRoleText] = useState('');
  const [artistFields, setArtistFields] = useState<CustomFieldDefinition[]>([]);
  const [customTextFields, setCustomTextFields] = useState<Record<string, string>>({});
  const [customNumberFields, setCustomNumberFields] = useState<Record<string, number>>({});

  const [availableGalleryNotes, setAvailableGalleryNotes] = useState<GalleryNote[]>([]);
  const [isCreatingDirectNote, setIsCreatingDirectNote] = useState(false);

  useEffect(() => {
    setAvailableGalleryNotes(getStoredGalleryNotes());
    const fields = getStoredArtistFields();
    setArtistFields(fields);

    if (initialArtist) {
      setName(initialArtist.name || '');
      setAvatarUrl(initialArtist.avatarUrl || '');
      setCoverUrl(initialArtist.coverUrl || '');
      setBio(initialArtist.bio || '');
      setBirthMonthYear(initialArtist.birthMonthYear || '');
      setSelectedGalleryNoteIds(initialArtist.galleryNoteIds || []);
      setLinks(initialArtist.links || []);
      setEmbedImages(initialArtist.embedImages || []);
      setRoleText(initialArtist.textFields?.['Peran Utama'] || '');
      setCustomTextFields(initialArtist.textFields || {});
      setCustomNumberFields(initialArtist.numberFields || {});
    } else {
      setName('');
      setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');
      setCoverUrl('https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1000&auto=format&fit=crop&q=80');
      setBio('');
      setBirthMonthYear('');
      setSelectedGalleryNoteIds([]);
      setLinks([]);
      setEmbedImages([]);
      setRoleText('');
      setCustomTextFields({});
      setCustomNumberFields({});
    }
    setNewEmbedUrl('');
    setEmbedUrlError('');
    setFormError('');
  }, [initialArtist, isOpen]);

  // Handle local image file upload -> Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'cover' | 'embed') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (target === 'avatar') setAvatarUrl(base64);
      else if (target === 'cover') setCoverUrl(base64);
      else if (target === 'embed') {
        setEmbedImages((prev) => [...prev, base64]);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so user can re-upload same file if needed
    e.target.value = '';
  };

  const handleAddLink = () => {
    setLinks([...links, { id: `link_${Date.now()}`, label: 'Website / Portofolio', url: 'https://' }]);
  };

  const handleUpdateLink = (id: string, updates: Partial<ArtistLink>) => {
    setLinks(links.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const handleDeleteLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
  };

  // Helper to robustly extract and normalize image URLs from direct links, HTML tags, markdown, or Google Drive
  const extractImageUrls = (raw: string): string[] => {
    if (!raw || !raw.trim()) return [];

    // Check if user pasted HTML tag like <img src="..."> or <iframe src="...">
    const imgMatches = [...raw.matchAll(/src=["']([^"']+)["']/gi)];
    if (imgMatches.length > 0) {
      return imgMatches.map((m) => m[1]);
    }

    // Check if user pasted Markdown image ![alt](url)
    const mdMatches = [...raw.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/gi)];
    if (mdMatches.length > 0) {
      return mdMatches.map((m) => m[1]);
    }

    // Split by comma or newlines if multiple URLs were pasted
    const items = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    return items.map((item) => {
      let clean = item.replace(/^["']|["']$/g, '');
      // Google Drive link converter
      const gDriveMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (gDriveMatch) {
        return `https://drive.google.com/thumbnail?id=${gDriveMatch[1]}&sz=w1000`;
      }
      // Dropbox dl=0 to raw=1
      if (clean.includes('dropbox.com') && clean.includes('dl=0')) {
        clean = clean.replace('dl=0', 'raw=1');
      }
      if (!/^https?:\/\//i.test(clean) && !clean.startsWith('data:image/')) {
        clean = 'https://' + clean;
      }
      return clean;
    });
  };

  const handleAddEmbedUrl = () => {
    const trimmed = newEmbedUrl.trim();
    if (!trimmed) {
      setEmbedUrlError('Masukkan atau tempel URL gambar terlebih dahulu.');
      return;
    }

    const urls = extractImageUrls(trimmed);
    if (urls.length === 0) {
      setEmbedUrlError('Format URL gambar tidak valid.');
      return;
    }

    setEmbedImages((prev) => [...prev, ...urls]);
    setNewEmbedUrl('');
    setEmbedUrlError('');
  };

  const handleDeleteEmbedImage = (index: number) => {
    setEmbedImages(embedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama artis wajib diisi.');
      return;
    }

    // Auto-save any pending URL written in the embed input box
    let finalEmbedImages = [...embedImages];
    if (newEmbedUrl.trim()) {
      const pendingUrls = extractImageUrls(newEmbedUrl.trim());
      if (pendingUrls.length > 0) {
        finalEmbedImages = [...finalEmbedImages, ...pendingUrls];
      }
    }

    const payload: Partial<Artist> = {
      name: name.trim(),
      avatarUrl:
        avatarUrl.trim() ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      coverUrl: coverUrl.trim(),
      bio: bio.trim(),
      birthMonthYear,
      galleryNoteIds: selectedGalleryNoteIds,
      links,
      embedImages: finalEmbedImages,
      textFields: {
        ...customTextFields,
        'Peran Utama': roleText.trim() || customTextFields['Peran Utama'] || 'Aktor / Seniman Film',
      },
      numberFields: customNumberFields,
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="artist-form-modal"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {initialArtist ? 'Ubah Profil Artis' : 'Tambah Profil Artis'}
            </h2>
            <p className="text-xs text-slate-400">
              Data profil, foto cover, link portofolio, dan catatan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice: No manual rating calculation */}
        <div className="mx-5 mt-4 p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-start gap-2.5 text-xs text-indigo-300 shrink-0">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p>
            <strong>Catatan Sistem:</strong> Entri artis tidak memiliki input rating manual. Nilai overall artis dihitung otomatis dari rata-rata video yang ditautkan.
          </p>
        </div>

        {formError && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center gap-2 text-xs text-rose-200 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 pb-28">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-200">Nama Artis *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="Contoh: Reza Rahadian / Christopher Nolan"
              className="w-full min-h-[48px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Field Bulan-Tahun Lahir (Month/Year) - WAJIB ADA (Poin 5A.3) */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-200 flex items-center justify-between">
              <span>Bulan &amp; Tahun Lahir (Perhitungan Umur Otomatis)</span>
              <span className="text-amber-400 text-xs font-bold">Field Wajib</span>
            </label>
            <input
              type="month"
              value={birthMonthYear}
              onChange={(e) => setBirthMonthYear(e.target.value)}
              className="w-full min-h-[48px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400">
              Sistem akan menghitung umur artis secara otomatis berdasarkan entri ini.
            </p>
          </div>

          {/* Field Galeri Catatan (Gallery Notes) - Direct Create & Auto-link (Poin 3) */}
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-200">Field Galeri Catatan</label>
              <button
                type="button"
                onClick={() => setIsCreatingDirectNote(true)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat Catatan Baru di Sini</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">Hubungkan profil artis ini ke Catatan Gallery atau buat baru secara langsung.</p>

            {availableGalleryNotes.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Belum ada Catatan Gallery yang dibuat. Klik tombol di atas untuk membuat!</p>
            ) : (
              <div className="space-y-1.5 pt-1 max-h-40 overflow-y-auto">
                {availableGalleryNotes.map((note) => {
                  const isChecked = selectedGalleryNoteIds.includes(note.id);
                  return (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setSelectedGalleryNoteIds(selectedGalleryNoteIds.filter((id) => id !== note.id));
                        } else {
                          setSelectedGalleryNoteIds([...selectedGalleryNoteIds, note.id]);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-950/80 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{note.title}</span>
                      {isChecked && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Fields configured via Settings (Struktur & Urutan Field Artis) */}
          {artistFields
            .filter((f) => !['galleryNoteIds', 'birthMonthYear', 'links'].includes(f.key))
            .map((field) => {
              if (field.key === 'Peran Utama') {
                return (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-200">{field.label}</label>
                    <input
                      type="text"
                      value={roleText}
                      onChange={(e) => setRoleText(e.target.value)}
                      placeholder="Contoh: Aktor Utama / Sutradara & Produser"
                      className="w-full min-h-[48px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                );
              }

              if (field.type === 'number') {
                return (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-200">{field.label}</label>
                    <p className="text-xs text-slate-400">{field.description}</p>
                    <input
                      type="number"
                      value={customNumberFields[field.label] ?? ''}
                      onChange={(e) =>
                        setCustomNumberFields({
                          ...customNumberFields,
                          [field.label]: e.target.value !== '' ? Number(e.target.value) : 0,
                        })
                      }
                      placeholder={`Masukkan ${field.label}...`}
                      className="w-full min-h-[48px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                );
              }

              return (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-200">{field.label}</label>
                  <p className="text-xs text-slate-400">{field.description}</p>
                  <input
                    type="text"
                    value={customTextFields[field.label] || ''}
                    onChange={(e) =>
                      setCustomTextFields({
                        ...customTextFields,
                        [field.label]: e.target.value,
                      })
                    }
                    placeholder={`Masukkan ${field.label}...`}
                    className="w-full min-h-[48px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              );
            })}

          {/* Avatar URL & Upload */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-200">Foto Profil (Avatar)</label>
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
                alt="Avatar preview"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
                }}
                className="w-14 h-14 rounded-full object-cover bg-slate-800 ring-2 ring-indigo-500/50 shrink-0"
              />
              <div className="flex-1 space-y-1.5">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://... atau upload foto"
                  className="w-full min-h-[40px] px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Foto dari Perangkat</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'avatar')}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Cover Banner URL & Upload */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-200">Foto Cover / Banner Profil</label>
            {coverUrl && (
              <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={coverUrl}
                  alt="Cover preview"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1000&auto=format&fit=crop&q=80';
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="URL gambar cover banner..."
                className="flex-1 min-h-[40px] px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <label className="px-3 min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer flex items-center gap-1.5 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'cover')}
                />
              </label>
            </div>
          </div>

          {/* Bio / Catatan */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-200">Catatan &amp; Biografi</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan latar belakang karier, keunikan akting, atau catatan filmografi..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
          </div>

          {/* Links Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-indigo-400" />
                <span>Tautan Eksternal</span>
              </label>
              <button
                type="button"
                onClick={handleAddLink}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
              >
                + Tambah Link
              </button>
            </div>

            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.id} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => handleUpdateLink(link.id, { label: e.target.value })}
                    placeholder="Label (misal: IMDb)"
                    className="w-28 min-h-[38px] px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleUpdateLink(link.id, { url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 min-h-[38px] px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteLink(link.id)}
                    className="p-1 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Embed Images Gallery Section */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>URL Embed Gambar &amp; Galeri</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                {embedImages.length} Gambar
              </span>
            </div>

            {/* URL Input Form Bar */}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEmbedUrl}
                  onChange={(e) => {
                    setNewEmbedUrl(e.target.value);
                    if (embedUrlError) setEmbedUrlError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEmbedUrl();
                    }
                  }}
                  placeholder="Tempel link gambar (https://..., <img src=...>, atau Google Drive)"
                  className={`flex-1 min-h-[42px] px-3.5 rounded-xl bg-slate-900 border text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                    embedUrlError ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddEmbedUrl}
                  className="min-h-[42px] px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/25"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah URL</span>
                </button>
              </div>

              {embedUrlError && (
                <p className="text-[11px] text-rose-400 font-medium pl-1">
                  {embedUrlError}
                </p>
              )}

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-slate-500">
                  Mendukung link web, link embed tag, CDN, &amp; Google Drive
                </span>
                <label className="inline-flex items-center gap-1.5 font-bold text-slate-400 hover:text-indigo-300 cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Lokal</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'embed')}
                  />
                </label>
              </div>
            </div>

            {/* Embed Thumbnails Grid */}
            {embedImages.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2 text-center border border-dashed border-slate-800 rounded-xl">
                Belum ada gambar embed yang ditambahkan. Tempel URL di atas untuk menambahkan.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {embedImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group shadow-sm"
                  >
                    <img
                      src={imgUrl}
                      alt={`Embed ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-start justify-end p-1.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteEmbedImage(idx)}
                        className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 shadow-md transition"
                        title="Hapus gambar embed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteEmbedImage(idx)}
                      className="sm:hidden absolute top-1 right-1 p-1 rounded-md bg-black/75 text-rose-400 hover:text-rose-300"
                      title="Hapus gambar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold text-slate-300">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct Note Creation Modal inside Artist Form (Poin 3) */}
          {isCreatingDirectNote && (
            <GalleryNoteModal
              isOpen={isCreatingDirectNote}
              onClose={() => setIsCreatingDirectNote(false)}
              onSave={(newNote) => {
                const currentNotes = getStoredGalleryNotes();
                const updatedList = [newNote, ...currentNotes];
                saveGalleryNotes(updatedList);
                setAvailableGalleryNotes(updatedList);
                // Auto-link newly created note to this artist!
                setSelectedGalleryNoteIds((prev) => [...prev, newNote.id]);
                setIsCreatingDirectNote(false);
              }}
              initialNote={null}
              artists={[]}
            />
          )}

          {/* Sticky Save Button */}
          <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-30">
            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm uppercase tracking-wider shadow-xl shadow-indigo-600/30 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5 stroke-[3px]" />
              <span>Simpan Profil Artis</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
