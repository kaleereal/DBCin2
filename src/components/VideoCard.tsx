import React, { useState } from 'react';
import { Play, Edit2, Trash2, ExternalLink, ChevronDown, ChevronUp, Clock, Globe } from 'lucide-react';
import { Video, Artist } from '../types';
import { RatingBadge } from './RatingBadge';

interface VideoCardProps {
  video: Video;
  artists: Artist[];
  onEdit: (video: Video) => void;
  onDelete: (video: Video) => void;
  onSelectArtist: (artistId: string) => void;
  onOpenDetail?: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  artists,
  onEdit,
  onDelete,
  onSelectArtist,
  onOpenDetail,
}) => {
  const [isPlayingEmbed, setIsPlayingEmbed] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Match involved artists
  const involvedArtists = artists.filter((a) => video.artistIds && video.artistIds.includes(a.id));

  // Genre tags
  const genreTags = video.multiChoices?.field_genre || [];
  const statusValue = video.singleChoices?.field_status;

  const thumbnail = video.metadata?.thumbnailUrl || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80';

  return (
    <article
      id={`video-card-${video.id}`}
      className="group relative bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition duration-200"
    >
      {/* 16:9 Thumbnail Area with Rating Badge and Embed Player */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
        {isPlayingEmbed && video.metadata?.embedUrl ? (
          <div className="relative w-full h-full">
            <iframe
              src={video.metadata.embedUrl}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={() => setIsPlayingEmbed(false)}
              className="absolute top-2 left-2 z-20 bg-slate-950/80 text-white text-xs px-2.5 py-1 rounded-full border border-slate-700 hover:bg-slate-900"
            >
              Tutup Video
            </button>
          </div>
        ) : (
          <>
            <img
              src={thumbnail}
              alt={video.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback image if broken
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&auto=format&fit=crop&q=80';
              }}
            />

            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30 pointer-events-none" />

            {/* Play Button Overlay */}
            <button
              onClick={() => setIsPlayingEmbed(true)}
              aria-label={`Putar ${video.title}`}
              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-indigo-600/80 hover:bg-indigo-600 text-white flex items-center justify-center shadow-xl backdrop-blur-xs transition transform hover:scale-110 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>

            {/* Domain Tag in Bottom Left of Thumbnail */}
            {video.metadata?.domain && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-[10px] font-medium text-slate-300 border border-slate-800">
                <Globe className="w-2.5 h-2.5 text-indigo-400" />
                <span>{video.metadata.domain}</span>
              </div>
            )}
          </>
        )}

        {/* Overall Rating Badge (Mencolok di pojok kanan atas thumbnail) */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <RatingBadge score={video.overallRating} size="lg" showIcon />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 sm:p-4 space-y-3">
        {/* Status Chip & Genre Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {statusValue && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
              {statusValue}
            </span>
          )}
          {genreTags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
            >
              {tag}
            </span>
          ))}
          {genreTags.length > 3 && (
            <span className="text-[10px] text-slate-400 font-medium">
              +{genreTags.length - 3}
            </span>
          )}
        </div>

        {/* Video Title: max 2 lines with ellipsis - Clicking title opens video detail (Req 4) */}
        <h3
          title={video.title}
          onClick={() => (onOpenDetail ? onOpenDetail(video) : onEdit(video))}
          className="text-base font-bold text-white tracking-tight line-clamp-2 leading-snug group-hover:text-indigo-200 transition-colors cursor-pointer hover:underline"
        >
          {video.title}
        </h3>

        {/* Involved Artists Avatars (Tap to visit artist detail) */}
        {involvedArtists.length > 0 && (
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[11px] font-medium text-slate-400">Artis:</span>
            <div className="flex items-center -space-x-2 overflow-hidden">
              {involvedArtists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectArtist(artist.id);
                  }}
                  title={`${artist.name} (Buka Profil)`}
                  className="relative group/avatar ring-2 ring-slate-900 rounded-full hover:z-20 hover:scale-115 transition-transform"
                >
                  <img
                    src={artist.avatarUrl}
                    alt={artist.name}
                    className="w-7 h-7 rounded-full object-cover bg-slate-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
                    }}
                  />
                  <span className="sr-only">{artist.name}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 text-xs text-slate-300 font-medium line-clamp-1">
              {involvedArtists.map((a, i) => (
                <button
                  key={a.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectArtist(a.id);
                  }}
                  className="hover:underline hover:text-indigo-300 text-left"
                >
                  {a.name}{i < involvedArtists.length - 1 ? ',' : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rating Breakdown Accordion Preview */}
        {video.ratingFolders && video.ratingFolders.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {video.ratingFolders.slice(0, 4).map((folder) => {
                const folderAvg = folder.items.length > 0
                  ? Math.round(folder.items.reduce((s, it) => s + (it.score || 0), 0) / folder.items.length)
                  : 0;
                return (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-950/60 border border-slate-800/60"
                  >
                    <span className="text-slate-400 truncate pr-1">{folder.name}</span>
                    <span className="font-bold text-slate-200 shrink-0">{folderAvg}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Collapsible Notes Preview */}
        {video.notes && (
          <div className="pt-1">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center justify-between w-full text-[11px] font-medium text-slate-400 hover:text-slate-200 py-1 transition"
            >
              <span>Catatan Ulasan</span>
              {showNotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showNotes && (
              <p className="mt-1 p-2.5 rounded-xl bg-slate-950/70 text-slate-300 text-xs leading-relaxed border border-slate-800 animate-in fade-in">
                {video.notes}
              </p>
            )}
          </div>
        )}

        {/* Actions Bar (Swipe Option / Mobile Button Row) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition py-1.5 px-2 rounded-lg hover:bg-indigo-950/40"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Link</span>
          </a>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(video)}
              className="flex items-center gap-1 h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition active:scale-95 border border-slate-700"
              title="Edit Video"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => onDelete(video)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 text-xs font-medium transition active:scale-95 border border-slate-800 hover:border-rose-700/60"
              title="Hapus Video"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
