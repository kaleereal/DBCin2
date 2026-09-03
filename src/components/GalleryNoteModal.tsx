import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Users,
  Search,
  Bold,
  Italic,
  Heading,
  List,
  Image as ImageIcon,
  Quote,
  X,
  Check,
  Sparkles,
  Upload,
  BookOpen,
} from 'lucide-react';
import { GalleryNote, NoteBlock, Artist } from '../types';

interface GalleryNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: GalleryNote) => void;
  initialNote?: GalleryNote | null;
  artists: Artist[];
  readOnlyInitial?: boolean;
}

export const GalleryNoteModal: React.FC<GalleryNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote,
  artists,
  readOnlyInitial = false,
}) => {
  const [isReadOnly, setIsReadOnly] = useState(readOnlyInitial);
  const [title, setTitle] = useState(initialNote?.title || 'Catatan Baru');
  const [blocks, setBlocks] = useState<NoteBlock[]>(
    initialNote?.blocks ? JSON.parse(JSON.stringify(initialNote.blocks)) : [
      { id: 'b_1', type: 'heading', content: 'Judul Utama' },
      { id: 'b_2', type: 'text', content: 'Tuliskan catatan detail di sini...' },
    ]
  );
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>(
    initialNote?.linkedArtistIds ? [...initialNote.linkedArtistIds] : []
  );

  useEffect(() => {
    if (isOpen) {
      if (initialNote) {
        setTitle(initialNote.title || '');
        setBlocks(initialNote.blocks ? JSON.parse(JSON.stringify(initialNote.blocks)) : []);
        setSelectedArtistIds(initialNote.linkedArtistIds ? [...initialNote.linkedArtistIds] : []);
      } else {
        setTitle('Catatan Baru');
        setBlocks([
          { id: 'b_1', type: 'heading', content: 'Judul Utama' },
          { id: 'b_2', type: 'text', content: 'Tuliskan catatan detail di sini...' },
        ]);
        setSelectedArtistIds([]);
      }
      setIsReadOnly(readOnlyInitial);
    }
  }, [initialNote, isOpen, readOnlyInitial]);

  if (!isOpen) return null;

  // Local File Upload Handler -> Base64
  const handleFileUpload = (blockId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateBlockContent(blockId, base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Add new block (Poin 4.1 & 4.2: Add Component / Add Block)
  const addBlock = (type: NoteBlock['type']) => {
    const newBlock: NoteBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      content: type === 'heading' ? 'Sub-judul' : type === 'image' ? '' : type === 'quote' ? 'Kutipan inspiratif...' : 'Konten blok baru...',
    };
    setBlocks([...blocks, newBlock]);
  };

  // Update block content
  const updateBlockContent = (id: string, content: string) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  // Toggle formatting (Poin 4.3: Keyboard Toolbar / Styling)
  const toggleBlockFormatting = (id: string, format: 'bold' | 'italic') => {
    setBlocks(
      blocks.map((b) => {
        if (b.id !== id) return b;
        return {
          ...b,
          [format]: !b[format],
        };
      })
    );
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const toggleArtistLink = (artistId: string) => {
    if (selectedArtistIds.includes(artistId)) {
      setSelectedArtistIds(selectedArtistIds.filter((id) => id !== artistId));
    } else {
      setSelectedArtistIds([...selectedArtistIds, artistId]);
    }
  };

  const handleSave = () => {
    const savedNote: GalleryNote = {
      id: initialNote?.id || `note_${Date.now()}`,
      title: title.trim() || 'Untitled Note',
      blocks,
      linkedArtistIds: selectedArtistIds,
      createdAt: initialNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(savedNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex flex-col justify-end sm:justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg mx-auto bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              {isReadOnly ? 'Detail Catatan Galeri' : (initialNote ? 'Edit Catatan Gallery' : 'Buat Catatan Gallery Baru')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isReadOnly && (
              <button
                type="button"
                onClick={() => setIsReadOnly(false)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Read-Only Layout vs Editor Layout */}
        {isReadOnly ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <h1 className="text-xl font-black text-white tracking-tight leading-snug">{title}</h1>

            <div className="space-y-3 pt-2">
              {blocks.map((block) => {
                if (block.type === 'heading') {
                  return (
                    <h2
                      key={block.id}
                      className={`text-base font-extrabold text-indigo-300 pt-2 border-b border-slate-800/60 pb-1 ${
                        block.bold ? 'font-black' : ''
                      } ${block.italic ? 'italic' : ''}`}
                    >
                      {block.content}
                    </h2>
                  );
                }
                if (block.type === 'image') {
                  return (
                    <div key={block.id} className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md my-2">
                      {block.content ? (
                        <img
                          src={block.content}
                          alt="Galeri Catatan"
                          referrerPolicy="no-referrer"
                          className="w-full h-auto max-h-[500px] object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-500 italic">Gambar tidak tersedia</div>
                      )}
                    </div>
                  );
                }
                if (block.type === 'quote') {
                  return (
                    <blockquote
                      key={block.id}
                      className="p-3 my-2 border-l-4 border-indigo-500 bg-slate-950/80 rounded-r-xl text-xs text-indigo-200 italic"
                    >
                      "{block.content}"
                    </blockquote>
                  );
                }
                if (block.type === 'bullet_list') {
                  return (
                    <div key={block.id} className="flex items-start gap-2 text-xs text-slate-200 pl-2">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span className={`${block.bold ? 'font-bold' : ''} ${block.italic ? 'italic' : ''}`}>
                        {block.content}
                      </span>
                    </div>
                  );
                }
                return (
                  <p
                    key={block.id}
                    className={`text-xs text-slate-300 leading-relaxed whitespace-pre-wrap ${
                      block.bold ? 'font-bold' : ''
                    } ${block.italic ? 'italic' : ''}`}
                  >
                    {block.content}
                  </p>
                );
              })}
            </div>
          </div>
        ) : (
          /* Note Editor Body */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Note Title Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Judul Catatan</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan Judul Catatan..."
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-black text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Input / Keyboard Formatting Toolbar */}
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Add Component:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => addBlock('heading')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-indigo-300 flex items-center gap-1 border border-slate-800 cursor-pointer"
                  title="Tambah Heading"
                >
                  <Heading className="w-3.5 h-3.5" />
                  <span>Header</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('text')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1 border border-slate-800 cursor-pointer"
                  title="Tambah Teks"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Teks</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('bullet_list')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1 border border-slate-800 cursor-pointer"
                  title="Tambah List"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('quote')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-amber-300 flex items-center gap-1 border border-slate-800 cursor-pointer"
                  title="Tambah Kutipan"
                >
                  <Quote className="w-3.5 h-3.5" />
                  <span>Kutipan</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('image')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-emerald-300 flex items-center gap-1 border border-slate-800 cursor-pointer"
                  title="Tambah Gambar"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Gambar</span>
                </button>
              </div>
            </div>

            {/* Blocks Editor */}
            <div className="space-y-3">
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Blok #{idx + 1} ({block.type})</span>
                    <div className="flex items-center gap-1">
                      {block.type !== 'image' && (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleBlockFormatting(block.id, 'bold')}
                            className={`p-1 rounded cursor-pointer ${block.bold ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
                            title="Bold"
                          >
                            <Bold className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleBlockFormatting(block.id, 'italic')}
                            className={`p-1 rounded cursor-pointer ${block.italic ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
                            title="Italic"
                          >
                            <Italic className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="p-1 rounded hover:bg-rose-950 text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                        title="Hapus Blok"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {block.type === 'heading' ? (
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      className={`w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${block.bold ? 'font-black' : ''} ${block.italic ? 'italic' : ''}`}
                    />
                  ) : block.type === 'image' ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => updateBlockContent(block.id, e.target.value)}
                          placeholder="URL Gambar atau Upload..."
                          className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                        <label className="px-3 min-h-[38px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1 shrink-0 transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Galeri</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(block.id, e)}
                          />
                        </label>
                      </div>
                      {block.content && (
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                          <img src={block.content} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      rows={2}
                      value={block.content}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      className={`w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${block.bold ? 'font-bold' : ''} ${block.italic ? 'italic' : ''}`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Link to Artist */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tautkan ke Artis</span>
                </span>
                <span className="text-[10px] text-indigo-400 font-bold">{selectedArtistIds.length} Artis</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {artists.map((art) => {
                  const isSelected = selectedArtistIds.includes(art.id);
                  return (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => toggleArtistLink(art.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 border cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{art.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0 flex items-center gap-2">
          {isReadOnly ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Selesai Membaca
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 min-h-[46px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Catatan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
