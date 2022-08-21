import { chain, useNetwork } from 'wagmi';

const contracts = {
  [chain.polygonMumbai.name]: {
    lensHub: "0x60Ae865ee4C725cd04353b5AAb364553f56ceF82",
    freeCollectModule: "0x0BE6bD7092ee83D44a6eC1D949626FeE48caB30c",
  },
};

export const useContractAddresses = () => {
  const { chain: currentChain } = useNetwork();
  if (currentChain) {
    return contracts[currentChain.name];
  } else {
    return contracts[chain.polygonMumbai.name];
  }
};

export default contracts;
