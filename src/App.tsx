import { useAccount } from 'wagmi';

import { ConnectButton } from '@rainbow-me/rainbowkit';

import CreateComment from './components/CreateComment';
import CreatePost from './components/CreatePost';
import Publications from './components/Publications';

const App = () => {
  const { isConnected } = useAccount();
  return (
    <div>
      <div className="fixed top-4 right-4">
        <ConnectButton />
      </div>
      {isConnected && <CreatePost />}
    </div>
  );
};

export default App;
