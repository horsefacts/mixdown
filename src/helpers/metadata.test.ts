import { MimeType, postMetadata, PublicationContentWarning } from './metadata';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;

describe("metadata helpers", () => {
  describe("postMetadata", () => {
    it("includes metatada version", () => {
      const { version } = postMetadata({ name: "My name" });
      expect(version).toBe("2.0.0");
    });

    it("adds a UUID metadata_id", () => {
      const { metadata_id } = postMetadata({ name: "My name" });
      expect(metadata_id).toMatch(UUID_REGEX);
    });

    it("Adds a description", () => {
      const { description } = postMetadata({
        name: "My name",
        description: "My description",
      });
      expect(description).toBe("My description");
    });

    it("Adds english locale", () => {
      const { locale } = postMetadata({ name: "My name" });
      expect(locale).toBe("en-US");
    });

    it("Adds tags", () => {
      const { tags } = postMetadata({
        name: "My name",
        tags: ["tag1", "tag2", "tag3"],
      });
      expect(tags).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("Adds content warning", () => {
      const { contentWarning } = postMetadata({
        name: "My name",
        contentWarning: PublicationContentWarning.SPOILER,
      });
      expect(contentWarning).toEqual("SPOILER");
    });

    it("Adds publication main content focus to Audio", () => {
      const { mainContentFocus } = postMetadata({
        name: "My name",
      });
      expect(mainContentFocus).toBe("AUDIO");
    });

    it("Adds name", () => {
      const { name } = postMetadata({
        name: "My post name",
      });
      expect(name).toEqual("My post name");
    });

    it("Adds empty attributes", () => {
      const { attributes } = postMetadata({
        name: "My post name",
      });
      expect(attributes).toEqual([]);
    });

    it("Adds image", () => {
      const { image } = postMetadata({
        name: "Some name",
        image: "www.my-site.com/image.png",
      });
      expect(image).toEqual("www.my-site.com/image.png");
    });

    it("Adds image mime type", () => {
      const { imageMimeType } = postMetadata({
        name: "Some name",
        imageMimeType: "image/png",
      });
      expect(imageMimeType).toEqual("image/png");
    });

    it("Adds media", () => {
      const { media } = postMetadata({
        name: "Some name",
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
      const { appId } = postMetadata({
        name: "Some name",
      });
      expect(appId).toEqual("Multitrack");
    });
  });
});
