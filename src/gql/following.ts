import { useAccount } from 'wagmi';

import { gql, useQuery } from '@apollo/client';

const GET_FOLLOWING = `
query($request: FollowingRequest!) {
  following(request: $request) {
              items {
          profile {
            id
            name
            bio
            attributes {
              displayType
              traitType
              key
              value
            }
            followNftAddress
            metadata
            isDefault
            handle
            picture {
              ... on NftImage {
                contractAddress
                tokenId
                uri
                verified
              }
              ... on MediaSet {
                original {
                  url
                  width
                  height
                  mimeType
                }
                medium {
                  url
                  width
                  height
                  mimeType
                }
                small {
                  url
                  width
                  height
                  mimeType
                }
              }
            }
            coverPicture {
              ... on NftImage {
                contractAddress
                tokenId
                uri
                verified
              }
              ... on MediaSet {
                original {
                  url
                  width
                  height
                  mimeType
                }
                small {
                  width
                  url
                  height
                  mimeType
                }
                medium {
                  url
                  width
                  height
                  mimeType
                }
              }
            }
            ownedBy
            dispatcher {
              address
              canUseRelay
            }
            stats {
              totalFollowers
              totalFollowing
              totalPosts
              totalComments
              totalMirrors
              totalPublications
              totalCollects
            }
            followModule {
              ... on FeeFollowModuleSettings {
                type
                amount {
                  asset {
                    name
                    symbol
                    decimals
                    address
                  }
                  value
                }
                recipient
              }
              ... on ProfileFollowModuleSettings {
                type
              }
              ... on RevertFollowModuleSettings {
                type
              }
          }
        }
        totalAmountOfTimesFollowing
      }
     pageInfo {
        prev
        next
        totalCount
     }
      }
}
`;

export const useGetFollowing = () => {
  const { address } = useAccount();

  if (!address) {
    return {};
  }

  const { loading, error, data } = useQuery(gql(GET_FOLLOWING), {
    variables: {
      request: {
        address,
        limit: 10,
      },
    },
  });

  return { loading, error, data };
};
