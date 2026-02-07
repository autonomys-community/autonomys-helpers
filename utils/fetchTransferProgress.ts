import { ApiPromise, WsProvider } from '@polkadot/api';
import { XdmTransfer } from './fetchTransfers';
import {
  NETWORKS,
  NetworkType,
  CONSENSUS_TO_DOMAIN_DEPTH,
  DOMAIN_TO_CONSENSUS_DEPTH,
} from '../config/networks';

export interface ProgressEntry {
  targetBlock: number;
  currentBlock: number;
  remainingBlocks: number;
  totalBlocks: number;
}

export interface TransferProgress {
  /** When tokens become available to the recipient. Null if already available. */
  availability: ProgressEntry | null;
  /** When the full round-trip (acknowledgment) completes. Null if already complete. */
  completion: ProgressEntry | null;
}

/** Build a unique key for a transfer to use in the progress map. */
export function transferKey(transfer: XdmTransfer): string {
  return `${transfer.channel_id}-${transfer.nonce}-${transfer.src_chain}`;
}

/** Extract the domain ID from a chain string like "Domain(0)". Returns null for Consensus. */
function parseDomainId(chain: string): number | null {
  const match = chain.match(/Domain\((\d+)\)/);
  return match ? parseInt(match[1], 10) : null;
}

function makeEntry(targetBlock: number, currentBlock: number, totalBlocks: number): ProgressEntry {
  return {
    targetBlock,
    currentBlock,
    remainingBlocks: Math.max(0, targetBlock - currentBlock),
    totalBlocks,
  };
}

interface HistoricalQuery {
  key: string;
  blockHash: string;
  depth: number;
  target: 'availability' | 'completion';
}

/**
 * Fetch completion progress for in-flight transfers by querying the consensus RPC.
 * Returns a Map keyed by transferKey() with progress info.
 * Only makes RPC calls if there are pending or executed transfers.
 */
export async function fetchTransferProgress(
  network: NetworkType,
  transfers: XdmTransfer[]
): Promise<Map<string, TransferProgress>> {
  const progressMap = new Map<string, TransferProgress>();

  // Find transfers that need progress calculation
  const inFlight = transfers
    .map((t, i) => ({ transfer: t, index: i }))
    .filter(({ transfer }) => {
      if (!transfer.initiated_src_block) return false;
      // Pending: not yet executed
      if (!transfer.executed_dst_block) return true;
      // Executed: not yet acknowledged
      if (!transfer.acknowledged_src_block) return true;
      return false;
    });

  if (inFlight.length === 0) return progressMap;

  // Determine which domain ID we're working with
  let domainId: number | null = null;
  for (const { transfer } of inFlight) {
    domainId = parseDomainId(transfer.src_chain) ?? parseDomainId(transfer.dst_chain);
    if (domainId !== null) break;
  }
  if (domainId === null) return progressMap;

  const consensusRpc = NETWORKS[network].rpc.consensus;

  let api: ApiPromise | null = null;
  try {
    const provider = new WsProvider(consensusRpc);
    api = await ApiPromise.create({ provider });
    await api.isReady;

    // Get the current head receipt number for this domain
    const currentHeadRaw = await api.query.domains.headReceiptNumber(domainId);
    const currentHead = parseInt(currentHeadRaw.toString(), 10);

    // Historical lookups needed (consensus block hash -> headReceiptNumber at that time)
    const historicalQueries: HistoricalQuery[] = [];

    // Initialise progress entries for each in-flight transfer
    for (const { transfer, index } of inFlight) {
      const key = transferKey(transfer);
      const isPending = !transfer.executed_dst_block;
      const isFromConsensus = transfer.src_chain === 'Consensus';

      // Initialise with nulls; we'll fill in below
      const progress: TransferProgress = { availability: null, completion: null };

      if (isPending) {
        // PENDING: tokens not yet available
        if (isFromConsensus) {
          // Consensus -> Domain: need historical headReceiptNumber + 100
          historicalQueries.push({
            key,
            blockHash: transfer.initiated_src_block!.block_hash,
            depth: CONSENSUS_TO_DOMAIN_DEPTH,
            target: 'availability',
          });
        } else {
          // Domain -> Consensus: initiated block + 14,400
          const target = transfer.initiated_src_block!.block_number + DOMAIN_TO_CONSENSUS_DEPTH;
          progress.availability = makeEntry(target, currentHead, DOMAIN_TO_CONSENSUS_DEPTH);
        }
        // Completion unknown at this stage (we don't know the execution block yet)
      } else {
        // EXECUTED: tokens are available, awaiting acknowledgment
        // Availability is already done (tokens available) — no entry needed

        if (isFromConsensus) {
          // Consensus -> Domain. Ack goes Domain -> Consensus: executed_dst_block + 14,400
          const target = transfer.executed_dst_block!.block_number + DOMAIN_TO_CONSENSUS_DEPTH;
          progress.completion = makeEntry(target, currentHead, DOMAIN_TO_CONSENSUS_DEPTH);
        } else {
          // Domain -> Consensus. Ack goes Consensus -> Domain: need historical lookup
          historicalQueries.push({
            key,
            blockHash: transfer.executed_dst_block!.block_hash,
            depth: CONSENSUS_TO_DOMAIN_DEPTH,
            target: 'completion',
          });
        }
      }

      progressMap.set(key, progress);
    }

    // Process historical queries in parallel
    if (historicalQueries.length > 0) {
      const results = await Promise.all(
        historicalQueries.map(async ({ key, blockHash, depth, target }) => {
          try {
            const apiAt = await api!.at(blockHash);
            const headAtBlock = await apiAt.query.domains.headReceiptNumber(domainId!);
            const domainBlockAtTime = parseInt(headAtBlock.toString(), 10);
            const targetBlock = domainBlockAtTime + depth;
            return { key, target, entry: makeEntry(targetBlock, currentHead, depth) };
          } catch (err) {
            console.error(`Failed to query historical state at ${blockHash}:`, err);
            return null;
          }
        })
      );

      for (const result of results) {
        if (result) {
          const existing = progressMap.get(result.key) ?? { availability: null, completion: null };
          existing[result.target] = result.entry;
          progressMap.set(result.key, existing);
        }
      }
    }

    await api.disconnect();
  } catch (error) {
    console.error('Error fetching transfer progress:', error);
    if (api) {
      try { await api.disconnect(); } catch { /* ignore */ }
    }
  }

  return progressMap;
}
