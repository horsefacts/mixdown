import { BigNumber, BigNumberish, BytesLike, ethers } from 'ethers';
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
import Collect from './Collect';

type onSelectFunc = (
  publicationId: string,
  publicationName: string,
  contentCid: string
) => void;

interface PublicationsProps {
  profileId?: string;
  onSelect: onSelectFunc;
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
  __typename: "Post" | "Comment";
  commentOn: Publication;
  id: string;
  metadata: Metadata;
}

interface PublicationProps {
  onSelect: onSelectFunc;
  id: string;
  metadata: Metadata;
}

interface PublicationNodeProps {
  onSelect: onSelectFunc;
  root: Publication;
  children: PublicationNodeProps[];
}

const PublicationNode = ({
  root,
  children,
  onSelect,
}: PublicationNodeProps) => {
  return (
    <div className="flex flex-row">
      <div>
        <Publication
          metadata={root.metadata}
          id={root.id}
          onSelect={onSelect}
        />
      </div>
      <div className="flex flex-col">
        {children.map((node) => {
          return (
            <PublicationNode
              key={node.root.id}
              root={node.root}
              children={node.children}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
};

const Publication = ({ id, metadata, onSelect }: PublicationProps) => {
  const media = metadata.media;
  const squashUrl = media[0].original.url;
  const deltaUrl = media.length > 1 ? media[1].original.url : null;
  const backgroundStyle = deltaUrl ? "bg-cyan-200" : "bg-teal-200";

  return (
    <div
      className={`p-4 ${backgroundStyle}`}
      onClick={() => onSelect && onSelect(id, metadata.name, squashUrl)}
    >
      <h2 className="text-xl font-bold">{metadata.name}</h2>
      <p className="mb-4">{metadata.description}</p>
      <div className="space-y-4">
        <div className="flex flex-row">
          <span className="inline-block mr-2 text-4xl">🎛</span>
          <audio className="p-2 rounded" controls src={squashUrl}></audio>
        </div>
        {deltaUrl && (
          <div className="flex flex-row">
            <span className="inline-block mr-2 text-4xl">🎚</span>
            <audio className="p-2 rounded" controls src={deltaUrl}></audio>
          </div>
        )}
        <Collect publicationId={id} />
      </div>
    </div>
  );
};

interface PubNode {
  root: Publication;
  children: PubNode[];
  onSelect: (publicationId: string, contentCid: string) => void;
}

function addLeaf(nodes: PubNode[], element: Publication) {
  for (let i = 0; i < nodes.length; i++) {
    if (
      element.__typename == "Comment" &&
      element.commentOn.id == nodes[i].root.id
    ) {
      nodes[i].children.push({
        root: element,
        children: [],
        onSelect: nodes[i].onSelect,
      });
      return true;
    } else {
      if (addLeaf(nodes[i].children, element)) {
        return true;
      }
    }
  }
  return false;
}

const Publications = ({ profileId, onSelect }: PublicationsProps) => {
  const {
    loading,
    error,
    data: publicationData,
  } = useGetPublications(profileId);
  if (publicationData && publicationData.publications) {
    const posts = publicationData.publications.items.filter(
      (pub: Publication) => {
        return pub.__typename == "Post";
      }
    );
    const comments = publicationData.publications.items
      .filter((pub: Publication) => {
        return pub.__typename == "Comment";
      })
      .sort((a: Publication, b: Publication) => {
        const idA = BigNumber.from(a.id.split("-")[1]);
        const idB = BigNumber.from(b.id.split("-")[1]);
        return idA.sub(idB);
      });

    const roots = posts.map((pub: Publication) => {
      return {
        root: pub,
        children: [],
        onSelect: onSelect,
      };
    });

    for (let i = 0; i < comments.length; i++) {
      if (!addLeaf(roots, comments[i])) {
        console.log(
          "There doesn't seem to be a parent for comment ",
          comments[i].id
        );
      }
    }

    return (
      <div className="h-screen overflow-auto">
        {roots.map(({ root, children, onSelect }: PubNode) => {
          return (
            <PublicationNode
              key={root.id}
              onSelect={onSelect}
              root={root}
              children={children}
            />
          );
        })}
      </div>
    );
  } else {
    return <div></div>;
  }
};

export default Publications;
