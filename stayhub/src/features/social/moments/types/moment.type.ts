/**
 * Represents a simplified user profile for display within a Moment.
 */
export interface MomentUser {
  id: string | number;
  fullName: string;
  avatarUrl?: string | null;
}

/**
 * Defines the possible types of reactions a user can give to a moment.
 */
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

/**
 * Represents a single reaction on a moment.
 */
export interface Reaction {
  id: number;
  userId: string | number;
  isLike: boolean; 
}

/**
 * Represents a single comment on a moment.
 */
export interface Comment {
  id: number;
  user: MomentUser;
  text: string;
  createdAt: string; // ISO 8601 date string
}

/**
 * The main interface for a social Moment, representing a post by a user.
 */
export interface Moment {
  id: number;
  user: MomentUser;
  imageUrl: string;
  caption?: string | null;
  lat?: number | null;
  lng?: number | null;
  locationName?: string | null;
  privacy?: 'Public' | 'Friend' | 'Private' | string;
  createdAt: string; // ISO 8601 date string
  comments: Comment[];
  reactions: Reaction[];
}

// --- Request Payloads ---

/**
 * Interface for the data required to create a new Moment.
 * This is typically sent from the client as a multipart/form-data request.
 */
export interface MomentCreateRequest {
  image: File;
  caption?: string | null;
  lat?: number | null;
  lng?: number | null;
  privacy?: string;
}

/**
 * Interface for the data required to post a new comment on a Moment.
 */
export interface CommentRequest {
  momentId: number;
  text: string;
}