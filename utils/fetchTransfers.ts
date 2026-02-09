export interface BlockInfo {
  block_number: number;
  block_hash: string;
  block_time?: string; // ISO 8601 timestamp, e.g. "2026-02-06T16:18:09.675Z"
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

import { NETWORKS, NetworkType } from '../config/networks';

export async function fetchTransfers(
  network: NetworkType,
  address: string
): Promise<XdmTransfer[]> {
  const baseUrl = `${NETWORKS[network].indexer}/transfers`;
  const trimmed = address.trim();
  // EVM addresses (0x) are case-insensitive; the indexer stores them lowercase
  const normalised = trimmed.startsWith('0x') ? trimmed.toLowerCase() : trimmed;
  const url = `${baseUrl}/${encodeURIComponent(normalised)}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to fetch transfers: ${response.status} ${response.statusText}`);
  }

  const data: XdmTransfer[] = await response.json();
  // Sort by initiation timestamp descending (newest first).
  // Falls back to nonce order when timestamps are unavailable.
  data.sort((a, b) => {
    const tsA = a.initiated_src_block?.block_time;
    const tsB = b.initiated_src_block?.block_time;
    if (tsA && tsB) return new Date(tsB).getTime() - new Date(tsA).getTime();
    if (tsA && !tsB) return -1;
    if (!tsA && tsB) return 1;
    return parseInt(b.nonce, 10) - parseInt(a.nonce, 10);
  });
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

/** Format a Date as a human-readable relative time string. */
export function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
