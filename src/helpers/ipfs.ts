import { readFileSync } from 'fs';
import { Blob, File, NFTStorage } from 'nft.storage';

import { NFT_STORAGE_TOKEN } from '../config/storage';
import { AudioMimeType } from './metadata';

const storage = new NFTStorage({ token: NFT_STORAGE_TOKEN });

async function uploadFile(name: string, type: AudioMimeType, data: Buffer) {
  const imageFile = new File([data], "audio.m4a", { type: "audio/m4a" });
  const cid = await storage.storeBlob(imageFile);
  return cid;

  // file is retrieved using ipfs://<cid>, or https://ipfs.io/ipfs/<cid>, or https://nftstorage.link/ipfs/<cid>
}

async function uploadMetadata(_metadata) {
  const metadata = await storage.store(_metadata);
  return metadata;
}
