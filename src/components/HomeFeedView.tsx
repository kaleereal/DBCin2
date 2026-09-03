import React, { useState, useMemo, useEffect } from 'react';
import { Search, Zap, Film, Plus, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { Video, Artist, CustomFieldDefinition, FilterCriteria } from '../types';
import { VideoCard } from './VideoCard';
import { VideoListItem } from './VideoListItem';
import { FilterBottomSheet } from './FilterBottomSheet';
import { getVideoViewMode, saveVideoViewMode } from '../utils/storage';

interface HomeFeedViewProps {
  videos: Video[];
  artists: Artist[];
  fieldDefinitions: CustomFieldDefinition[];
  onEditVideo: (video: Video) => void;
  onDeleteVideo: (video: Video) => void;
  onSelectArtist: (artistId: string) => void;
  onOpenCreateVideo: () => void;
  onSelectVideo?: (video: Video) => void;
}

export const HomeFeedView: React.FC<HomeFeedViewProps> = ({
  videos,
  artists,
  fieldDefinitions,
  onEditVideo,
  onDeleteVideo,
  onSelectArtist,
  onOpenCreateVideo,
  onSelectVideo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => getVideoViewMode());
  const [criteria, setCriteria] = useState<FilterCriteria>({
    searchQuery: '',
    sortOrder: 'desc',
    singleChoices: {},
    multiChoices: {},
    minRating: 0,
  });

  // Load view mode preference on mount
  useEffect(() => {
    setViewMode(getVideoViewMode());
  }, []);

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    saveVideoViewMode(mode);
  };

  // Filter videos according to search query and filter criteria
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      // Search title, notes, or artist names
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = video.title.toLowerCase().includes(query);
        const notesMatch = video.notes?.toLowerCase().includes(query);
        const artistMatch = artists
          .filter((a) => video.artistIds && video.artistIds.includes(a.id))
          .some((a) => a.name.toLowerCase().includes(query));

        if (!titleMatch && !notesMatch && !artistMatch) {
          return false;
        }
      }

      // Min rating
      if (criteria.minRating && (video.overallRating || 0) < criteria.minRating) {
        return false;
      }

      // Single choices
      for (const [fieldId, chosen] of Object.entries(criteria.singleChoices || {})) {
        if (chosen && video.singleChoices?.[fieldId] !== chosen) {
          return false;
        }
      }

      // Multi choices
      for (const [fieldId, chosenList] of Object.entries(criteria.multiChoices || {})) {
        const list = chosenList as string[] | undefined;
        if (list && list.length > 0) {
          const vidTags = video.multiChoices?.[fieldId] || [];
          const hasMatch = list.some((tag) => vidTags.includes(tag));
          if (!hasMatch) return false;
        }
      }

      return true;
    });
  }, [videos, artists, searchQuery, criteria]);

  const multiChoiceCount = Object.values(criteria.multiChoices || {}).reduce<number>(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0
  );

  const activeFilterCount =
    Object.values(criteria.singleChoices || {}).filter(Boolean).length +
    multiChoiceCount +
    (criteria.minRating && criteria.minRating > 0 ? 1 : 0);

  return (
    <div id="home-feed-view" className="space-y-4 pb-28 animate-in fade-in">
      {/* Search Bar & Quick Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul video, sutradara, artis..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={() => setIsFilterOpen(true)}
          className={`min-h-[44px] px-3.5 rounded-2xl border transition active:scale-95 flex items-center gap-1.5 shrink-0 ${
            activeFilterCount > 0
              ? 'bg-amber-500 text-amber-950 border-amber-300 font-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Filter Kategori"
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

      {/* View Mode Bar: Result Count & Display Switcher (Kartu vs Daftar List) */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-semibold text-slate-400">
          <span className="text-white font-bold">{filteredVideos.length}</span> Video Tersedia
        </div>

        {/* Display Settings Switcher */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => handleSetViewMode('grid')}
            className={`min-h-[32px] px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition active:scale-95 ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Tampilan Grid / Kartu Besar (Feed)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetViewMode('list')}
            className={`min-h-[32px] px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition active:scale-95 ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Tampilan Daftar List (Ringkas)"
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Video Feed Section */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">
            {videos.length === 0 ? 'Belum Ada Entri Video' : 'Tidak Ada Video Sesuai Filter'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {videos.length === 0
              ? 'Mulai tambahkan video pertama Anda dengan sistem rating kustom dan metadata otomatis.'
              : 'Coba ubah kata kunci pencarian atau reset filter kategori.'}
          </p>
          <button
            onClick={onOpenCreateVideo}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Video Sekarang</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-4">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              artists={artists}
              onEdit={onEditVideo}
              onDelete={onDeleteVideo}
              onSelectArtist={onSelectArtist}
              onOpenDetail={onSelectVideo}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredVideos.map((video) => (
            <VideoListItem
              key={video.id}
              video={video}
              artists={artists}
              onEdit={onEditVideo}
              onDelete={onDeleteVideo}
              onSelectArtist={onSelectArtist}
              onOpenDetail={onSelectVideo}
            />
          ))}
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
