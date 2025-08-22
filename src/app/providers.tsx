'use client';

import { PropsWithChildren } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ENV } from '@/lib/env';

const config = createConfig({
  chains: [sepolia],
  connectors: [injected({ target: 'metaMask' })],
  transports: { [sepolia.id]: http(ENV.RPC_URL) },
});

const queryClient = new QueryClient();

export default function Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
