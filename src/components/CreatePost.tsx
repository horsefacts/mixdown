import { BigNumberish, BytesLike, ethers } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';

import LensHubABI from '../config/abis/LensHub.json';
import { useContractAddresses } from '../config/contracts';
import { useGetFollowing } from '../gql/following';
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

interface IProfile {
  id: string;
  name: string | null;
  handle: string;
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
  const profileId = profileData?.profiles.items[0]?.id;
  const { data: followingData } = useGetFollowing();
  if (followingData && followingData.following.items) {
    console.log("Following.following.items", followingData.following.items);
  }

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
                  "bafkreifrrtdytfpgstetmugs7yu3zrwh5p6bvp2q35e5av3ixyoknzpzlq"
                ),
                imageMimeType: "image/png",
                media: [
                  {
                    item: getGatewayURI(trackCid),
                    type: file.type,
                    altTag: "Multitrack track",
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

              setProgressMessage("Uploading post metadata...");
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

  if (!profileId) {
    return (
      <div className="flex flex-row">
        <div className="flex flex-col w-1/4 h-screen shadow bg-gradient-to-r from-gray-300 to-gray-100">
          <div>
            <div className="p-8 text-center">
              <h1 className="text-4xl font-extrabold">🎛 Multitrack</h1>
            </div>
          </div>
        </div>
        <div className="w-3/4 h-screen text-center">
          <div className="mt-48 text-2xl">
            <p>Looks like you don't have a Lens profile.</p>
            <p>
              You can create one by following{" "}
              <a
                href="https://docs.lens.xyz/docs/create-profile"
                className="underline"
              >
                these instructions
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row">
      <div className="flex flex-col w-1/4 h-screen shadow bg-gradient-to-r from-gray-300 to-gray-100">
        <div>
          <div className="p-8 text-center">
            <h1 className="text-4xl font-extrabold">🎛 Multitrack</h1>
          </div>
          <form
            className="flex flex-col px-16 m-auto space-y-4"
            onSubmit={formik.handleSubmit}
          >
            <div className="flex flex-col">
              <div className="pb-4 text-xl text-center">
                {selectedName
                  ? "Add your touch to '" + selectedName + "'"
                  : "Create a new base track."}
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
                className="px-4 py-2 text-xl rounded shadow bg-violet-300 hover:bg-violet-400"
                type="submit"
              >
                {selectedPostId ? "Create Mix" : "Create Track"}
              </button>
              {selectedPostId && (
                <button
                  className="px-4 py-2 ml-4 text-xl bg-gray-100 rounded shadow hover:bg-gray-200"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectPublication("-", "", "");
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        <div className="my-4 text-center">
          {progressMessage ? (
            <svg
              className="inline w-4 h-4 mr-2 text-gray-200 animate-spin dark:text-gray-400 fill-violet-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
          ) : (
            ""
          )}
          {progressMessage}
        </div>
      </div>
      <div className="w-3/4 h-screen overflow-auto">
        <div className="p-4 mb-2 text-2xl border-b-2 border-violet-200 bold">
          My multitracks
        </div>
        <Publications profileId={profileId} onSelect={onSelectPublication} />
        {followingData?.following?.items.map(
          ({ profile }: { profile: IProfile }) => {
            return (
              <>
                <div className="p-4 mb-2 text-2xl border-b-2 border-violet-200 bold">
                  {profile.name ? profile.name + " - " : ""}@{profile.handle}
                </div>
                <Publications
                  profileId={profile.id}
                  onSelect={onSelectPublication}
                />
              </>
            );
          }
        )}
      </div>
    </div>
  );
};

export default CreatePost;
