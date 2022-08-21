import { readFileSync } from 'fs';
import { Blob, CIDString, File, NFTStorage, RequestOptions } from 'nft.storage';

import { NFT_STORAGE_TOKEN } from '../config/storage';
import { AudioMimeType, TrackPostMetadata } from './metadata';

interface StorageService {
  storeBlob: (
    blob: Blob,
    options?: RequestOptions | undefined
  ) => Promise<CIDString>;
}

export const getGatewayURI = (cid: string) => {
  return `https://ipfs.io/ipfs/${cid}`;
};

export class Storage {
  constructor(
    private readonly storage: StorageService = new NFTStorage({
      token: NFT_STORAGE_TOKEN,
    })
  ) {}

  async uploadTrack(name: string, type: AudioMimeType, data: Buffer) {
    const imageFile = new File([data], name, { type });
    const cid = await this.storage.storeBlob(imageFile);
    return cid;

    // file is retrieved using ipfs://<cid>, or https://ipfs.io/ipfs/<cid>, or https://nftstorage.link/ipfs/<cid>
  }

  // 1. upload image file, get back URL
  // 2. upload audio file 1, get back URL
  // 3. upload audio file 2, get back URL
  // 4. construct post metadata JSON
  // 5. upload metadata JSON, get back URL
  // 6. call lens hub contract with metadata URL
  async uploadMetadata(metadata: TrackPostMetadata) {
    const data = Buffer.from(JSON.stringify(metadata));
    const metadataFile = new File([data], metadata.metadata_id, {
      type: "application/json",
    });
    const cid = await this.storage.storeBlob(metadataFile);
    return cid;
  }
}
