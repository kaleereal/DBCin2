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
  onSelectArtist?: (artistId: string) => void;
}

export const GalleryNotesView: React.FC<GalleryNotesViewProps> = ({
  artists = [],
  onSelectArtist,
}) => {
  const [notes, setNotes] = useState<GalleryNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<GalleryNote | null>(null);

  const effectiveArtists = artists.length > 0 ? artists : getStoredArtists();

  useEffect(() => {
    setNotes(getStoredGalleryNotes());
  }, []);

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
            Daftar entri catatan gallery yang dapat ditautkan ke entri artis
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
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md hover:border-slate-700 transition"
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
                  <div className="flex items-center gap-1">
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
                      title="Edit Catatan"
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
