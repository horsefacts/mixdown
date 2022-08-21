import { useContractWrite, usePrepareContractWrite } from 'wagmi';

import LensHubABI from '../config/abis/LensHub.json';
import { useContractAddresses } from '../config/contracts';

interface CollectProps {
  publicationId: string;
}

const Collect = ({ publicationId }: CollectProps) => {
  const [profileId, pubId] = publicationId.split("-");
  const { lensHub } = useContractAddresses();
  const { config, error } = usePrepareContractWrite({
    addressOrName: lensHub,
    contractInterface: LensHubABI.abi,
    functionName: "collect",
    args: [profileId, pubId, "0x"],
  });
  const { write } = useContractWrite(config);
  return (
    <div>
      <button
        className="px-4 py-2 bg-gray-200 rounded shadow hover:bg-gray-400"
        onClick={() => write?.()}
      >
        Collect
      </button>
    </div>
  );
};

export default Collect;
