import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  ExternalLink,
  Play,
  Film,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  Sliders,
  FileText,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Video, Artist, CustomFieldDefinition } from '../types';
import { RatingBadge } from './RatingBadge';
import { calculateOverallRating } from '../utils/storage';

interface VideoDetailViewProps {
  video: Video;
  artists: Artist[];
  fieldDefinitions: CustomFieldDefinition[];
  onBack: () => void;
  onEditVideo: (video: Video) => void;
  onDeleteVideo?: (videoId: string, title: string) => void;
  onSelectArtist: (artistId: string) => void;
  onSelectFilterTag: (fieldId: string, option: string) => void;
}

export const VideoDetailView: React.FC<VideoDetailViewProps> = ({
  video,
  artists,
  fieldDefinitions,
  onBack,
  onEditVideo,
  onDeleteVideo,
  onSelectArtist,
  onSelectFilterTag,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    (video.ratingFolders || []).forEach((f, idx) => {
      initial[f.id] = idx === 0; // Open first folder by default
    });
    return initial;
  });

  const overallScore =
    typeof video.overallRating === 'number'
      ? video.overallRating
      : calculateOverallRating(video.ratingFolders);
  const embedUrl = video.metadata?.embedUrl;
  const thumbnailUrl = video.metadata?.thumbnailUrl;

  // Resolve linked artists
  const linkedArtists = (video.artistIds || [])
    .map((id) => artists.find((a) => a.id === id))
    .filter(Boolean) as Artist[];

  // Filter choice fields
  const choiceFields = fieldDefinitions.filter(
    (f) => f.type === 'multi_choice' || f.type === 'single_choice'
  );

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Top Sticky Navigation Bar */}
      <div className="flex items-center justify-between gap-3 sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md -mx-4 px-4 py-3 border-b border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEditVideo(video)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm shadow-indigo-600/30 active:scale-95"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Video</span>
          </button>
          {onDeleteVideo && (
            <button
              type="button"
              onClick={() => onDeleteVideo(video.id, video.title)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/60 transition active:scale-95"
              title="Hapus Video"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Media Player / Thumbnail Hero */}
      <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl group">
        {isPlaying && embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <div className="relative w-full h-full">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={video.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 text-slate-600">
                <Film className="w-12 h-12 stroke-1 mb-2 text-slate-500" />
                <span className="text-xs font-semibold text-slate-400">Media Preview</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

            {/* Play overlay button if embedUrl exists */}
            {embedUrl && (
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50 backdrop-blur-xs transition transform hover:scale-110 active:scale-95 z-10"
                aria-label="Putar Video"
              >
                <Play className="w-7 h-7 fill-white ml-1" />
              </button>
            )}

            {/* Floating Overall Rating in Hero */}
            <div className="absolute bottom-3 right-3 z-10">
              <RatingBadge score={overallScore} size="lg" />
            </div>
          </div>
        )}
      </div>

      {/* Video Title & Source Link */}
      <div className="space-y-3">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
          {video.title}
        </h1>

        {video.url && (
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 text-xs font-semibold border border-slate-800 transition max-w-full"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Buka Sumber Asli Video</span>
          </a>
        )}
      </div>

      {/* Artis yang Terlibat (Requirement 5: Clicking artist navigates to artist detail) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Artis yang Terlibat ({linkedArtists.length})
            </h2>
          </div>
        </div>

        {linkedArtists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {linkedArtists.map((artist) => (
              <button
                key={artist.id}
                type="button"
                onClick={() => onSelectArtist(artist.id)}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-900/80 transition text-left group active:scale-98"
              >
                <img
                  src={artist.avatarUrl}
                  alt={artist.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0 group-hover:border-indigo-400 transition"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition">
                    {artist.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    Buka Profil &amp; Karya Lengkap ➔
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">Belum ada artis yang ditautkan ke video ini.</p>
        )}
      </div>

      {/* Kategori & Atribut Pilihan (Requirement 8: Clicking choice opens Rank Video filtered by that item) */}
      {choiceFields.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Kategori &amp; Tag Pilihan
              </h2>
            </div>
            <span className="text-[10px] text-slate-500">
              Ketuk item untuk melihat Leaderboard
            </span>
          </div>

          <div className="space-y-3.5">
            {choiceFields.map((field) => {
              let selectedOptions: string[] = [];
              if (field.type === 'multi_choice') {
                selectedOptions = video.multiChoices?.[field.id] || [];
              } else if (field.type === 'single_choice') {
                const val = video.singleChoices?.[field.id];
                if (val && typeof val === 'string' && val.trim()) {
                  selectedOptions = [val.trim()];
                }
              }

              if (selectedOptions.length === 0) return null;

              return (
                <div key={field.id} className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-400 block">
                    {field.label}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedOptions.map((opt) => {
                      const desc = field.optionDescriptions?.[opt];
                      return (
                        <div key={opt} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => onSelectFilterTag(field.id, opt)}
                            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 hover:border-indigo-400 text-indigo-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 group"
                          >
                            <Trophy className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
                            <span>{opt}</span>
                            <span className="text-[10px] text-indigo-400 group-hover:text-indigo-200">
                              (Rank ➔)
                            </span>
                          </button>
                          {desc && (
                            <p className="text-[11px] text-slate-400 pl-1 leading-relaxed max-w-sm">
                              {desc}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rincian Penilaian Folder & Parameter (Requirement 6: Item description display) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Evaluasi &amp; Nilai Parameter
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400">Total Skor:</span>
            <span className="text-sm font-black text-indigo-400">{overallScore.toFixed(1)}</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {(video.ratingFolders || []).map((folder) => {
            const isFolderOpen = openFolders[folder.id];
            const folderAvg =
              folder.items.length > 0
                ? folder.items.reduce((sum, it) => sum + (it.score || 0), 0) / folder.items.length
                : 0;

            return (
              <div
                key={folder.id}
                className="rounded-xl bg-slate-950 border border-slate-800/90 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="font-bold text-xs text-white truncate">{folder.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                      ({folder.items.length} Parameter)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">
                      {folderAvg.toFixed(1)}
                    </span>
                    {isFolderOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isFolderOpen && (
                  <div className="p-3 bg-slate-900/50 border-t border-slate-800/60 space-y-2.5 animate-in fade-in">
                    {folder.items.map((item, iIdx) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/70 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-200">
                              {iIdx + 1}. {item.name}
                            </h4>
                            {/* Requirement 6: Display parameter description */}
                            {item.description && (
                              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-black text-indigo-400 shrink-0">
                            {item.score} / 100
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Catatan / Catatan Ulasan */}
      {video.notes && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Catatan &amp; Ulasan
            </h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-indigo-500">
            {video.notes}
          </p>
        </div>
      )}
    </div>
  );
};
