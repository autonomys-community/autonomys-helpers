import { ApiPromise, WsProvider } from '@polkadot/api';
import { ChannelEntry } from '../pages/channels';

export async function fetchChannels(
  endpoint: string,
  destinationChainId: { Domain: number } | { Consensus: number }
): Promise<ChannelEntry[]> {
  try {
    console.log("Connecting to:", endpoint);
    const provider = new WsProvider(endpoint);
    const api = await ApiPromise.create({ provider });
    await api.isReady;
    console.log("Connected to Subspace RPC.");

    const entries = await api.query.messenger.channels.entries(destinationChainId);
    console.log(`Raw entries fetched (${entries.length}):`, entries);

    // Debug decoded entries
    entries.forEach(([key, value], index) => {
      console.log(`Decoded channel ${index}:`, value.toHuman());
    });

    const channels: ChannelEntry[] = entries
      .map(([_, value]) => value.toHuman())
      .filter((entry): entry is ChannelEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        'channelId' in entry // loosened filter for debugging
      );

    console.log(`Valid channels decoded: ${channels.length}`);
    await api.disconnect();
    console.log("Disconnected from RPC.");

    return channels;
  } catch (error) {
    console.error("Error during fetchChannels:", error);
    return [];
  }
}
