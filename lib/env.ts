export const ENV = {
  CHAIN_ID: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? '11155111'),
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL!,
  TOKEN_ADDRESS: process.env.NEXT_PUBLIC_TOKEN_ADDRESS!,
  EXPLORER_BASE: process.env.NEXT_PUBLIC_EXPLORER_BASE ?? 'https://sepolia.etherscan.io',
};
