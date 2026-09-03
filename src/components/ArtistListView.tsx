import React, { useState, useMemo, useEffect } from 'react';
import { Search, UserPlus, Film, Users, Grid, List, Trash2 } from 'lucide-react';
import { Artist, Video } from '../types';
import { calculateArtistAggregatedRating, getArtistViewMode, saveArtistViewMode } from '../utils/storage';
import { RatingBadge } from './RatingBadge';

interface ArtistListViewProps {
  artists: Artist[];
  videos: Video[];
  onSelectArtist: (artistId: string) => void;
  onOpenCreateArtist: () => void;
  onDeleteArtist?: (artist: Artist) => void;
  filterRole?: string | null;
  onClearRoleFilter?: () => void;
}

export const ArtistListView: React.FC<ArtistListViewProps> = ({
  artists,
  videos,
  onSelectArtist,
  onOpenCreateArtist,
  onDeleteArtist,
  filterRole,
  onClearRoleFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => getArtistViewMode());

  useEffect(() => {
    setViewMode(getArtistViewMode());
  }, []);

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    saveArtistViewMode(mode);
  };

  const filteredArtists = useMemo(() => {
    return artists.filter((a) => {
      if (filterRole && filterRole.trim()) {
        const role = a.textFields?.['Peran Utama'] || '';
        if (!role.toLowerCase().includes(filterRole.toLowerCase())) {
          return false;
        }
      }
      if (!searchQuery.trim()) return true;
      return (
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.textFields?.['Peran Utama']?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [artists, searchQuery, filterRole]);

  return (
    <div id="artist-list-view" className="space-y-4 pb-24 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Daftar Artis &amp; Profil</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-bold">
              {artists.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Profil aktor &amp; sutradara dengan agregasi rating dari video tertaut
          </p>
        </div>

        <button
          onClick={onOpenCreateArtist}
          className="min-h-[40px] px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Role Filter Active Tag Header (Poin 6A) */}
      {filterRole && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <span className="font-bold">Filter Peran Utama:</span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-extrabold">{filterRole}</span>
          </div>
          {onClearRoleFilter && (
            <button
              type="button"
              onClick={onClearRoleFilter}
              className="text-[11px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
            >
              Hapus Filter
            </button>
          )}
        </div>
      )}

      {/* Search Bar & View Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama artis atau profil..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => handleSetViewMode('grid')}
            className={`p-2 rounded-lg transition ${
              viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Tampilan Grid 2 Kolom"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSetViewMode('list')}
            className={`p-2 rounded-lg transition ${
              viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Tampilan Daftar Horizontal"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Artists List/Grid */}
      {filteredArtists.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">Tidak ada artis ditemukan</p>
          <p className="text-xs text-slate-500 mt-1">Coba kata kunci lain atau tambahkan artis baru.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid 2 Kolom: Foto artis persegi dengan overlay nama dan rating di bawahnya */
        <div className="grid grid-cols-2 gap-3">
          {filteredArtists.map((artist) => {
            const { rating, videoCount } = calculateArtistAggregatedRating(artist.id, videos);

            return (
              <div
                key={artist.id}
                onClick={() => onSelectArtist(artist.id)}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-md cursor-pointer flex flex-col"
              >
                {/* Square Photo with Rating Badge Overlay */}
                <div className="relative aspect-square w-full bg-slate-950 overflow-hidden">
                  <img
                    src={artist.avatarUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20" />

                  {/* Delete Button at Top Left */}
                  {onDeleteArtist && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteArtist(artist);
                      }}
                      className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-black/70 hover:bg-rose-950/90 text-slate-400 hover:text-rose-300 border border-slate-800 transition active:scale-95 cursor-pointer"
                      title="Hapus Artis"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Rating Badge Overlay at Top Right */}
                  <div className="absolute top-2 right-2 z-10">
                    <RatingBadge score={rating} size="sm" showIcon />
                  </div>

                  {/* Video Count Tag at Bottom Left */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-[10px] text-indigo-300 font-bold border border-slate-800">
                    <Film className="w-2.5 h-2.5" />
                    <span>{videoCount} video</span>
                  </div>
                </div>

                {/* Name & Role below */}
                <div className="p-3 bg-slate-900 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                      {artist.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {artist.textFields?.['Peran Utama'] || 'Aktor / Sutradara'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Horizontal: Foto bulat (avatar) di kiri dan nama + rating di kanan */
        <div className="space-y-2.5">
          {filteredArtists.map((artist) => {
            const { rating, videoCount } = calculateArtistAggregatedRating(artist.id, videos);

            return (
              <div
                key={artist.id}
                onClick={() => onSelectArtist(artist.id)}
                className="group flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-md cursor-pointer"
              >
                {/* Round Avatar on the left */}
                <img
                  src={artist.avatarUrl}
                  alt={artist.name}
                  className="w-13 h-13 rounded-full object-cover bg-slate-800 ring-2 ring-slate-800 group-hover:ring-indigo-500/50 transition shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
                  }}
                />

                {/* Name & Bio in middle */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                    {artist.name}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {artist.textFields?.['Peran Utama'] || artist.bio || 'Profil Artis'}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-semibold mt-1">
                    <Film className="w-3 h-3" />
                    <span>{videoCount} video tertaut</span>
                  </div>
                </div>

                {/* Rating & Delete on the right */}
                <div className="shrink-0 flex items-center gap-2">
                  <RatingBadge score={rating} size="md" />
                  {onDeleteArtist && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteArtist(artist);
                      }}
                      className="p-2 rounded-xl bg-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 border border-slate-700/60 active:scale-95 transition cursor-pointer"
                      title="Hapus Artis"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
