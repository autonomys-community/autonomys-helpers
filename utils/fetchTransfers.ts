export interface BlockInfo {
  block_number: number;
  block_hash: string;
}

export interface XdmTransfer {
  src_chain: string;
  dst_chain: string;
  channel_id: string;
  nonce: string;
  sender: string;
  receiver: string;
  amount: string;
  initiated_src_block: BlockInfo | null;
  executed_dst_block: BlockInfo | null;
  acknowledged_src_block: BlockInfo | null;
  transfer_successful: boolean;
}

const INDEXER_ENDPOINTS = {
  mainnet: 'https://indexer-api.mainnet.autonomys.xyz/v1/xdm/transfers',
  chronos: 'https://indexer-api.chronos.autonomys.xyz/v1/xdm/transfers',
} as const;

export type NetworkType = keyof typeof INDEXER_ENDPOINTS;

export async function fetchTransfers(
  network: NetworkType,
  address: string
): Promise<XdmTransfer[]> {
  const baseUrl = INDEXER_ENDPOINTS[network];
  const url = `${baseUrl}/${encodeURIComponent(address.trim())}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to fetch transfers: ${response.status} ${response.statusText}`);
  }

  const data: XdmTransfer[] = await response.json();
  return data;
}

export function getTransferStatus(transfer: XdmTransfer): {
  label: string;
  variant: string;
  description: string;
} {
  if (!transfer.initiated_src_block) {
    return {
      label: 'Unknown',
      variant: 'secondary',
      description: 'Transfer status is unknown.',
    };
  }

  if (!transfer.executed_dst_block) {
    const isFromConsensus = transfer.src_chain === 'Consensus';
    const confirmTime = isFromConsensus ? '~10 minutes' : '~1 day';
    return {
      label: 'Pending',
      variant: 'warning',
      description: `Waiting for confirmation on destination chain. Expected time: ${confirmTime}.`,
    };
  }

  if (!transfer.acknowledged_src_block) {
    return {
      label: 'Executed',
      variant: 'info',
      description: 'Transfer executed on destination. Awaiting acknowledgment on source chain.',
    };
  }

  if (transfer.transfer_successful) {
    return {
      label: 'Completed',
      variant: 'success',
      description: 'Transfer completed successfully.',
    };
  }

  return {
    label: 'Failed',
    variant: 'danger',
    description: 'Transfer failed. A refund will be processed on the source chain (28,800 blocks total).',
  };
}

export function formatChainName(chain: string): string {
  if (chain === 'Consensus') return 'Consensus';
  const match = chain.match(/Domain\((\d+)\)/);
  if (match) {
    const domainId = parseInt(match[1], 10);
    if (domainId === 0) return 'Auto EVM';
    return `Domain ${domainId}`;
  }
  return chain;
}

export function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

export function truncateHash(hash: string, chars: number = 8): string {
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export function truncateAddress(address: string, chars: number = 8): string {
  if (address.length <= chars * 2) return address;
  if (address.startsWith('0x')) {
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
