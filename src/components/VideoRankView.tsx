import React, { useState, useMemo, useEffect } from 'react';
import { Zap, ArrowUpDown, Film, Play, ExternalLink, Sparkles } from 'lucide-react';
import { Video, Artist, CustomFieldDefinition, FilterCriteria } from '../types';
import { RatingBadge } from './RatingBadge';
import { FilterBottomSheet } from './FilterBottomSheet';
import { DynamicRankFilterBar } from './DynamicRankFilterBar';

interface VideoRankViewProps {
  videos: Video[];
  artists: Artist[];
  fieldDefinitions: CustomFieldDefinition[];
  onSelectVideo?: (video: Video) => void;
  onSelectArtist?: (artistId: string) => void;
  initialFieldId?: string | null;
  initialOption?: string | null;
}

export const VideoRankView: React.FC<VideoRankViewProps> = ({
  videos,
  artists,
  fieldDefinitions,
  onSelectVideo,
  onSelectArtist,
  initialFieldId,
  initialOption,
}) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [sortCriterion, setSortCriterion] = useState<'rating' | 'title' | 'artist'>('rating');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(initialFieldId || null);
  const [selectedOption, setSelectedOption] = useState<string | null>(initialOption || null);

  useEffect(() => {
    if (initialFieldId) {
      setActiveFieldId(initialFieldId);
      setSelectedOption(initialOption || null);
    }
  }, [initialFieldId, initialOption]);
  const [criteria, setCriteria] = useState<FilterCriteria>({
    searchQuery: '',
    sortOrder: 'desc',
    singleChoices: {},
    multiChoices: {},
    minRating: 0,
  });

  // Extract unique artist roles from all videos
  const availableVideoRoles = useMemo(() => {
    const roleMap = new Map<string, number>();
    videos.forEach((v) => {
      const rolesInVid = new Set<string>();
      if (v.artistRoles) {
        Object.values(v.artistRoles).forEach((r) => {
          const roleStr = typeof r === 'string' ? r : String(r || '');
          const trimmed = roleStr.trim();
          if (trimmed) rolesInVid.add(trimmed);
        });
      }
      if (v.artistIds && v.artistIds.length > 0 && rolesInVid.size === 0) {
        rolesInVid.add('Artis Utama');
      }

      rolesInVid.forEach((r) => {
        roleMap.set(r, (roleMap.get(r) || 0) + 1);
      });
    });
    return Array.from(roleMap.entries()).map(([role, count]) => ({ role, count }));
  }, [videos]);

  // Extract any dynamic options present in data
  const dynamicOptionsByField = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const field of fieldDefinitions) {
      if (field.type === 'single_choice' || field.type === 'multi_choice') {
        const set = new Set<string>();
        for (const vid of videos) {
          if (field.type === 'single_choice') {
            const v = vid.singleChoices?.[field.id];
            if (v && typeof v === 'string' && v.trim()) set.add(v.trim());
          } else {
            const list = vid.multiChoices?.[field.id];
            if (Array.isArray(list)) {
              for (const item of list) {
                if (item && typeof item === 'string' && item.trim()) set.add(item.trim());
              }
            }
          }
        }
        map[field.id] = Array.from(set);
      }
    }
    return map;
  }, [fieldDefinitions, videos]);

  // Filter and sort videos
  const rankedVideos = useMemo(() => {
    return videos
      .filter((video) => {
        // Filter by selected artist role
        if (selectedRoleFilter !== 'all') {
          let hasMatchingRole = false;
          if (video.artistRoles) {
            hasMatchingRole = Object.values(video.artistRoles).some((r) => {
              const roleStr = typeof r === 'string' ? r : String(r || '');
              return roleStr.trim().toLowerCase() === selectedRoleFilter.toLowerCase();
            });
          }
          if (!hasMatchingRole && selectedRoleFilter.toLowerCase() === 'artis utama') {
            hasMatchingRole = (video.artistIds && video.artistIds.length > 0 && !video.artistRoles);
          }
          if (!hasMatchingRole) return false;
        }

        // Dynamic Quick Tab & Chip Filter (Feature 1)
        if (activeFieldId && selectedOption) {
          const fieldDef = fieldDefinitions.find((f) => f.id === activeFieldId);
          if (fieldDef?.type === 'single_choice') {
            if (video.singleChoices?.[activeFieldId] !== selectedOption) {
              return false;
            }
          } else if (fieldDef?.type === 'multi_choice') {
            const tags = video.multiChoices?.[activeFieldId] || [];
            if (!tags.includes(selectedOption)) {
              return false;
            }
          }
        }

        // Min rating filter
        if (criteria.minRating && (video.overallRating || 0) < criteria.minRating) {
          return false;
        }

        // Single choice filter from bottom sheet
        for (const [fieldId, chosen] of Object.entries(criteria.singleChoices || {})) {
          if (chosen && video.singleChoices?.[fieldId] !== chosen) {
            return false;
          }
        }

        // Multi choice filter from bottom sheet
        for (const [fieldId, chosenList] of Object.entries(criteria.multiChoices || {})) {
          const list = chosenList as string[] | undefined;
          if (list && list.length > 0) {
            const vidTags = video.multiChoices?.[fieldId] || [];
            const hasMatch = list.some((tag) => vidTags.includes(tag));
            if (!hasMatch) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortCriterion === 'title') {
          const cmp = a.title.localeCompare(b.title);
          return sortOrder === 'desc' ? -cmp : cmp;
        }

        if (sortCriterion === 'artist') {
          const aArtist = artists.find((art) => a.artistIds?.includes(art.id))?.name || '';
          const bArtist = artists.find((art) => b.artistIds?.includes(art.id))?.name || '';
          const cmp = aArtist.localeCompare(bArtist);
          return sortOrder === 'desc' ? -cmp : cmp;
        }

        const ratingA = a.overallRating || 0;
        const ratingB = b.overallRating || 0;
        return sortOrder === 'desc' ? ratingB - ratingA : ratingA - ratingB;
      });
  }, [videos, criteria, sortOrder, sortCriterion, selectedRoleFilter, activeFieldId, selectedOption, fieldDefinitions, artists]);

  const multiChoiceCount = Object.values(criteria.multiChoices || {}).reduce<number>(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0
  );

  const activeFilterCount =
    Object.values(criteria.singleChoices || {}).filter(Boolean).length +
    multiChoiceCount +
    (criteria.minRating && criteria.minRating > 0 ? 1 : 0);

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return 'bg-amber-400 text-amber-950 ring-2 ring-amber-300 shadow-md font-black';
    if (rank === 2) return 'bg-slate-300 text-slate-900 ring-2 ring-slate-200 shadow-md font-black';
    if (rank === 3) return 'bg-amber-700 text-amber-100 ring-2 ring-amber-600 shadow-md font-black';
    return 'bg-slate-800 text-slate-300 border border-slate-700 font-bold';
  };

  return (
    <div id="video-rank-view" className="space-y-4 pb-24 animate-in fade-in">
      {/* Header with Title and Filter Icon (⚡) */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Peringkat Video</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-bold">
              {rankedVideos.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Urutan leaderboard film berdasarkan Overall Rating kalkulasi
          </p>
        </div>

        <button
          onClick={() => setIsFilterOpen(true)}
          className={`relative p-2.5 rounded-xl border transition active:scale-95 flex items-center gap-1.5 ${
            activeFilterCount > 0
              ? 'bg-amber-500 text-amber-950 border-amber-300 font-black shadow-lg shadow-amber-500/30'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Buka Filter Kategori"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span className="text-xs font-bold hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-slate-950 text-white text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Dynamic Filtering Tabs & Chips (MultiChoice and SingleChoice fields from Master Settings) */}
      <DynamicRankFilterBar
        fieldDefinitions={fieldDefinitions}
        activeFieldId={activeFieldId}
        onSelectField={setActiveFieldId}
        selectedOption={selectedOption}
        onSelectOption={setSelectedOption}
        dynamicOptionsByField={dynamicOptionsByField}
      />

      {/* Filter Peran / Peran Utama */}
      {availableVideoRoles.length > 0 && (
        <div className="space-y-1.5 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Filter Peran Artis:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('all')}
              className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                selectedRoleFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Semua Peran ({videos.length})
            </button>
            {availableVideoRoles.map(({ role, count }) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRoleFilter(selectedRoleFilter === role ? 'all' : role)}
                className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  selectedRoleFilter === role
                    ? 'bg-amber-500 text-amber-950 font-black shadow-md shadow-amber-500/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span>{role}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/40 font-semibold">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort Toggle & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-1.5 pl-1">
          <span className="text-xs text-slate-400 font-medium">Urutkan:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSortCriterion('rating')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                sortCriterion === 'rating'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Skor Rating
            </button>
            <button
              type="button"
              onClick={() => setSortCriterion('title')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                sortCriterion === 'title'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Judul
            </button>
            <button
              type="button"
              onClick={() => setSortCriterion('artist')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                sortCriterion === 'artist'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Artis
            </button>
          </div>
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 text-indigo-300 text-xs font-bold border border-slate-800 hover:border-indigo-500/50 transition active:scale-95 ml-auto cursor-pointer"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>
            {sortOrder === 'desc' ? 'Tinggi ke Rendah' : 'Rendah ke Tinggi'}
          </span>
        </button>
      </div>

      {/* Leaderboard List: Nomor di kiri (lingkaran), thumbnail di tengah, nama di samping, skor besar di kanan */}
      {rankedVideos.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800">
          <Film className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">Tidak ada video yang cocok</p>
          <p className="text-xs text-slate-500 mt-1">Coba sesuaikan atau reset filter kategori.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rankedVideos.map((video, index) => {
            const rank = index + 1;
            const thumb =
              video.metadata?.thumbnailUrl ||
              'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80';

            const videoArtists = artists.filter(
              (a) => video.artistIds && video.artistIds.includes(a.id)
            );

            return (
              <div
                key={video.id}
                onClick={() => onSelectVideo && onSelectVideo(video)}
                className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-md cursor-pointer"
              >
                {/* Nomor Peringkat (Lingkaran di kiri) */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 select-none ${getRankBadgeStyle(
                    rank
                  )}`}
                >
                  {rank}
                </div>

                {/* Thumbnail Kecil (16:9 di tengah) */}
                <div className="relative w-16 aspect-video rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                  <img
                    src={thumb}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>

                {/* Judul & Artis di Sampingnya dengan Peran */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                    {video.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                    {videoArtists.length > 0 ? (
                      videoArtists.map((a, i) => {
                        const role = video.artistRoles?.[a.id] || a.textFields?.['Peran Utama'] || 'Artis Utama';
                        return (
                          <span key={a.id} className="truncate inline-flex items-center gap-0.5">
                            <span className="text-slate-300">{a.name}</span>
                            <span className="text-amber-400/90 text-[10px] font-semibold">({role})</span>
                            {i < videoArtists.length - 1 ? <span className="text-slate-600 mr-0.5">,</span> : null}
                          </span>
                        );
                      })
                    ) : (
                      <span>{video.metadata?.domain || 'Video'}</span>
                    )}
                  </div>
                </div>

                {/* Skor Rating di Sebelah Kanan (Font Besar & Tebal) */}
                <div className="shrink-0 text-right">
                  <RatingBadge score={video.overallRating} size="md" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        criteria={criteria}
        onApply={(newCrit) => setCriteria(newCrit)}
        fieldDefinitions={fieldDefinitions}
      />
    </div>
  );
};
