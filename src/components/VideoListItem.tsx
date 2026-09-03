import React, { useState } from 'react';
import { Play, Edit2, Trash2, ExternalLink, Globe } from 'lucide-react';
import { Video, Artist } from '../types';
import { RatingBadge } from './RatingBadge';

interface VideoListItemProps {
  video: Video;
  artists: Artist[];
  onEdit: (video: Video) => void;
  onDelete: (video: Video) => void;
  onSelectArtist: (artistId: string) => void;
  onOpenDetail?: (video: Video) => void;
}

export const VideoListItem: React.FC<VideoListItemProps> = ({
  video,
  artists,
  onEdit,
  onDelete,
  onSelectArtist,
  onOpenDetail,
}) => {
  const [isPlayingEmbed, setIsPlayingEmbed] = useState(false);

  const involvedArtists = artists.filter(
    (a) => video.artistIds && video.artistIds.includes(a.id)
  );
  const genreTags = video.multiChoices?.field_genre || [];
  const statusValue = video.singleChoices?.field_status;
  const thumbnail =
    video.metadata?.thumbnailUrl ||
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80';

  return (
    <div
      id={`video-list-item-${video.id}`}
      className="group relative bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 shadow-md hover:border-slate-700 transition duration-150 space-y-2.5"
    >
      {/* Top Section: Media preview + Info */}
      <div className="flex gap-3">
        {/* Thumbnail Preview (Left, width ~100px - 110px) */}
        <div className="relative w-28 aspect-video rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-800">
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
                type="button"
                onClick={() => setIsPlayingEmbed(false)}
                className="absolute top-1 left-1 z-10 bg-slate-950/90 text-[10px] text-white px-1.5 py-0.5 rounded border border-slate-700"
              >
                Tutup
              </button>
            </div>
          ) : (
            <>
              <img
                src={thumbnail}
                alt={video.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsPlayingEmbed(true)}
                  aria-label={`Putar ${video.title}`}
                  className="w-7 h-7 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg transition active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              </div>

              {video.metadata?.domain && (
                <div className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-slate-950/90 text-[8px] font-medium text-slate-300">
                  <Globe className="w-2 h-2 text-indigo-400" />
                  <span className="truncate max-w-[50px]">{video.metadata.domain}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info Area (Right) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1.5">
              <h4
                title={video.title}
                onClick={() => (onOpenDetail ? onOpenDetail(video) : onEdit(video))}
                className="text-xs font-bold text-white leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors cursor-pointer hover:underline"
              >
                {video.title}
              </h4>
              <div className="shrink-0">
                <RatingBadge score={video.overallRating} size="sm" showIcon />
              </div>
            </div>

            {/* Status & Genre Chips */}
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {statusValue && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-950/90 text-indigo-300 border border-indigo-800/60">
                  {statusValue}
                </span>
              )}
              {genreTags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Involved Artists */}
          {involvedArtists.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 pt-1 border-t border-slate-800/60">
              <div className="flex items-center -space-x-1.5 shrink-0">
                {involvedArtists.slice(0, 3).map((artist) => (
                  <button
                    key={artist.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectArtist(artist.id);
                    }}
                    title={artist.name}
                    className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-slate-900"
                  >
                    <img
                      src={artist.avatarUrl}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
                      }}
                    />
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {involvedArtists.map((a, i) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectArtist(a.id);
                    }}
                    className="hover:text-indigo-300 hover:underline"
                  >
                    {a.name}{i < involvedArtists.length - 1 ? ', ' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating Breakdown Pill Summaries (Compact) */}
      {video.ratingFolders && video.ratingFolders.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[10px]">
          {video.ratingFolders.map((folder) => {
            const folderAvg =
              folder.items.length > 0
                ? Math.round(
                    folder.items.reduce((acc, it) => acc + (it.score || 0), 0) /
                      folder.items.length
                  )
                : 0;
            return (
              <span
                key={folder.id}
                className="shrink-0 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-slate-400 flex items-center gap-1"
              >
                <span className="truncate max-w-[90px]">{folder.name}</span>
                <span className="font-bold text-slate-200">{folderAvg}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Bottom Bar: Link & Action Buttons */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60">
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition py-1"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Lihat Sumber</span>
        </a>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(video)}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition active:scale-95 border border-slate-700"
            title="Edit Nilai Video"
          >
            <Edit2 className="w-3 h-3 text-amber-400" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(video)}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 transition active:scale-95 border border-slate-800 hover:border-rose-700/60"
            title="Hapus Video"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
