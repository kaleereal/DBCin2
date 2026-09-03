import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  Film,
  User,
  Star,
  Globe,
  Tags,
  X,
  ZoomIn,
  Trophy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import { Artist, Video, CustomFieldDefinition, VideoArtistPivot } from '../types';
import {
  calculateArtistAggregatedRating,
  getArtistTagRankDetail,
  getStoredArtists,
  getStoredVideos,
  getStoredPivots,
  getStoredRoleWeights,
  recalculateAllVideoPivots,
} from '../utils/storage';
import { RatingBadge } from './RatingBadge';

interface ArtistDetailViewProps {
  artist: Artist;
  videos: Video[];
  fieldDefinitions?: CustomFieldDefinition[];
  allArtists?: Artist[];
  pivots?: VideoArtistPivot[];
  onBack: () => void;
  onEditArtist: (artist: Artist) => void;
  onDeleteArtist?: (artist: Artist) => void;
  onSelectVideo?: (video: Video) => void;
  onSelectFilterTag?: (fieldId: string, option: string) => void;
  onFilterByRole?: (role: string) => void;
}

export const ArtistDetailView: React.FC<ArtistDetailViewProps> = ({
  artist,
  videos,
  fieldDefinitions = [],
  allArtists = [],
  pivots = [],
  onBack,
  onEditArtist,
  onDeleteArtist,
  onSelectVideo,
  onSelectFilterTag,
  onFilterByRole,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'videos' | 'notes'>('videos');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isFootnoteOpen, setIsFootnoteOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Fallback ke penyimpanan jika prop kosong
  const effectiveVideos = useMemo(
    () => (videos && videos.length > 0 ? videos : getStoredVideos()),
    [videos]
  );
  const effectiveArtists = useMemo(
    () => (allArtists && allArtists.length > 0 ? allArtists : getStoredArtists()),
    [allArtists]
  );

  // Filter linked videos
  const linkedVideos = useMemo(
    () => effectiveVideos.filter((v) => v.artistIds && v.artistIds.includes(artist.id)),
    [effectiveVideos, artist.id]
  );
  const { rating: aggregatedRating, videoCount } = calculateArtistAggregatedRating(
    artist.id,
    effectiveVideos
  );

  // Effective pivots (otomatis hitung jika belum ada snapshot tersimpan)
  const effectivePivots = useMemo(() => {
    if (pivots && pivots.length > 0) return pivots;
    const stored = getStoredPivots();
    if (stored && stored.length > 0) return stored;
    const weights = getStoredRoleWeights();
    const { updatedPivots } = recalculateAllVideoPivots(effectiveVideos, weights, []);
    return updatedPivots;
  }, [pivots, effectiveVideos]);

  const roleWeights = useMemo(() => getStoredRoleWeights(), []);

  // Rating Artis: Rata-rata nilai yang didapatkan artis dari semua video tertaut
  // berdasarkan aturan relasi nilai & bobot peran.
  const {
    rating: artistRating,
    totalPoints: totalPivotScore,
    videoOverallAverage: rawVideoAverage,
    videoScores,
  } = useMemo(() => {
    return calculateArtistAggregatedRating(
      artist.id,
      effectiveVideos,
      roleWeights,
      effectivePivots
    );
  }, [artist.id, effectiveVideos, roleWeights, effectivePivots]);

  // Dynamic Aggregated Attributes (Real-time aggregation query from linked videos)
  const dynamicAggregatedAttributes = useMemo(() => {
    // Only target choice fields (multi_choice & single_choice) from Master Settings
    const choiceFields = fieldDefinitions.filter(
      (f) => f.type === 'single_choice' || f.type === 'multi_choice'
    );

    const groups: {
      fieldId: string;
      fieldLabel: string;
      fieldType: string;
      values: string[];
    }[] = [];

    for (const field of choiceFields) {
      const valueSet = new Set<string>();

      for (const vid of linkedVideos) {
        if (field.type === 'single_choice') {
          const val = vid.singleChoices?.[field.id];
          if (val && typeof val === 'string' && val.trim()) {
            valueSet.add(val.trim());
          }
        } else if (field.type === 'multi_choice') {
          const list = vid.multiChoices?.[field.id];
          if (Array.isArray(list)) {
            for (const item of list) {
              if (item && typeof item === 'string' && item.trim()) {
                valueSet.add(item.trim());
              }
            }
          }
        }
      }

      if (valueSet.size > 0) {
        groups.push({
          fieldId: field.id,
          fieldLabel: field.label,
          fieldType: field.type,
          values: Array.from(valueSet).sort(),
        });
      }
    }

    return groups;
  }, [fieldDefinitions, linkedVideos]);

  // Collapsible Footnote descriptions for choice items (Req 7)
  const footnoteItems = useMemo(() => {
    const items: {
      fieldLabel: string;
      optionName: string;
      description: string;
    }[] = [];

    for (const group of dynamicAggregatedAttributes) {
      const fieldDef = fieldDefinitions.find((f) => f.id === group.fieldId);
      if (!fieldDef || !fieldDef.optionDescriptions) continue;

      for (const val of group.values) {
        const desc = fieldDef.optionDescriptions[val];
        if (desc && desc.trim()) {
          items.push({
            fieldLabel: group.fieldLabel,
            optionName: val,
            description: desc.trim(),
          });
        }
      }
    }

    return items;
  }, [dynamicAggregatedAttributes, fieldDefinitions]);

  const coverUrl =
    artist.coverUrl ||
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1000&auto=format&fit=crop&q=80';

  return (
    <div id="artist-detail-view" className="space-y-4 pb-24 animate-in fade-in">
      {/* Top Bar with Back Button and Edit / Delete */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-2">
          {onDeleteArtist && (
            <button
              onClick={() => onDeleteArtist(artist)}
              className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-rose-200 text-xs font-semibold active:scale-95 transition cursor-pointer"
              title="Hapus Profil Artis"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onEditArtist(artist)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-300 text-xs font-semibold active:scale-95 transition"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profil</span>
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
        {/* Large Cover Banner */}
        <div className="relative h-40 w-full bg-slate-950 overflow-hidden">
          <img
            src={coverUrl}
            alt="Cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1000&auto=format&fit=crop&q=80';
            }}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        </div>

        {/* Profile Avatar Centered Overlapping Cover */}
        <div className="relative px-5 pb-5 -mt-16 flex flex-col items-center text-center">
          <div className="relative group">
            <img
              src={artist.avatarUrl}
              alt={artist.name}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-900 shadow-2xl bg-slate-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          <h1 className="mt-3 text-xl sm:text-2xl font-black text-white tracking-tight">
            {artist.name}
          </h1>

          {artist.textFields?.['Peran Utama'] && (
            <button
              type="button"
              onClick={() => onFilterByRole && onFilterByRole(artist.textFields['Peran Utama'])}
              className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-xs font-bold text-indigo-300 hover:text-white transition active:scale-95 cursor-pointer shadow-xs"
              title="Klik untuk melihat peringkat artis dengan Peran Utama ini"
            >
              <span>{artist.textFields['Peran Utama']}</span>
              <span className="text-[10px] text-indigo-400">➔ Peringkat</span>
            </button>
          )}

          {/* Overall Rating Big Badge (Aggregated from linked videos & Pivot SUM) */}
          <div className="mt-4 p-3.5 w-full rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                Rating
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="text-2xl font-black text-amber-300">
                  {artistRating > 0
                    ? Number.isInteger(artistRating)
                      ? artistRating
                      : artistRating.toFixed(1)
                    : '-'}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                {totalPivotScore > 0
                  ? `Poin: ${Number.isInteger(totalPivotScore) ? totalPivotScore : totalPivotScore.toFixed(1)}`
                  : 'Relasi peran'}
              </span>
            </div>

            <div className="h-10 w-px bg-slate-800" />

            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Rata-rata Video
              </span>
              <div className="mt-1 flex items-center gap-1">
                <RatingBadge score={rawVideoAverage} size="md" showIcon />
              </div>
            </div>

            <div className="h-10 w-px bg-slate-800" />

            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Video Tertaut
              </span>
              <div className="mt-1 text-2xl font-black text-white flex items-center gap-1.5">
                <Film className="w-5 h-5 text-indigo-400" />
                <span>{videoCount}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Aggregated Attributes (Real-time Tag Heritage from Linked Videos) */}
          <div className="mt-3.5 p-3.5 w-full rounded-2xl bg-slate-950/90 border border-slate-800/90 text-left space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                <Tags className="w-3.5 h-3.5 text-indigo-400" />
                <span>Atribut Terkait (Warisan Video)</span>
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-950/90 text-indigo-300 font-bold border border-indigo-800/60">
                Real-time Agregat
              </span>
            </div>

            {dynamicAggregatedAttributes.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                {linkedVideos.length === 0
                  ? 'Belum ada video tertaut untuk mengakumulasi atribut & genre.'
                  : 'Video yang tertaut belum memilih pilihan kategori/tag di field pilihan.'}
              </p>
            ) : (
              <div className="space-y-2.5">
                {dynamicAggregatedAttributes.map((group) => (
                  <div key={group.fieldId} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {group.fieldLabel}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.values.map((val) => {
                        const rankDetail = getArtistTagRankDetail(
                          artist.id,
                          group.fieldId,
                          val,
                          effectiveArtists,
                          effectiveVideos,
                          effectivePivots
                        );
                        const rank = rankDetail ? rankDetail.rank : null;
                        const total = rankDetail ? rankDetail.total : null;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => onSelectFilterTag?.(group.fieldId, val)}
                            className="min-h-[32px] px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/60 hover:border-indigo-500 text-indigo-200 hover:text-white transition flex items-center gap-1.5 active:scale-95 group shadow-xs cursor-pointer"
                          >
                            <Trophy className="w-3 h-3 text-amber-400 group-hover:scale-110 transition" />
                            <span>{val}</span>
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-800/80 shadow-xs">
                              {rank
                                ? `Peringkat #${rank}${total && total > 1 ? ` dari ${total}` : ''}`
                                : 'Peringkat ➔'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Switcher: "Video Terkait" | "Catatan & Profil" (Geser horizontal untuk berpindah tab) */}
      <div className="flex rounded-2xl bg-slate-900/90 p-1 border border-slate-800 shadow-inner">
        <button
          onClick={() => setActiveSubTab('videos')}
          className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeSubTab === 'videos'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Video Terkait ({linkedVideos.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('notes')}
          className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeSubTab === 'notes'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Catatan &amp; Profil</span>
        </button>
      </div>

      {/* Tab 1: Video Terkait (Grid 2 Kolom Thumbnail dengan Badge Rating) */}
      {activeSubTab === 'videos' && (
        <div className="space-y-3 animate-in fade-in">
          {linkedVideos.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/50 border border-slate-800/80">
              <Film className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">Belum ada video tertaut</p>
              <p className="text-xs text-slate-500 mt-1">
                Tautkan video ke artis ini saat membuat atau mengubah entri video.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {linkedVideos.map((vid) => {
                const thumb =
                  vid.metadata?.thumbnailUrl ||
                  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80';

                const scoreInfo = videoScores?.find((vs) => vs.videoId === vid.id);
                const roleName = scoreInfo?.roleName || vid.artistRoles?.[artist.id] || 'Artis Utama';
                const roleWeight = scoreInfo?.weight ?? 100;
                const nilaiDidapat = scoreInfo?.scoreObtained ?? vid.overallRating;
                const formattedScore = Number.isInteger(nilaiDidapat)
                  ? nilaiDidapat
                  : nilaiDidapat.toFixed(1);

                return (
                  <div
                    key={vid.id}
                    onClick={() => onSelectVideo && onSelectVideo(vid)}
                    className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md hover:border-slate-700 transition cursor-pointer flex flex-col"
                  >
                    {/* 16:9 Thumbnail with rating badge */}
                    <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                      <img
                        src={thumb}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                      {/* Badge Rating di atas thumbnail */}
                      <div className="absolute top-2 right-2 z-10">
                        <RatingBadge score={vid.overallRating} size="sm" showIcon />
                      </div>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4
                          title={vid.title}
                          className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-indigo-300 transition"
                        >
                          {vid.title}
                        </h4>

                        {/* Format: Nilai didapat artis (status peran • bobot) */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-lg w-fit">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                          <span>{formattedScore} ({roleName}{roleWeight !== 100 ? ` • ${roleWeight}%` : ''})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                          <span>Nilai Video: {vid.overallRating}</span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{vid.singleChoices?.field_status || 'Koleksi'}</span>
                        <ExternalLink className="w-3 h-3 text-indigo-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Catatan & Profil (Tampilan bersih seperti sosial media) */}
      {activeSubTab === 'notes' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Bio Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Biografi &amp; Profil
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {artist.bio || 'Belum ada catatan atau biografi yang ditambahkan.'}
            </p>
          </div>

          {/* Catatan Kaki: Deskripsi Item Pilihan (Collapsible) - Requirement 7 */}
          {footnoteItems.length > 0 && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setIsFootnoteOpen(!isFootnoteOpen)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-850 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Catatan Kaki &amp; Deskripsi Item ({footnoteItems.length})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="text-[11px] font-semibold">
                    {isFootnoteOpen ? 'Tutup' : 'Lihat'}
                  </span>
                  {isFootnoteOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isFootnoteOpen && (
                <div className="p-3.5 pt-0 border-t border-slate-800/80 space-y-2.5 animate-in fade-in">
                  <p className="text-[11px] text-slate-400 mt-2">
                    Deskripsi item-item dari field pilihan yang melekat pada karya dan entri artis ini:
                  </p>
                  <div className="space-y-2">
                    {footnoteItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-300">{item.optionName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                            {item.fieldLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Text Fields (misal: Penghargaan, Asal, dll) */}
          {artist.textFields && Object.keys(artist.textFields).length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Informasi Tambahan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(artist.textFields).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                      {k}
                    </span>
                    <span className="text-xs text-white font-bold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {artist.links && artist.links.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tautan &amp; Portofolio</span>
              </h3>
              <div className="space-y-1.5">
                {artist.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-indigo-300 hover:text-white transition"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Embed Images Gallery (Collapsible, default: collapsed) */}
          {artist.embedImages && artist.embedImages.length > 0 && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setIsGalleryOpen(!isGalleryOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-850 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Galeri Foto &amp; Portofolio Visual
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                    {artist.embedImages.length} Foto
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                  <span>{isGalleryOpen ? 'Tutup' : 'Buka'}</span>
                  {isGalleryOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isGalleryOpen && (
                <div className="p-4 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {artist.embedImages.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => setPreviewImageUrl(img)}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/90 cursor-pointer hover:border-indigo-500/60 transition shadow-sm active:scale-95"
                      >
                        <img
                          src={img}
                          alt={`Portofolio ${i + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <ZoomIn className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-xl w-full max-h-[85vh] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-3.5 bg-slate-900/90 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">Preview Gambar Embed</span>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-2 overflow-auto bg-black/40">
              <img
                src={previewImageUrl}
                alt="Full preview"
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
