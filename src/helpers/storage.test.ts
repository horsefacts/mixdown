import { File } from 'nft.storage';

import { Storage } from './storage';

describe("Storage helpers", () => {
  describe("uploadFile", () => {
    it("calls storeBlob", async () => {
      const storageSpy = {
        storeBlob: jest.fn().mockResolvedValue("cid"),
        store: jest.fn().mockResolvedValue("else"), // ?
      };
      const storage = new Storage(storageSpy);
      await storage.uploadTrack("My file", "audio/wav", Buffer.from([]));

      expect(storageSpy.storeBlob).toHaveBeenCalledWith(expect.any(File));
    });
  });
});
