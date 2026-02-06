export const NETWORKS = {
  mainnet: {
    name: 'Mainnet',
    rpc: {
      consensus: 'wss://rpc.mainnet.subspace.foundation/ws',
      autoEvm: 'wss://auto-evm.mainnet.autonomys.xyz/ws',
    },
    indexer: 'https://indexer-api.mainnet.autonomys.xyz/v1/xdm',
  },
  chronos: {
    name: 'Chronos Testnet',
    rpc: {
      consensus: 'wss://rpc.chronos.autonomys.xyz/ws',
      autoEvm: 'wss://auto-evm.chronos.autonomys.xyz/ws',
    },
    indexer: 'https://indexer-api.chronos.autonomys.xyz/v1/xdm',
  },
} as const;

export type NetworkType = keyof typeof NETWORKS;

// XDM confirmation depths in domain blocks
export const CONSENSUS_TO_DOMAIN_DEPTH = 100;
export const DOMAIN_TO_CONSENSUS_DEPTH = 14_400;
