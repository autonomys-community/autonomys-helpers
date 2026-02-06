import { ApiPromise, WsProvider } from '@polkadot/api';
import { XdmTransfer } from './fetchTransfers';
import { NETWORKS, NetworkType } from '../config/networks';

// ---------------------------------------------------------------------------
// Two-layer cache: in-memory Map (fast) backed by localStorage (persistent)
// Block timestamps are immutable so they can be cached indefinitely.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'xdm-block-timestamps';

/** In-memory cache: blockHash → epoch ms */
const memoryCache = new Map<string, number>();

/** Hydrate in-memory cache from localStorage on first import. */
function hydrateFromStorage(): void {
  if (memoryCache.size > 0) return; // already hydrated
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const entries: [string, number][] = JSON.parse(raw);
    for (const [hash, epoch] of entries) {
      memoryCache.set(hash, epoch);
    }
  } catch {
    // Corrupted data — start fresh
  }
}

/** Persist the in-memory cache to localStorage. */
function flushToStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const entries = Array.from(memoryCache.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or unavailable — silent fail
  }
}

/**
 * Fetches the on-chain timestamp for each transfer's initiation block.
 * Results are cached by block hash so repeated calls (e.g. auto-refresh)
 * never re-query the same block.
 * Returns a Map keyed by "channelId-nonce-srcChain" → Date.
 */
export async function fetchTransferTimestamps(
  network: NetworkType,
  transfers: XdmTransfer[]
): Promise<Map<string, Date>> {
  hydrateFromStorage();

  const timestamps = new Map<string, Date>();

  // Group transfers by source chain so we connect to the right RPC
  const consensusSrc: XdmTransfer[] = [];
  const domainSrc: XdmTransfer[] = [];

  for (const t of transfers) {
    if (!t.initiated_src_block) continue;

    // Check cache first
    const cached = memoryCache.get(t.initiated_src_block.block_hash);
    if (cached !== undefined) {
      timestamps.set(transferTimestampKey(t), new Date(cached));
      continue;
    }

    if (t.src_chain === 'Consensus') {
      consensusSrc.push(t);
    } else {
      domainSrc.push(t);
    }
  }

  // If everything was cached, return immediately — no RPC needed
  if (consensusSrc.length === 0 && domainSrc.length === 0) {
    return timestamps;
  }

  let cacheUpdated = false;

  const fetchBatch = async (
    rpcUrl: string,
    batch: XdmTransfer[]
  ) => {
    if (batch.length === 0) return;

    const provider = new WsProvider(rpcUrl);
    const api = await ApiPromise.create({ provider, noInitWarn: true });

    try {
      // Deduplicate block hashes to minimise RPC calls
      const hashToKey = new Map<string, string[]>();
      for (const t of batch) {
        const hash = t.initiated_src_block!.block_hash;
        const key = transferTimestampKey(t);
        const keys = hashToKey.get(hash) ?? [];
        keys.push(key);
        hashToKey.set(hash, keys);
      }

      const entries = Array.from(hashToKey.entries());
      const results = await Promise.all(
        entries.map(async ([blockHash, keys]) => {
          try {
            const apiAt = await api.at(blockHash);
            const ts = await apiAt.query.timestamp.now();
            const epoch = Number(ts.toString());
            // Write to cache
            memoryCache.set(blockHash, epoch);
            cacheUpdated = true;
            return { keys, date: new Date(epoch) };
          } catch {
            return null;
          }
        })
      );

      for (const result of results) {
        if (result) {
          for (const key of result.keys) {
            timestamps.set(key, result.date);
          }
        }
      }
    } finally {
      await api.disconnect();
    }
  };

  const config = NETWORKS[network];

  await Promise.all([
    fetchBatch(config.rpc.consensus, consensusSrc),
    fetchBatch(config.rpc.autoEvm, domainSrc),
  ]);

  // Persist to localStorage only if we added new entries
  if (cacheUpdated) {
    flushToStorage();
  }

  return timestamps;
}

/** Stable key for matching a timestamp to a transfer. */
export function transferTimestampKey(transfer: XdmTransfer): string {
  return `${transfer.channel_id}-${transfer.nonce}-${transfer.src_chain}`;
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
