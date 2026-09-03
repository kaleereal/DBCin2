import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, ArrowUpDown, Film, User, Search, Sparkles } from 'lucide-react';
import { Artist, Video, CustomFieldDefinition } from '../types';
import { calculateArtistAggregatedRating } from '../utils/storage';
import { RatingBadge } from './RatingBadge';
import { DynamicRankFilterBar } from './DynamicRankFilterBar';

interface ArtistRankViewProps {
  artists: Artist[];
  videos: Video[];
  fieldDefinitions?: CustomFieldDefinition[];
  onSelectArtist: (artistId: string) => void;
  initialFieldId?: string | null;
  initialOption?: string | null;
}

export const ArtistRankView: React.FC<ArtistRankViewProps> = ({
  artists,
  videos,
  fieldDefinitions = [],
  onSelectArtist,
  initialFieldId,
  initialOption,
}) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [sortCriterion, setSortCriterion] = useState<'rating' | 'role' | 'videos'>('rating');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFieldId, setActiveFieldId] = useState<string | null>(initialFieldId || null);
  const [selectedOption, setSelectedOption] = useState<string | null>(initialOption || null);

  useEffect(() => {
    if (initialFieldId) {
      setActiveFieldId(initialFieldId);
      setSelectedOption(initialOption || null);
    }
  }, [initialFieldId, initialOption]);

  // Extract unique "Peran Utama" values from all artists
  const uniqueRoles = useMemo(() => {
    const roleMap = new Map<string, number>();
    artists.forEach((a) => {
      const role = (a.textFields?.['Peran Utama'] || 'Aktor / Seniman Film').trim();
      roleMap.set(role, (roleMap.get(role) || 0) + 1);
    });
    return Array.from(roleMap.entries()).map(([role, count]) => ({ role, count }));
  }, [artists]);

  // Extract dynamic options present in data for artists' videos
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

  // Compute aggregated scores and sort
  const rankedArtists = useMemo(() => {
    return artists
      .map((artist) => {
        // Linked videos for this artist
        const artistVideos = videos.filter(
          (v) => v.artistIds && v.artistIds.includes(artist.id)
        );

        // Filter linked videos if category/tag filter is active
        let relevantVideos = artistVideos;
        if (activeFieldId && selectedOption) {
          const fieldDef = fieldDefinitions.find((f) => f.id === activeFieldId);
          relevantVideos = artistVideos.filter((vid) => {
            if (fieldDef?.type === 'single_choice') {
              return vid.singleChoices?.[activeFieldId] === selectedOption;
            } else if (fieldDef?.type === 'multi_choice') {
              const tags = vid.multiChoices?.[activeFieldId] || [];
              return tags.includes(selectedOption);
            }
            return true;
          });

          // If artist has no videos in this category/tag, exclude from this specific rank
          if (relevantVideos.length === 0) {
            return null;
          }
        }

        // Calculate aggregated rating from relevant videos based on role weights
        const { rating: aggregatedRating, totalPoints } = calculateArtistAggregatedRating(
          artist.id,
          relevantVideos
        );

        return {
          ...artist,
          aggregatedRating,
          totalPoints,
          videoCount: relevantVideos.length,
          totalLinkedCount: artistVideos.length,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .filter((a) => {
        // Filter by Peran Utama
        if (selectedRoleFilter !== 'all') {
          const role = (a.textFields?.['Peran Utama'] || 'Aktor / Seniman Film').trim();
          if (role !== selectedRoleFilter) return false;
        }

        // Filter by search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const role = (a.textFields?.['Peran Utama'] || '').toLowerCase();
        return a.name.toLowerCase().includes(q) || role.includes(q);
      })
      .sort((a, b) => {
        if (sortCriterion === 'role') {
          const roleA = (a.textFields?.['Peran Utama'] || 'Aktor / Seniman Film').toLowerCase();
          const roleB = (b.textFields?.['Peran Utama'] || 'Aktor / Seniman Film').toLowerCase();
          const cmp = roleA.localeCompare(roleB);
          return sortOrder === 'desc' ? -cmp : cmp;
        }

        if (sortCriterion === 'videos') {
          const vA = a.videoCount || 0;
          const vB = b.videoCount || 0;
          return sortOrder === 'desc' ? vB - vA : vA - vB;
        }

        // Default: Sort by rating
        const scoreA = a.aggregatedRating ?? -1;
        const scoreB = b.aggregatedRating ?? -1;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });
  }, [artists, videos, sortOrder, sortCriterion, selectedRoleFilter, searchQuery, activeFieldId, selectedOption, fieldDefinitions]);

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return 'bg-amber-400 text-amber-950 ring-2 ring-amber-300 shadow-md font-black';
    if (rank === 2) return 'bg-slate-300 text-slate-900 ring-2 ring-slate-200 shadow-md font-black';
    if (rank === 3) return 'bg-amber-700 text-amber-100 ring-2 ring-amber-600 shadow-md font-black';
    return 'bg-slate-800 text-slate-300 border border-slate-700 font-bold';
  };

  return (
    <div id="artist-rank-view" className="space-y-4 pb-24 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Peringkat Artis</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-bold">
              {rankedArtists.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Leaderboard dihitung murni dari agregasi rating video yang tertaut
          </p>
        </div>
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

      {/* Filter Chips: Peran Utama */}
      {uniqueRoles.length > 0 && (
        <div className="space-y-1.5 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Filter Peran Utama:</span>
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
              Semua Peran ({artists.length})
            </button>
            {uniqueRoles.map(({ role, count }) => (
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

      {/* Search Bar & Sort Toggle */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari artis atau peran utama dalam leaderboard..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

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
                Rating
              </button>
              <button
                type="button"
                onClick={() => setSortCriterion('role')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  sortCriterion === 'role'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Peran Utama
              </button>
              <button
                type="button"
                onClick={() => setSortCriterion('videos')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  sortCriterion === 'videos'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Jml Video
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
      </div>

      {/* Leaderboard List */}
      {rankedArtists.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800">
          <User className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">Tidak ada artis ditemukan</p>
          <p className="text-xs text-slate-500 mt-1">Coba sesuaikan filter peran utama atau kata kunci pencarian.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rankedArtists.map((artist, index) => {
            const rank = index + 1;
            const mainRole = artist.textFields?.['Peran Utama'] || 'Aktor / Seniman Film';

            return (
              <div
                key={artist.id}
                onClick={() => onSelectArtist(artist.id)}
                className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-md cursor-pointer"
              >
                {/* Nomor Peringkat (Lingkaran) */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 select-none ${getRankBadgeStyle(
                    rank
                  )}`}
                >
                  {rank}
                </div>

                {/* Avatar Bulat di Tengah */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-800 ring-2 ring-slate-800 shrink-0">
                  <img
                    src={artist.avatarUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>

                {/* Nama Artis & Info Peran Utama */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                    {artist.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1 shrink-0">
                      <Film className="w-3 h-3 text-indigo-400" />
                      <span>{artist.videoCount} video</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/40 text-amber-300 font-semibold text-[10px] truncate max-w-[150px] sm:max-w-none">
                      {mainRole}
                    </span>
                  </div>
                </div>

                {/* Skor Rating Agregat di Sebelah Kanan (Font Besar & Tebal) */}
                <div className="shrink-0 text-right">
                  <RatingBadge score={artist.aggregatedRating} size="md" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
