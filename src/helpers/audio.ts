import Crunker from 'crunker';

export const mergeTracks = async (track1: string, track2: string) => {
  const crunker = new Crunker();
  const buffers = await crunker.fetchAudio(track1, track2);
  const merged = crunker.mergeAudio(buffers);
  return crunker.export(merged, "audio/mp3");
};
