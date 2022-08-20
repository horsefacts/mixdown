import { BigNumberish, BytesLike, ethers } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';

import { ConnectButton } from '@rainbow-me/rainbowkit';

import LensHubABI from '../config/abis/LensHub.json';
import contracts from '../config/contracts';
import { postMetadata } from '../helpers/metadata';
import { Storage } from '../helpers/storage';

export type PostDataStruct = {
  profileId: BigNumberish;
  contentURI: string;
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

const CreatePost = () => {
  const [progressMessage, setProgressMessage] = useState<string>();
  const [postDataStruct, setPostDataStruct] = useState<PostDataStruct>();
  const { config, error } = usePrepareContractWrite({
    addressOrName: contracts.lensHub,
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
          if (reader.result && typeof reader.result != "string") {
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
                { item: trackCid, type: file.type, altTag: "Multitrack track" },
              ],
            });

            setProgressMessage("Uploading token metadata...");
            const postCid = await storage.uploadMetadata(metadata);

            const postData: PostDataStruct = {
              profileId: 1,
              contentURI: `ipfs://${postCid}`,
              collectModule: contracts.freeCollectModule,
              collectModuleInitData: defaultAbiCoder.encode(["bool"], [true]),
              referenceModule: ethers.constants.AddressZero,
              referenceModuleInitData: [],
            };
            setPostDataStruct(postData);
            setProgressMessage("Creating Lens post...");
            write?.();
          }
        };
        reader.readAsArrayBuffer(file);
      }
    },
  });
  return (
    <div>
      <div className="fixed top-4 right-4">
        <ConnectButton />
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
    </div>
  );
};

export default CreatePost;
