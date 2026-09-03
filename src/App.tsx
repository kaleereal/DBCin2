import React, { useState, useEffect } from 'react';
import { Film, Clapperboard, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Video,
  Artist,
  CustomFieldDefinition,
  TabType,
} from './types';
import {
  loadVideos,
  saveVideos,
  loadArtists,
  saveArtists,
  loadCustomFields,
  saveCustomFields,
} from './utils/storage';
import { BottomNavigation } from './components/BottomNavigation';
import { FAB } from './components/FAB';
import { OfflineIndicator } from './components/OfflineIndicator';
import { HomeFeedView } from './components/HomeFeedView';
import { ArtistListView } from './components/ArtistListView';
import { VideoRankView } from './components/VideoRankView';
import { ArtistRankView } from './components/ArtistRankView';
import { ArtistDetailView } from './components/ArtistDetailView';
import { VideoDetailView } from './components/VideoDetailView';
import { SettingsView } from './components/SettingsView';
import { GalleryNotesView } from './components/GalleryNotesView';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeEditorToolbar } from './components/ThemeEditorToolbar';
import { VideoFormModal } from './components/VideoFormModal';
import { ArtistFormModal } from './components/ArtistFormModal';
import { ConfirmModal } from './components/ConfirmModal';

export default function App() {
  // Application Data States
  const [videos, setVideos] = useState<Video[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [fieldDefinitions, setFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation state
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [artistRoleFilter, setArtistRoleFilter] = useState<string | null>(null);

  // Initial filter navigation state for rankings (Requirement 8)
  const [videoRankInitialFilter, setVideoRankInitialFilter] = useState<{
    fieldId: string;
    option: string;
  } | null>(null);
  const [artistRankInitialFilter, setArtistRankInitialFilter] = useState<{
    fieldId: string;
    option: string;
  } | null>(null);

  // Modals state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  // In-app Delete Confirmation Modal
  const [deleteModalData, setDeleteModalData] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  // Toast / Feedback message
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Initial Data Loading
  useEffect(() => {
    const loadedVideos = loadVideos();
    const loadedArtists = loadArtists();
    const loadedFields = loadCustomFields();

    setVideos(loadedVideos);
    setArtists(loadedArtists);
    setFieldDefinitions(loadedFields);
    setIsLoading(false);
  }, []);

  const refreshAllData = () => {
    setVideos(loadVideos());
    setArtists(loadArtists());
    setFieldDefinitions(loadCustomFields());
    showToast('Data berhasil disegarkan');
  };

  // VIDEO HANDLERS
  const handleOpenCreateVideo = () => {
    setEditingVideo(null);
    setIsVideoModalOpen(true);
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleDeleteVideo = (video: Video) => {
    setDeleteModalData({
      title: 'Hapus Entri Video',
      message: `Apakah Anda yakin ingin menghapus video "${video.title}"? Video ini akan dihapus secara permanen dari basis data.`,
      confirmText: 'Ya, Hapus Video',
      onConfirm: () => {
        const updated = videos.filter((v) => v.id !== video.id);
        setVideos(updated);
        saveVideos(updated);
        if (selectedVideoId === video.id) {
          setSelectedVideoId(null);
        }
        showToast('Video berhasil dihapus');
      },
    });
  };

  const handleDeleteArtist = (artist: Artist) => {
    setDeleteModalData({
      title: 'Hapus Profil Artis',
      message: `Apakah Anda yakin ingin menghapus profil artis "${artist.name}"? Tautan artis pada video yang bersangkutan akan dilepaskan.`,
      confirmText: 'Ya, Hapus Artis',
      onConfirm: () => {
        const updatedArtists = artists.filter((a) => a.id !== artist.id);
        setArtists(updatedArtists);
        saveArtists(updatedArtists);
        if (selectedArtistId === artist.id) {
          setSelectedArtistId(null);
        }
        showToast(`Profil artis "${artist.name}" berhasil dihapus.`);
      },
    });
  };

  const handleSaveVideo = (videoData: Partial<Video>) => {
    if (editingVideo) {
      // Edit existing
      const updatedList = videos.map((v) => {
        if (v.id === editingVideo.id) {
          return {
            ...v,
            ...videoData,
            updatedAt: new Date().toISOString(),
          } as Video;
        }
        return v;
      });
      setVideos(updatedList);
      saveVideos(updatedList);
      showToast('Entri video berhasil diperbarui!');
    } else {
      // Create new video
      const newVideo: Video = {
        id: `video_${Date.now()}`,
        title: videoData.title || 'Untitled Video',
        url: videoData.url || '',
        metadata: videoData.metadata,
        notes: videoData.notes,
        ratingFolders: videoData.ratingFolders || [],
        overallRating: videoData.overallRating || 0,
        artistIds: videoData.artistIds || [],
        artistRoles: videoData.artistRoles || {},
        singleChoices: videoData.singleChoices || {},
        multiChoices: videoData.multiChoices || {},
        customFields: videoData.customFields || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedList = [newVideo, ...videos];
      setVideos(updatedList);
      saveVideos(updatedList);
      showToast('Entri video baru berhasil disimpan!');
    }
  };

  // ARTIST HANDLERS
  const handleOpenCreateArtist = () => {
    setEditingArtist(null);
    setIsArtistModalOpen(true);
  };

  const handleEditArtist = (artist: Artist) => {
    setEditingArtist(artist);
    setIsArtistModalOpen(true);
  };

  const handleSaveArtist = (artistData: Partial<Artist>) => {
    if (editingArtist) {
      const updated = artists.map((a) => {
        if (a.id === editingArtist.id) {
          return {
            ...a,
            ...artistData,
            updatedAt: new Date().toISOString(),
          } as Artist;
        }
        return a;
      });
      setArtists(updated);
      saveArtists(updated);
      showToast('Profil artis berhasil diperbarui!');
    } else {
      const newArtist: Artist = {
        id: `artist_${Date.now()}`,
        name: artistData.name || 'Nama Artis',
        avatarUrl:
          artistData.avatarUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        coverUrl: artistData.coverUrl,
        bio: artistData.bio,
        links: artistData.links || [],
        embedImages: artistData.embedImages || [],
        textFields: artistData.textFields || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...artists, newArtist];
      setArtists(updated);
      saveArtists(updated);
      showToast('Profil artis berhasil ditambahkan!');
    }
  };

  const handleQuickCreateArtist = (name: string) => {
    const newArtist: Artist = {
      id: `artist_${Date.now()}`,
      name,
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      links: [],
      embedImages: [],
      textFields: { 'Peran Utama': 'Aktor / Seniman' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...artists, newArtist];
    setArtists(updated);
    saveArtists(updated);
    showToast(`Artis "${name}" berhasil dibuat!`);
  };

  // CUSTOM FIELDS HANDLER
  const handleUpdateFields = (newFields: CustomFieldDefinition[]) => {
    setFieldDefinitions(newFields);
    saveCustomFields(newFields);
    showToast('Konfigurasi field berhasil disimpan!');
  };

  // Select Artist for Detail View
  const handleSelectArtist = (artistId: string) => {
    setSelectedArtistId(artistId);
    setActiveTab('artists');
  };

  // Open Video Detail View (Requirement 4)
  const handleOpenVideoDetail = (video: Video) => {
    setSelectedVideoId(video.id);
  };

  // Find selected artist object if viewing detail
  const currentArtist = selectedArtistId
    ? artists.find((a) => a.id === selectedArtistId)
    : null;

  // Find selected video object if viewing detail
  const currentVideo = selectedVideoId
    ? videos.find((v) => v.id === selectedVideoId)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/30 animate-pulse mb-4">
          <Film className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-base font-bold text-white">Memuat CineRate DB...</h2>
        <p className="text-xs text-slate-400 mt-1">Menyiapkan database video &amp; rating artis</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
        {/* Floating Live Theme Editor Overlay */}
        <ThemeEditorToolbar />

        {/* Mobile-First Layout Container: max-w-md / max-w-lg centered */}
        <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative bg-slate-950 px-4 pt-3 pb-24 shadow-2xl">
          {/* Offline Connectivity Banner */}
          <OfflineIndicator />

        {/* Global App Header */}
        <header className="flex items-center justify-between py-3 border-b border-slate-900 shrink-0 mb-4">
          <button
            onClick={() => {
              setSelectedArtistId(null);
              setSelectedVideoId(null);
              setActiveTab('home');
            }}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition">
              <Clapperboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5 leading-none">
                <span>CineRate</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
                  DB
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium leading-none mt-1">
                Database Video &amp; Rating Artis
              </p>
            </div>
          </button>
        </header>

        {/* Dynamic Main View Content */}
        <main className="flex-1">
          {/* VIDEO ENTRY DETAIL VIEW (Requirement 4: Opened when video title is pressed anywhere) */}
          {currentVideo ? (
            <VideoDetailView
              video={currentVideo}
              artists={artists}
              fieldDefinitions={fieldDefinitions}
              onBack={() => setSelectedVideoId(null)}
              onEditVideo={(v) => {
                handleEditVideo(v);
              }}
              onDeleteVideo={(id) => {
                const vid = videos.find((v) => v.id === id);
                if (vid) {
                  handleDeleteVideo(vid);
                  setSelectedVideoId(null);
                }
              }}
              onSelectArtist={(artistId) => {
                setSelectedVideoId(null);
                handleSelectArtist(artistId);
              }}
              onSelectFilterTag={(fieldId, option) => {
                setSelectedVideoId(null);
                setVideoRankInitialFilter({ fieldId, option });
                setActiveTab('rank_videos');
              }}
            />
          ) : (
            <>
              {/* TAB 1: Beranda / Video Feed */}
              {activeTab === 'home' && (
                <HomeFeedView
                  videos={videos}
                  artists={artists}
                  fieldDefinitions={fieldDefinitions}
                  onEditVideo={handleEditVideo}
                  onDeleteVideo={handleDeleteVideo}
                  onSelectArtist={handleSelectArtist}
                  onOpenCreateVideo={handleOpenCreateVideo}
                  onSelectVideo={handleOpenVideoDetail}
                />
              )}

              {/* TAB 2: Artis (List vs Detail) */}
              {activeTab === 'artists' && (
                currentArtist ? (
                  <ArtistDetailView
                    artist={currentArtist}
                    videos={videos}
                    fieldDefinitions={fieldDefinitions}
                    onBack={() => setSelectedArtistId(null)}
                    onEditArtist={handleEditArtist}
                    onDeleteArtist={handleDeleteArtist}
                    onSelectVideo={handleOpenVideoDetail}
                    onSelectFilterTag={(fieldId, option) => {
                      setSelectedArtistId(null);
                      setArtistRankInitialFilter({ fieldId, option });
                      setActiveTab('rank_artists');
                    }}
                    onFilterByRole={(role) => {
                      setSelectedArtistId(null);
                      setArtistRoleFilter(role);
                    }}
                  />
                ) : (
                  <ArtistListView
                    artists={artists}
                    videos={videos}
                    onSelectArtist={handleSelectArtist}
                    onOpenCreateArtist={handleOpenCreateArtist}
                    onDeleteArtist={handleDeleteArtist}
                    filterRole={artistRoleFilter}
                    onClearRoleFilter={() => setArtistRoleFilter(null)}
                  />
                )
              )}

              {/* TAB BARU: Catatan Gallery */}
              {activeTab === 'gallery_notes' && (
                <GalleryNotesView
                  artists={artists}
                  onSelectArtist={handleSelectArtist}
                />
              )}

              {/* TAB 3: Rank Video */}
              {activeTab === 'rank_videos' && (
                <VideoRankView
                  videos={videos}
                  artists={artists}
                  fieldDefinitions={fieldDefinitions}
                  onSelectVideo={handleOpenVideoDetail}
                  onSelectArtist={handleSelectArtist}
                  initialFieldId={videoRankInitialFilter?.fieldId}
                  initialOption={videoRankInitialFilter?.option}
                />
              )}

              {/* TAB 4: Rank Artis */}
              {activeTab === 'rank_artists' && (
                <ArtistRankView
                  artists={artists}
                  videos={videos}
                  fieldDefinitions={fieldDefinitions}
                  onSelectArtist={handleSelectArtist}
                  initialFieldId={artistRankInitialFilter?.fieldId}
                  initialOption={artistRankInitialFilter?.option}
                />
              )}

              {/* TAB 5: Pengaturan */}
              {activeTab === 'settings' && (
                <SettingsView
                  fieldDefinitions={fieldDefinitions}
                  onUpdateFields={handleUpdateFields}
                  onRefreshData={refreshAllData}
                />
              )}
            </>
          )}
        </main>

        {/* Floating Action Button (FAB) */}
        {!isVideoModalOpen && !isArtistModalOpen && !selectedVideoId && (
          <FAB
            onClick={() => {
              if (activeTab === 'artists' && !selectedArtistId) {
                handleOpenCreateArtist();
              } else {
                handleOpenCreateVideo();
              }
            }}
            label={activeTab === 'artists' && !selectedArtistId ? 'Tambah Artis' : 'Tambah Video'}
          />
        )}

        {/* Bottom Navigation Bar (5 tabs) */}
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSelectedArtistId(null);
            setSelectedVideoId(null);
            if (tab !== 'rank_videos') setVideoRankInitialFilter(null);
            if (tab !== 'rank_artists') setArtistRankInitialFilter(null);
            setActiveTab(tab);
          }}
          videoCount={videos.length}
          artistCount={artists.length}
        />

        {/* Video Form Modal (Create / Edit) */}
        <VideoFormModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          onSave={handleSaveVideo}
          initialVideo={editingVideo}
          artists={artists}
          fieldDefinitions={fieldDefinitions}
          onQuickCreateArtist={handleQuickCreateArtist}
        />

        {/* Artist Form Modal (Create / Edit) */}
        <ArtistFormModal
          isOpen={isArtistModalOpen}
          onClose={() => setIsArtistModalOpen(false)}
          onSave={handleSaveArtist}
          initialArtist={editingArtist}
        />

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900/95 text-white border border-slate-700 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span className="text-xs font-semibold">{toast.text}</span>
          </div>
        )}
        {/* In-app Confirmation Modal for Deleting Videos and Artists */}
        <ConfirmModal
          isOpen={!!deleteModalData}
          title={deleteModalData?.title || 'Konfirmasi Hapus'}
          message={deleteModalData?.message || ''}
          confirmText={deleteModalData?.confirmText || 'Ya, Hapus'}
          cancelText="Batal"
          isDanger={true}
          onConfirm={() => {
            deleteModalData?.onConfirm();
            setDeleteModalData(null);
          }}
          onClose={() => setDeleteModalData(null)}
        />
        </div>
      </div>
    </ThemeProvider>
  );
}
