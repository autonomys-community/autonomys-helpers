export const NETWORKS = {
  mainnet: {
    name: 'Mainnet',
    networkId: 'mainnet' as const,
    rpc: {
      consensus: 'wss://rpc.mainnet.subspace.foundation/ws',
      autoEvm: 'wss://auto-evm.mainnet.autonomys.xyz/ws',
    },
    evmRpcHttp: 'https://auto-evm.mainnet.autonomys.xyz/ws',
    evmChainId: 870,
    domainId: 0,
    indexer: 'https://indexer-api.mainnet.autonomys.xyz/v1/xdm',
    explorers: {
      consensus: 'https://autonomys.subscan.io',
      autoEvm: 'https://explorer.auto-evm.mainnet.autonomys.xyz',
    },
  },
  chronos: {
    name: 'Chronos Testnet',
    networkId: 'chronos' as const,
    rpc: {
      consensus: 'wss://rpc.chronos.autonomys.xyz/ws',
      autoEvm: 'wss://auto-evm.chronos.autonomys.xyz/ws',
    },
    evmRpcHttp: 'https://auto-evm.chronos.autonomys.xyz/ws',
    evmChainId: 8700,
    domainId: 0,
    indexer: 'https://indexer-api.chronos.autonomys.xyz/v1/xdm',
    explorers: {
      consensus: 'https://autonomys-chronos.subscan.io',
      autoEvm: 'https://explorer.auto-evm.chronos.autonomys.xyz',
    },
  },
} as const;

export type NetworkType = keyof typeof NETWORKS;

/**
 * Build an explorer URL for a wallet address.
 * EVM (0x) addresses go to Blockscout, Substrate (SS58) addresses go to Subscan.
 * `chain` is the raw chain string from the transfer (e.g. "Consensus" or "Domain(0)").
 */
export function getAddressExplorerUrl(
  network: NetworkType,
  address: string,
  chain: string
): string {
  const config = NETWORKS[network];
  const isEvm = address.startsWith('0x');

  if (isEvm || chain !== 'Consensus') {
    return `${config.explorers.autoEvm}/address/${address}`;
  }
  return `${config.explorers.consensus}/account/${address}`;
}

/**
 * Build an explorer URL for a block number.
 * Consensus blocks go to Subscan, domain blocks go to Blockscout.
 */
export function getBlockExplorerUrl(
  network: NetworkType,
  blockNumber: number,
  chain: string
): string {
  const config = NETWORKS[network];
  if (chain === 'Consensus') {
    return `${config.explorers.consensus}/block/${blockNumber}`;
  }
  return `${config.explorers.autoEvm}/block/${blockNumber}`;
}

// XDM confirmation depths in domain blocks
export const CONSENSUS_TO_DOMAIN_DEPTH = 100;
export const DOMAIN_TO_CONSENSUS_DEPTH = 14_400;
