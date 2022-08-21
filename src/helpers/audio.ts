import Crunker from 'crunker';

export const mixTracks = async (track1: string, track2: string) => {
  const crunker = new Crunker();
  const buffers = await crunker.fetchAudio(track1, track2);
  const mixed = crunker.mergeAudio(buffers);
  return crunker.export(mixed, "audio/mp3");
};
