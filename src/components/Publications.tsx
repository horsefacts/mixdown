import { BigNumberish, BytesLike, ethers } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';

import LensHubABI from '../config/abis/LensHub.json';
import { useContractAddresses } from '../config/contracts';
import { useGetProfiles } from '../gql/profiles';
import { useGetPublications } from '../gql/publications';
import { postMetadata } from '../helpers/metadata';
import { getGatewayURI, Storage } from '../helpers/storage';

interface PublicationsProps {
  profileId?: string;
  onSelect?: (publicationId: string) => {};
}

interface Media {
  original: {
    mimeType: string;
    url: string;
  };
}

interface Metadata {
  name: string;
  description: string;
  media: Media[];
}

interface Publication {
  id: string;
  metadata: Metadata;
}

const Publications = ({ profileId, onSelect }: PublicationsProps) => {
  const {
    loading,
    error,
    data: publicationData,
  } = useGetPublications(profileId);
  console.log(publicationData.publications.items);
  if (publicationData) {
    return (
      <div>
        {publicationData.publications.items.map((pub: Publication) => {
          return (
            <div key={pub.id} onClick={() => onSelect && onSelect(pub.id)}>
              <h2>{pub.metadata.name}</h2>
              <p>{pub.metadata.description}</p>
              <div>
                <audio
                  controls
                  src={pub.metadata.media[0].original.url}
                ></audio>
              </div>
            </div>
          );
        })}
      </div>
    );
  } else {
    return <div></div>;
  }
};

export default Publications;
