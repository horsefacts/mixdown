import { BigNumberish, BytesLike, ethers } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';

import LensHubABI from '../config/abis/LensHub.json';
import { useContractAddresses } from '../config/contracts';
import { useGetProfiles } from '../gql/profiles';
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
  const [progressMessage, setProgressMessage] = useState<string>();
  const [postDataStruct, setPostDataStruct] =
    useState<PostDataStruct>(emptyStruct);
  const { data: profileData } = useGetProfiles();
  const profileId = profileData?.profiles.items[0].id;
  const { lensHub, freeCollectModule } = useContractAddresses();
  const { config, error } = usePrepareContractWrite({
    addressOrName: lensHub,
    contractInterface: LensHubABI.abi,
    functionName: "post",
    args: [postDataStruct],
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
            profileData
          ) {
            const storage = new Storage();
            setProgressMessage("Uploading track audio...");
            const trackCid = await storage.uploadTrack(
              "my-file",
              file.type,
              Buffer.from(reader.result)
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
            console.log(postDataStruct);
            write?.();
          }
        };
        reader.readAsArrayBuffer(file);
      }
    },
  });
  return (
    <div>
      {JSON.stringify(profileData?.profiles.items[0].id)}
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
      <Publications profileId={profileId} />
    </div>
  );
};

export default CreatePost;
