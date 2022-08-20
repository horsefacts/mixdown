import { randomUUID } from 'crypto';

type ImageMimeType =
  | "image/gif"
  | "image/jpeg"
  | "image/png"
  | "image/tiff"
  | "image/x-ms-bmp"
  | "image/svg+xml"
  | "image/webp";

type AudioMimeType = "audio/wav" | "audio/mpeg" | "audio/ogg";

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
  description?: string;
  tags?: string[];
  contentWarning?: PublicationContentWarning;
  name: string;
  image?: string; // URL
  imageMimeType?: ImageMimeType;
  media?: PublicationMetadataMedia[];
}

export const postMetadata = (params: PostMetadataParams) => {
  return {
    version: "2.0.0",
    metadata_id: randomUUID(),
    description: params.description || null,
    locale: "en-US",
    tags: params.tags || null,
    contentWarning: params.contentWarning,
    mainContentFocus: "AUDIO",
    name: params.name,
    attributes: [],
    image: params.image || null,
    imageMimeType: params.imageMimeType || null,
    media: params.media || null,
    appId: "Multitrack",
  };
};
