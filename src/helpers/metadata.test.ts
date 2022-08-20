import { File } from 'nft.storage';

import { MimeType, postMetadata, PostMetadataParams, PublicationContentWarning } from './metadata';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;

const postParams: PostMetadataParams = {
  name: "My post name",
  description: "My description",
  // image: "www.my-site.com/image.png",
  // imageMimeType: "image/png",
};

describe("metadata helpers", () => {
  describe("postMetadata", () => {
    it("includes metatada version", () => {
      const { version } = postMetadata(postParams);
      expect(version).toBe("2.0.0");
    });

    it("adds a UUID metadata_id", () => {
      const { metadata_id } = postMetadata(postParams);
      expect(metadata_id).toMatch(UUID_REGEX);
    });

    it("Adds a description", () => {
      const { description } = postMetadata({
        ...postParams,
        description: "My description",
      });
      expect(description).toBe("My description");
    });

    it("Adds english locale", () => {
      const { locale } = postMetadata(postParams);
      expect(locale).toBe("en-US");
    });

    it("Adds tags", () => {
      const { tags } = postMetadata({
        ...postParams,
        tags: ["tag1", "tag2", "tag3"],
      });
      expect(tags).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("Adds content warning", () => {
      const { contentWarning } = postMetadata({
        ...postParams,
        contentWarning: PublicationContentWarning.SPOILER,
      });
      expect(contentWarning).toEqual("SPOILER");
    });

    it("Adds publication main content focus to Audio", () => {
      const { mainContentFocus } = postMetadata(postParams);
      expect(mainContentFocus).toBe("AUDIO");
    });

    it("Adds name", () => {
      const { name } = postMetadata(postParams);
      expect(name).toEqual("My post name");
    });

    it("Adds empty attributes", () => {
      const { attributes } = postMetadata(postParams);
      expect(attributes).toEqual([]);
    });

    it("Adds image", () => {
      const { image } = postMetadata({
        ...postParams,
        image: "www.my-site.com/image.png",
      });
      expect(image).toEqual("www.my-site.com/image.png");
    });

    it("Adds image mime type", () => {
      const { imageMimeType } = postMetadata({
        ...postParams,
        imageMimeType: "image/png",
      });
      expect(imageMimeType).toEqual("image/png");
    });

    it("Adds media", () => {
      const { media } = postMetadata({
        ...postParams,
        media: [
          {
            item: "www.my-host.com/sound.wav",
            type: "audio/wav",
            altTag: "My audio",
          },
        ],
      });
      if (media) {
        expect(media.length).toEqual(1);
        expect(media[0]).toEqual({
          item: "www.my-host.com/sound.wav",
          type: "audio/wav",
          altTag: "My audio",
        });
      } else {
        throw new Error("media is not defined");
      }
      expect(media[0]).toEqual({
        item: "www.my-host.com/sound.wav",
        type: "audio/wav",
        altTag: "My audio",
      });
    });

    it("Adds app ID", () => {
      const { appId } = postMetadata(postParams);
      expect(appId).toEqual("Multitrack");
    });
  });
});
