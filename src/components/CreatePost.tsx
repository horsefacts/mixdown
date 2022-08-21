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

export type PostDataStruct = {
  profileId: BigNumberish;
  contentURI: string;
  collectModule: string;
  collectModuleInitData: BytesLike;
  referenceModule: string;
  referenceModuleInitData: BytesLike;
};

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

const emptyStruct: PostDataStruct = {
  profileId: "0x0",
  contentURI: "",
  collectModule: ethers.constants.AddressZero,
  collectModuleInitData: [],
  referenceModule: ethers.constants.AddressZero,
  referenceModuleInitData: [],
};

interface FormValues {
  name: string;
  description: string;
  file?: File;
}

const CreatePost = () => {
  const [fileObjectURI, setFileObjectURI] = useState<string>();
  const [selectedPostId, setSelectedPostId] = useState<string>();
  const [selectedName, setSelectedPostName] = useState<string>();
  const [selectedPostProfileId, setSelectedPostProfileId] = useState<string>();
  const [selectedPostContentURI, setSelectedPostContentURI] =
    useState<string>();

  const [progressMessage, setProgressMessage] = useState<string>();
  const [postDataStruct, setPostDataStruct] =
    useState<PostDataStruct>(emptyStruct);
  const [commentDataStruct, setCommentDataStruct] =
    useState<CommentDataStruct>();
  const { data: profileData } = useGetProfiles();
  const profileId = profileData?.profiles.items[0].id;

  const { lensHub, freeCollectModule } = useContractAddresses();
  const { config: postConfig } = usePrepareContractWrite({
    addressOrName: lensHub,
    contractInterface: LensHubABI.abi,
    functionName: "post",
    args: [postDataStruct],
  });
  const { config: commentConfig } = usePrepareContractWrite({
    addressOrName: lensHub,
    contractInterface: LensHubABI.abi,
    functionName: "comment",
    args: [commentDataStruct],
  });
  const { write: createPost } = useContractWrite(postConfig);
  const { write: createComment } = useContractWrite(commentConfig);

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
          const storage = new Storage();

          if (reader.result && typeof reader.result != "string") {
            if (profileData && !selectedPostId) {
              setProgressMessage("Uploading track audio...");
              const trackCid = await storage.uploadTrack(
                "mix",
                file.type,
                Buffer.from(reader.result)
              );
              setProgressMessage("Generating token metadata...");
              const metadata = postMetadata({
                name,
                description,
                image: getGatewayURI(
                  "bafkreiaclhymdiwrhnxgs3eeqf4l6y5hhrs5wky6slovtewgraxhxmhpya"
                ),
                imageMimeType: "image/png",
                media: [
                  {
                    item: getGatewayURI(trackCid),
                    type: file.type,
                    altTag: "Multitrack mix",
                  },
                ],
              });

              setProgressMessage("Uploading token metadata...");
              const postCid = await storage.uploadMetadata(metadata);

              const postData: PostDataStruct = {
                profileId: profileData.profiles.items[0].id,
                contentURI: getGatewayURI(postCid),
                collectModule: freeCollectModule,
                collectModuleInitData: defaultAbiCoder.encode(["bool"], [true]),
                referenceModule: ethers.constants.AddressZero,
                referenceModuleInitData: [],
              };
              setPostDataStruct(postData);
              setProgressMessage("Creating Lens post...");
              createPost?.();
            } else if (
              selectedPostId &&
              selectedPostProfileId &&
              selectedPostContentURI
            ) {
              setProgressMessage("Uploading track audio...");
              const trackCid = await storage.uploadTrack(
                "track",
                file.type,
                Buffer.from(reader.result)
              );

              setProgressMessage("Mixing audio...");
              const mix = await mixTracks(
                getGatewayURI(trackCid),
                selectedPostContentURI
              );

              setProgressMessage("Uploading mix audio...");
              const mixBuffer = await mix.blob.arrayBuffer();
              const mixCid = await storage.uploadTrack(
                "mix",
                file.type,
                Buffer.from(mixBuffer)
              );

              setProgressMessage("Generating token metadata...");
              const metadata = postMetadata({
                name,
                description,
                media: [
                  {
                    item: getGatewayURI(mixCid),
                    type: file.type,
                    altTag: "Multitrack mix",
                    cover: getGatewayURI(
                      "bafkreiaclhymdiwrhnxgs3eeqf4l6y5hhrs5wky6slovtewgraxhxmhpya"
                    ),
                  },
                  {
                    item: getGatewayURI(trackCid),
                    type: file.type,
                    altTag: "Multitrack track",
                    cover: getGatewayURI(
                      "bafkreifrrtdytfpgstetmugs7yu3zrwh5p6bvp2q35e5av3ixyoknzpzlq"
                    ),
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
              createComment?.();
            }
          }
        };
        reader.readAsArrayBuffer(file);
      }
    },
  });

  const onSelectPublication = (
    selectedPostId: string,
    selectedPostName: string,
    selectedPostContentURI: string
  ) => {
    const [profileId, postId] = selectedPostId.split("-");
    setSelectedPostId(postId);
    setSelectedPostProfileId(profileId);
    setSelectedPostName(selectedPostName);
    setSelectedPostContentURI(selectedPostContentURI);
  };

  const fileToObjectUrl = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer], { type: file.type });
    return URL.createObjectURL(blob);
  };

  return (
    <div className="flex flex-row">
      <div className="flex flex-col h-screen bg-gradient-to-tr from-gray-300 to-gray-100">
        <div>
          <div className="p-8 text-center">
            <h1 className="text-4xl font-extrabold">🎛 Multitrack</h1>
          </div>
          <form
            className="flex flex-col px-16 m-auto space-y-4"
            onSubmit={formik.handleSubmit}
          >
            <div className="flex flex-col">
              <div className="pb-4 text-xl">
                {selectedName
                  ? "Add your touch to '" + selectedName + "'"
                  : "Create a new base track anyone can remix."}
              </div>
              <label htmlFor="name" className="font-bold">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="px-4 py-2"
                onChange={formik.handleChange}
                value={formik.values.name}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="description" className="font-bold">
                Description
              </label>
              <input
                id="description"
                name="description"
                type="text"
                className="px-4 py-2"
                onChange={formik.handleChange}
                value={formik.values.description}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="file" className="font-bold">
                Audio File
              </label>
              <input
                id="file"
                name="file"
                type="file"
                accept="audio/mpeg,audio/wav,audio/ogg"
                onChange={async (event) => {
                  if (event.currentTarget.files) {
                    formik.setFieldValue("file", event.currentTarget.files[0]);
                    const objectURI = await fileToObjectUrl(
                      event.currentTarget.files[0]
                    );
                    setFileObjectURI(objectURI);
                  }
                }}
              />
            </div>
            <div>
              {fileObjectURI && (
                <audio
                  className="p-2 rounded"
                  controls
                  src={fileObjectURI}
                ></audio>
              )}
            </div>
            <div>
              <button
                className="px-4 py-2 bg-gray-200 rounded shadow hover:bg-gray-400"
                type="submit"
              >
                {selectedPostId ? "Create Mix" : "Create Track"}
              </button>
            </div>
          </form>
        </div>
        <div>{progressMessage}</div>
      </div>
      <Publications profileId={profileId} onSelect={onSelectPublication} />
    </div>
  );
};

export default CreatePost;
