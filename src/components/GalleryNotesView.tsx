import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Copy,
  Edit2,
  Users,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { GalleryNote, Artist } from '../types';
import {
  getStoredGalleryNotes,
  saveGalleryNotes,
  getStoredArtists,
} from '../utils/storage';
import { GalleryNoteModal } from './GalleryNoteModal';

interface GalleryNotesViewProps {
  artists?: Artist[];
  selectedNoteId?: string | null;
  onSelectArtist?: (artistId: string) => void;
  onSelectNote?: (noteId: string | null) => void;
}

export const GalleryNotesView: React.FC<GalleryNotesViewProps> = ({
  artists = [],
  selectedNoteId = null,
  onSelectArtist,
  onSelectNote,
}) => {
  const [notes, setNotes] = useState<GalleryNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<GalleryNote | null>(null);
  const [copyToast, setCopyToast] = useState(false);

  const effectiveArtists = artists.length > 0 ? artists : getStoredArtists();

  useEffect(() => {
    setNotes(getStoredGalleryNotes());
  }, []);

  const activeStandaloneNote = selectedNoteId
    ? notes.find((n) => n.id === selectedNoteId)
    : null;

  const handleOpenCreate = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: GalleryNote) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleSaveNote = (savedNote: GalleryNote) => {
    const existingIndex = notes.findIndex((n) => n.id === savedNote.id);
    let updated: GalleryNote[] = [];
    if (existingIndex >= 0) {
      updated = notes.map((n) => (n.id === savedNote.id ? savedNote : n));
    } else {
      updated = [savedNote, ...notes];
    }
    setNotes(updated);
    saveGalleryNotes(updated);
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    saveGalleryNotes(updated);
  };

  // Quick Action: Duplikat Catatan (Poin 4.4)
  const handleDuplicateNote = (note: GalleryNote) => {
    const duplicated: GalleryNote = {
      ...note,
      id: `note_${Date.now()}`,
      title: `${note.title} (Salinan)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...notes];
    setNotes(updated);
    saveGalleryNotes(updated);
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.blocks.some((b) => b.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenNoteDetail = (noteId: string) => {
    if (onSelectNote) {
      onSelectNote(noteId);
    } else {
      window.location.hash = `#/gallery_note/${noteId}`;
    }
  };

  const handleBackToList = () => {
    if (onSelectNote) {
      onSelectNote(null);
    } else {
      window.location.hash = '#/gallery_notes';
    }
  };

  const handleCopyNoteUrl = (noteId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/gallery_note/${noteId}`;
    navigator.clipboard.writeText(url);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  // STANDALONE PAGE VIEW for a single Gallery Note (Requirement B.1)
  if (activeStandaloneNote) {
    const linkedArtists = effectiveArtists.filter((a) =>
      activeStandaloneNote.linkedArtistIds?.includes(a.id)
    );

    return (
      <div id="gallery-note-standalone-page" className="space-y-4 pb-28 animate-in fade-in">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={handleBackToList}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer active:scale-95"
          >
            <span>← Kembali ke Semua Catatan</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleCopyNoteUrl(activeStandaloneNote.id)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-indigo-300 text-xs font-semibold transition cursor-pointer"
              title="Salin URL Unique Catatan Ini"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDuplicateNote(activeStandaloneNote)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-indigo-300 text-xs font-semibold transition cursor-pointer"
              title="Duplikat Catatan"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleOpenEdit(activeStandaloneNote)}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleDeleteNote(activeStandaloneNote.id);
                handleBackToList();
              }}
              className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:text-rose-200 text-xs font-semibold transition cursor-pointer"
              title="Hapus Catatan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Copy Toast Notification */}
        {copyToast && (
          <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs font-bold animate-in fade-in text-center">
            URL Unik Catatan berhasil disalin ke clipboard!
          </div>
        )}

        {/* Standalone Page Content Header */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              Standalone Gallery Page
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(activeStandaloneNote.updatedAt).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight leading-snug">
            {activeStandaloneNote.title}
          </h1>

          {/* Linked Artists Badges */}
          {linkedArtists.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <Users className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-slate-400">Artis Terkait:</span>
              <div className="flex flex-wrap gap-1.5">
                {linkedArtists.map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => onSelectArtist?.(art.id)}
                    className="px-2.5 py-1 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-800/60 text-xs font-bold transition cursor-pointer"
                  >
                    {art.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Standalone Page Body - Full Component Blocks Rendering */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          {activeStandaloneNote.blocks.map((block) => {
            if (block.type === 'heading') {
              return (
                <h2
                  key={block.id}
                  className={`text-lg font-extrabold text-indigo-300 pt-3 border-b border-slate-800/80 pb-1.5 ${
                    block.bold ? 'font-black' : ''
                  } ${block.italic ? 'italic' : ''}`}
                >
                  {block.content}
                </h2>
              );
            }
            if (block.type === 'image') {
              return (
                <div
                  key={block.id}
                  className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg my-3"
                >
                  {block.content ? (
                    <img
                      src={block.content}
                      alt="Galeri Catatan"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto max-h-[600px] object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500 italic">
                      Gambar tidak tersedia
                    </div>
                  )}
                </div>
              );
            }
            if (block.type === 'quote') {
              return (
                <blockquote
                  key={block.id}
                  className="p-4 my-3 border-l-4 border-indigo-500 bg-slate-950/80 rounded-r-2xl text-sm text-indigo-200 italic shadow-inner"
                >
                  "{block.content}"
                </blockquote>
              );
            }
            if (block.type === 'bullet_list') {
              return (
                <div key={block.id} className="flex items-start gap-2 text-sm text-slate-200 pl-2">
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
                className={`text-sm text-slate-200 leading-relaxed whitespace-pre-wrap ${
                  block.bold ? 'font-bold' : ''
                } ${block.italic ? 'italic' : ''}`}
              >
                {block.content}
              </p>
            );
          })}
        </div>

        {/* Editor Modal */}
        {isModalOpen && (
          <GalleryNoteModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={(saved) => {
              handleSaveNote(saved);
              setIsModalOpen(false);
            }}
            initialNote={editingNote}
            artists={effectiveArtists}
          />
        )}
      </div>
    );
  }

  return (
    <div id="gallery-notes-view" className="space-y-4 pb-28 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Catatan Gallery</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar entri catatan gallery (Standalone Page per entri)
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="min-h-[42px] px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Catatan</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari dalam catatan gallery..."
          className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/50 border border-slate-800/80">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">Belum ada Catatan Gallery</p>
            <p className="text-xs text-slate-500 mt-1">
              Klik "Buat Catatan" untuk membuat entri catatan baru.
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const linkedArtists = effectiveArtists.filter((a) =>
              note.linkedArtistIds?.includes(a.id)
            );

            return (
              <div
                key={note.id}
                onClick={() => handleOpenNoteDetail(note.id)}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md hover:border-indigo-500/60 transition cursor-pointer group"
              >
                {/* Note Title & Quick Actions Toolbar (Poin 4.4) */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{note.title}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(note.updatedAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Quick Actions (Simpan, Hapus, Duplikat, Tautkan) */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleDuplicateNote(note)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-indigo-300 transition"
                      title="Duplikat Catatan"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(note)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-amber-300 transition"
                      title="Edit / Baca Catatan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1.5 rounded-lg bg-slate-800/80 text-slate-500 hover:text-rose-400 transition"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Blocks Content Preview */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                  {note.blocks.slice(0, 3).map((block) => (
                    <div key={block.id} className="line-clamp-2">
                      {block.type === 'heading' ? (
                        <strong className="text-indigo-300 font-bold">{block.content}</strong>
                      ) : block.type === 'bullet_list' ? (
                        <span>• {block.content}</span>
                      ) : (
                        <span>{block.content}</span>
                      )}
                    </div>
                  ))}
                  {note.blocks.length > 3 && (
                    <span className="text-[10px] text-slate-500 italic block">
                      +{note.blocks.length - 3} blok konten lainnya...
                    </span>
                  )}
                </div>

                {/* Linked Artists */}
                {linkedArtists.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {linkedArtists.map((art) => (
                        <button
                          key={art.id}
                          type="button"
                          onClick={() => onSelectArtist?.(art.id)}
                          className="px-2 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/50 text-[10px] font-bold hover:text-white transition"
                        >
                          {art.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <GalleryNoteModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveNote}
          initialNote={editingNote}
          artists={effectiveArtists}
        />
      )}
    </div>
  );
};
