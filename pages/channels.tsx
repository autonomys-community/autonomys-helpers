import React, { useEffect, useState, useMemo } from 'react';
import { ButtonGroup, ToggleButton } from 'react-bootstrap';
import { fetchChannels } from '../utils/fetchChannels';
import ChannelList from '../components/ChannelList';
import ChainSummaryCard from '../components/ChainSummaryCard';

export interface ChannelEntry {
  channelId: string;
  state: string;
  nextInboxNonce: string;
  nextOutboxNonce: string;
  latestResponseReceivedMessageNonce: string;
  maxOutgoingMessages: string;
  [key: string]: string;
}

const CONSENSUS_ENDPOINT = "wss://rpc.taurus.autonomys.xyz/ws";
const AUTO_EVM_ENDPOINT = "wss://auto-evm.taurus.autonomys.xyz/ws";

function parseNumber(value: string | undefined): number {
  return Math.max(0, parseInt(value?.replace(/,/g, '') || '0', 10));
}

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
        const validChannels = (data as unknown[])
          .filter((entry): entry is ChannelEntry =>
            typeof entry === 'object' &&
            entry !== null &&
            'channelId' in entry
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

  const summary = useMemo(() => {
    let totalCapacity = 0;
    let totalInbound = 0;
    let totalOutbound = 0;
    let totalPending = 0;

    channels.forEach((channel) => {
      const capacity = parseNumber(channel.maxOutgoingMessages);
      const inbox = parseNumber(channel.nextInboxNonce);
      const outbox = parseNumber(channel.nextOutboxNonce);
      const response = parseNumber(channel.latestResponseReceivedMessageNonce);

      if (channel.state === 'Open') {
        totalCapacity += capacity;
      }
      totalInbound += Math.max(0, inbox - 1);
      totalOutbound += Math.max(0, response);
      totalPending += Math.max(0, outbox - 1 - response);
    });

    return {
      totalChannels: channels.filter(channel => channel.state === 'Open').length,
      totalCapacity,
      totalInbound,
      totalOutbound,
      totalPending
    };
  }, [channels]);

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

      {!loading && channels.length > 0 && (
        <ChainSummaryCard {...summary} />
      )}

      {loading ? (
        <div>Loading channel data...</div>
      ) : channels.length === 0 ? (
        <div>No channel data available.</div>
      ) : (
        <ChannelList channels={channels} parseNumber={parseNumber} />
      )}
    </div>
  );
}
