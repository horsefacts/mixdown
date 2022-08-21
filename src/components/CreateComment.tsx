import { BigNumberish, BytesLike, ethers } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';

import LensHubABI from '../config/abis/LensHub.json';
import { useContractAddresses } from '../config/contracts';
import { useGetProfiles } from '../gql/profiles';
import { mixTracks } from '../helpers/audio';
import { postMetadata } from '../helpers/metadata';
import { getGatewayURI, Storage } from '../helpers/storage';
import Publications from './Publications';

export type CommentDataStruct = {
  profileId: BigNumberish;
  contentURI: string;
  profileIdPointed: BigNumberish;
  pubIdPointed: BigNumberish;
  referenceModuleData: BytesLike;
  collectModule: string;
  collectModuleInitData: BytesLike;
  referenceModule: string;
  referenceModuleInitData: BytesLike;
};

interface FormValues {
  name: string;
  description: string;
  file?: File;
}

const CreateComment = () => {
  const [selectedPostId, setSelectedPostId] = useState<string>();
  const [selectedPostProfileId, setSelectedPostProfileId] = useState<string>();
  const [progressMessage, setProgressMessage] = useState<string>();
  const [commentDataStruct, setCommentDataStruct] =
    useState<CommentDataStruct>();
  const { data: profileData } = useGetProfiles();
  const profileId = profileData?.profiles.items[0].id;
  const { lensHub, freeCollectModule } = useContractAddresses();
  const { config, error } = usePrepareContractWrite({
    addressOrName: lensHub,
    contractInterface: LensHubABI.abi,
    functionName: "comment",
    args: [commentDataStruct],
  });
  const { write } = useContractWrite(config);

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
    } as FormValues,
    onSubmit: async (values) => {
      const { name, description, file } = values;
      setProgressMessage("Creating post...");
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          setProgressMessage("Reading file...");
          if (
            reader.result &&
            typeof reader.result != "string" &&
            selectedPostId &&
            selectedPostProfileId
          ) {
            const storage = new Storage();
            setProgressMessage("Uploading track audio...");
            const trackCid = await storage.uploadTrack(
              "my-file",
              file.type,
              Buffer.from(reader.result)
            );

            setProgressMessage("Mixing audio...");
            const mix = await mixTracks(
              getGatewayURI(trackCid),
              "https://ipfs.io/ipfs/bafybeih7f7uove336jj23d363nascdawfhhutzstc236thrnh3j5haztza"
            );

            setProgressMessage("Uploading mix audio...");
            const mixBuffer = await mix.blob.arrayBuffer();
            const mixCid = await storage.uploadTrack(
              "my-file",
              file.type,
              Buffer.from(mixBuffer)
            );

            setProgressMessage("Generating token metadata...");
            const metadata = postMetadata({
              name,
              description,
              media: [
                {
                  item: getGatewayURI(trackCid),
                  type: file.type,
                  altTag: "Multitrack track",
                },
                {
                  item: getGatewayURI(mixCid),
                  type: file.type,
                  altTag: "Multitrack mix",
                },
              ],
            });

            setProgressMessage("Uploading token metadata...");
            const postCid = await storage.uploadMetadata(metadata);

            const commentData: CommentDataStruct = {
              profileId: profileId,
              contentURI: getGatewayURI(postCid),
              profileIdPointed: selectedPostProfileId,
              pubIdPointed: selectedPostId,
              collectModule: freeCollectModule,
              collectModuleInitData: defaultAbiCoder.encode(["bool"], [true]),
              referenceModule: ethers.constants.AddressZero,
              referenceModuleInitData: [],
              referenceModuleData: [],
            };
            setCommentDataStruct(commentData);
            setProgressMessage("Creating Lens post...");
            write?.();
          }
        };
        reader.readAsArrayBuffer(file);
      }
    },
  });

  const onSelectPublication = (selectedPostId: string) => {
    const [profileId, postId] = selectedPostId.split("-");
    setSelectedPostId(postId);
    setSelectedPostProfileId(profileId);
  };

  return (
    <div>
      <div>
        <p>{selectedPostId}</p>
        <p>{selectedPostProfileId}</p>
      </div>
      <div className="flex flex-col bg-gray-300">
        <form
          className="flex flex-col p-16 m-auto"
          onSubmit={formik.handleSubmit}
        >
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            onChange={formik.handleChange}
            value={formik.values.name}
          />
          <label htmlFor="description">Description</label>
          <input
            id="description"
            name="description"
            type="text"
            onChange={formik.handleChange}
            value={formik.values.description}
          />

          <label htmlFor="file">Track</label>
          <input
            id="file"
            name="file"
            type="file"
            accept="audio/*"
            onChange={(event) => {
              if (event.currentTarget.files) {
                formik.setFieldValue("file", event.currentTarget.files[0]);
              }
            }}
          />

          <button type="submit">Submit</button>
        </form>
      </div>
      <div>{progressMessage}</div>
      <Publications profileId={profileId} onSelect={onSelectPublication} />
    </div>
  );
};

export default CreateComment;
