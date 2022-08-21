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
  profileIds: string[];
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

interface Profile {
  id: string;
  handle: string;
}

interface Publication {
  __typename: "Post" | "Comment";
  commentOn: Publication;
  id: string;
  metadata: Metadata;
  profile: Profile;
  name: String;
  description: String;
}

interface PublicationProps {
  onSelect: onSelectFunc;
  id: string;
  profile: Profile;
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
          profile={root.profile}
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

const Publication = ({ id, profile, metadata, onSelect }: PublicationProps) => {
  const media = metadata.media;
  const squashUrl = media[0].original.url;
  const deltaUrl = media.length > 1 ? media[1].original.url : null;
  const backgroundStyle = deltaUrl ? "bg-cyan-200" : "bg-teal-200";

  return (
    <div
      className={`w-[400px] h-[350px] p-8 ${backgroundStyle} shadow-lg mx-2 my-2 rounded-sm`}
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
        <div className="flex flex-row">
          <Collect publicationId={id} />
          <div className="flex-grow text-right">
            <a
              href={`https://testnet.lenster.xyz/u/${profile.handle}`}
              target="_blank"
              rel="noreferrerer"
            >
              @{profile.handle}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PubNode {
  root: Publication;
  children: PubNode[];
  onSelect: onSelectFunc;
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

const Publications = ({ profileIds, onSelect }: PublicationsProps) => {
  const publications: Publication[] = profileIds
    .map((id) => {
      const { loading, error, data } = useGetPublications(id);
      if (data && data.publications) {
        return data.publications.items;
      }
      return [];
    })
    .flat();

  if (publications.length > 0) {
    const posts = publications.filter((pub: Publication) => {
      return pub.__typename == "Post";
    });
    const comments = publications
      .filter((pub: Publication) => {
        return pub.__typename == "Comment";
      })
      .sort((a: Publication, b: Publication) => {
        const idA = BigNumber.from(a.id.split("-")[0]);
        const idB = BigNumber.from(b.id.split("-")[0]);
        return idA.sub(idB).toNumber();
      })
      .sort((a: Publication, b: Publication) => {
        const idA = BigNumber.from(a.id.split("-")[1]);
        const idB = BigNumber.from(b.id.split("-")[1]);
        return idA.sub(idB).toNumber();
      });

    console.log("Comments", comments);
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
      <div>
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
