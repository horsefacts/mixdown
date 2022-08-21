import { useAccount } from 'wagmi';

import { ConnectButton } from '@rainbow-me/rainbowkit';

import CreatePost from './components/CreatePost';

const App = () => {
  const { isConnected } = useAccount();
  return (
    <div>
      <div className="fixed z-10 top-4 right-4">
        <ConnectButton />
      </div>
      {isConnected ? (
        <CreatePost />
      ) : (
        <div className="flex flex-row">
          <div className="flex flex-col w-1/4 h-screen shadow bg-gradient-to-r from-gray-300 to-gray-100">
            <div>
              <div className="p-8 text-center">
                <h1 className="text-4xl font-extrabold">🎛 Mixdown</h1>
                <p className="px-8 py-4">
                  Connect a wallet holding a Lens profile NFT to use Mixdown.
                </p>
                <div className="flex flex-row mt-4 place-content-center">
                  <ConnectButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
