export type TabType = 'home' | 'artists' | 'rank_videos' | 'rank_artists' | 'settings';

export interface RatingItem {
  id: string;
  name: string;
  description?: string;
  score: number; // 0 - 100
}

export interface RatingFolder {
  id: string;
  name: string;
  items: RatingItem[];
}

export interface RatingTemplateItem {
  id: string;
  name: string;
  description?: string;
  defaultScore?: number;
}

export interface RatingTemplateFolder {
  id: string;
  name: string;
  items: RatingTemplateItem[];
}

export interface VideoMetadata {
  title?: string;
  thumbnailUrl?: string;
  embedUrl?: string;
  embedHtml?: string;
  domain?: string;
  duration?: string;
  author?: string;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  metadata?: VideoMetadata;
  notes?: string;
  ratingFolders: RatingFolder[];
  overallRating: number; // Computed 0 - 100
  artistIds: string[]; // Many-to-Many references
  artistRoles?: Record<string, string>; // artistId -> status_peran (e.g. "Artis Utama", "Aktor")
  singleChoices: Record<string, string>; // fieldId -> selectedOption
  multiChoices: Record<string, string[]>; // fieldId -> selectedOptions[]
  customFields?: Record<string, string>; // for arbitrary custom text fields
  createdAt: string;
  updatedAt: string;
}

export interface ArtistLink {
  id: string;
  label: string;
  url: string;
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  coverUrl?: string;
  bio?: string;
  links?: ArtistLink[];
  embedImages?: string[]; // URLs or base64 images
  textFields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  // Note: artists do NOT have a manual rating. Overall rating is calculated dynamically from linked videos.
}

export interface VideoArtistPivot {
  videoId: string;
  artistId: string;
  createdAt: string;
  nilai_didapat: number; // calculated float: (video.overallRating * bobot_saat_itu) / 100
  status_peran_saat_itu: string; // role title e.g. "Artis Utama"
  bobot_saat_itu: number; // percentage e.g. 100 or 70
}

export interface RoleWeight {
  id: string;
  roleName: string;
  weight: number; // 0 to 100
  isLocked: boolean; // if true, weight is locked and protected from edits or batch recalculation
}

export type FieldType = 
  | 'link' 
  | 'text' 
  | 'notes' 
  | 'rating_folder' 
  | 'artist_select' 
  | 'multi_choice' 
  | 'single_choice'
  | 'custom_text';

export interface CustomFieldDefinition {
  id: string;
  key: string;
  label: string;
  description: string;
  type: FieldType;
  order: number;
  required?: boolean;
  isSystem?: boolean; // System fields (like core link, title, rating, artist) cannot be deleted but can be reordered & renamed
  options?: string[]; // For single_choice and multi_choice
  optionDescriptions?: Record<string, string>; // Optional description per option item
  defaultFolderNames?: string[]; // For rating_folder defaults
  maxEntries?: number;
}

export interface FilterCriteria {
  searchQuery: string;
  sortOrder: 'desc' | 'asc'; // highest rating first or lowest rating first
  singleChoices: Record<string, string>; // fieldId -> chosenOption
  multiChoices: Record<string, string[]>; // fieldId -> chosenOptions
  minRating?: number;
  maxRating?: number;
}
