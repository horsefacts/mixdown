import { v4 as uuidv4 } from 'uuid';

type ImageMimeType =
  | "image/gif"
  | "image/jpeg"
  | "image/png"
  | "image/tiff"
  | "image/x-ms-bmp"
  | "image/svg+xml"
  | "image/webp";

export type AudioMimeType = "audio/wav" | "audio/mpeg" | "audio/ogg" | string;

interface PublicationMetadataMedia {
  item: string; // URL
  type?: AudioMimeType;
  altTag?: string;
  // cover?: string; // URL
}

export type MimeType = ImageMimeType | AudioMimeType;

export enum PublicationContentWarning {
  NSFW = "NSFW",
  SENSITIVE = "SENSITIVE",
  SPOILER = "SPOILER",
}

export interface PostMetadataParams {
  description: string;
  tags?: string[];
  contentWarning?: PublicationContentWarning;
  name: string;
  image?: string;
  imageMimeType?: ImageMimeType;
  media?: PublicationMetadataMedia[];
}

export const postMetadata = (params: PostMetadataParams): TrackPostMetadata => {
  return {
    version: "2.0.0",
    metadata_id: uuidv4(),
    description: params.description,
    locale: "en-US",
    tags: params.tags || null,
    contentWarning: params.contentWarning || null,
    mainContentFocus: "AUDIO",
    name: params.name,
    attributes: [],
    image: params.image || null,
    imageMimeType: params.imageMimeType || null,
    media: params.media || null,
    appId: "Multitrack",
  };
};

export interface TrackPostMetadata {
  version: "2.0.0";
  metadata_id: string;
  description: string;
  locale: "en-US";
  tags: string[] | null;
  contentWarning: PublicationContentWarning | null;
  mainContentFocus: "AUDIO";
  name: string;
  attributes: [];
  image: string | null;
  imageMimeType: ImageMimeType | null;
  media: PublicationMetadataMedia[] | null;
  appId: "Multitrack";
}
