import React, { useEffect, useState, useMemo } from 'react';
import { ButtonGroup, ToggleButton } from 'react-bootstrap';
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

  const { endpoint, destinationChainId } = useMemo(() => {
    return {
      endpoint: network === 'consensus' ? CONSENSUS_ENDPOINT : AUTO_EVM_ENDPOINT,
      destinationChainId: network === 'consensus' ? { Domain: 0 } : { Consensus: 0 }
    };
  }, [network]);

  useEffect(() => {
    setLoading(true);
    fetchChannels(endpoint, destinationChainId)
      .then((data) => {
        const validChannels = (data as any[])
          .filter((entry): entry is ChannelEntry =>
            typeof entry === 'object' && entry !== null && 'channelId' in entry
          );

        console.log("Valid channels passed to state:", validChannels);
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
        <ButtonGroup>
          <ToggleButton
            id="toggle-consensus"
            type="radio"
            variant={network === 'consensus' ? 'primary' : 'outline-primary'}
            name="networkToggle"
            value="consensus"
            checked={network === 'consensus'}
            onChange={() => setNetwork('consensus')}
          >
            Consensus Chain
          </ToggleButton>
          <ToggleButton
            id="toggle-autoevm"
            type="radio"
            variant={network === 'autoEvm' ? 'primary' : 'outline-primary'}
            name="networkToggle"
            value="autoEvm"
            checked={network === 'autoEvm'}
            onChange={() => setNetwork('autoEvm')}
          >
            Auto EVM
          </ToggleButton>
        </ButtonGroup>
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