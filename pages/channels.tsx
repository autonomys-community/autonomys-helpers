import { useEffect, useMemo, useState } from 'react';
import { fetchChannels } from '../utils/fetchChannels';
import ChannelList from '../components/ChannelList';

export interface ChannelEntry {
  channelId: string;
  state: string;
  nextInboxNonce: string;
  nextOutboxNonce: string;
  latestResponseReceivedMessageNonce: string;
  maxOutgoingMessages: string;
  [key: string]: any;
}

const CONSENSUS_ENDPOINT = "wss://rpc-0.taurus.subspace.network/ws";
const AUTO_EVM_ENDPOINT = "wss://auto-evm.taurus.autonomys.xyz/ws";

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState<'consensus' | 'autoEvm'>('consensus');

  const endpoint = useMemo(() => {
    return network === 'consensus'
      ? CONSENSUS_ENDPOINT
      : AUTO_EVM_ENDPOINT;
  }, [network]);

  const destinationChainId = useMemo(() => {
    return network === 'consensus'
      ? { Domain: 0 }
      : { Consensus: 0 };
  }, [network]);

  useEffect(() => {
    setLoading(true);
    fetchChannels(endpoint, destinationChainId)
      .then((data) => {
        const validChannels = data.filter(
          (entry): entry is ChannelEntry =>
            typeof entry === 'object' && entry !== null && 'channelId' in entry
        );

        setChannels(validChannels);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Fetching channels failed:', error);
        setLoading(false);
      });
  }, [endpoint, destinationChainId]);

  return (
    <div className="container py-5">
      <h1>XDM Channels Status</h1>

      <div className="mb-4">
        <label className="form-label me-3 fw-bold">Select Network:</label>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="networkToggle"
            id="consensusRadio"
            checked={network === 'consensus'}
            onChange={() => setNetwork('consensus')}
          />
          <label className="form-check-label" htmlFor="consensusRadio">Consensus Chain</label>
        </div>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="networkToggle"
            id="autoEvmRadio"
            checked={network === 'autoEvm'}
            onChange={() => setNetwork('autoEvm')}
          />
          <label className="form-check-label" htmlFor="autoEvmRadio">Auto EVM</label>
        </div>
      </div>

      {loading ? (
        <div>Loading channel data...</div>
      ) : channels.length === 0 ? (
        <div>No channel data available.</div>
      ) : (
        <ChannelList channels={channels} />
      )}
    </div>
  );
}
