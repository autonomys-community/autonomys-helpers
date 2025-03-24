import { ApiPromise, WsProvider } from '@polkadot/api';

const WS_ENDPOINT = "wss://rpc-0.taurus.subspace.network/ws";

export async function fetchChannels() {
  try {
    console.log("Connecting to:", WS_ENDPOINT);
    const provider = new WsProvider(WS_ENDPOINT);
    const api = await ApiPromise.create({ provider });
    await api.isReady;
    console.log("Connected to Subspace RPC.");

    // Corrected query with explicit parameter { Domain: 0 }
    const entries = await api.query.messenger.channels.entries({ Domain: 0 });
    console.log(`Raw entries fetched (${entries.length}):`, entries);

    const channels = entries.map(([key, value]) => {
      const decoded = value.toHuman();
      console.log("Decoded entry:", decoded);
      return decoded;
    });

    await api.disconnect();
    console.log("Disconnected from RPC.");

    return channels || [];
  } catch (error) {
    console.error("Error during fetchChannels:", error);
    return [];
  }
}
