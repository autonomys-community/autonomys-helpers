import React from 'react';
import { ProgressBar } from 'react-bootstrap';

interface ChannelEntry {
  channelId: string;
  state: string;
  nextInboxNonce: string;
  nextOutboxNonce: string;
  latestResponseReceivedMessageNonce: string;
  maxOutgoingMessages: string;
  [key: string]: any;
}

interface ChannelCardProps {
  channel: ChannelEntry;
  parseNumber: (val: string | undefined) => number;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel, parseNumber }) => {
  const {
    channelId,
    state,
    nextInboxNonce,
    nextOutboxNonce,
    latestResponseReceivedMessageNonce,
    maxOutgoingMessages
  } = channel;

  const inbox = parseNumber(nextInboxNonce);
  const outbox = parseNumber(nextOutboxNonce);
  const latestResponse = parseNumber(latestResponseReceivedMessageNonce);
  const capacity = parseNumber(maxOutgoingMessages);

  const pending = Math.max(0, outbox - 1 - latestResponse);
  const inbound = Math.max(0, inbox - 1);
  const outbound = Math.max(0, outbox - 1);

  const percentUtilised = capacity > 0 ? Math.min((pending / capacity) * 100, 100) : 0;

  return (
    <div className="border rounded p-3 mb-4 shadow-sm bg-light">
      <h5>Channel #{channelId}</h5>
      <p className="mb-1"><strong>Status:</strong> {state}</p>
      <p className="mb-1"><strong>Capacity:</strong> {capacity.toLocaleString()}</p>
      <p className="mb-1"><strong>Inbound Messages:</strong> {inbound.toLocaleString()}</p>
      <p className="mb-1"><strong>Outbound Messages:</strong> {outbound.toLocaleString()}</p>
      <p className="mb-2"><strong>Pending Messages:</strong> {pending.toLocaleString()}</p>

      <ProgressBar
        now={percentUtilised}
        label={`${percentUtilised.toFixed(1)}%`}
        variant="primary"
      />
    </div>
  );
};

export default ChannelCard;
