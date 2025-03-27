import React from 'react';
import Card from 'react-bootstrap/Card';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { ChannelEntry } from '../pages/channels';

interface ChannelCardProps {
  channel?: ChannelEntry | null;
}

function parseNumber(input: string | number | null | undefined): number {
  if (typeof input === 'number') return input;
  if (typeof input === 'string') {
    const sanitized = input.replace(/,/g, '');
    const parsed = parseInt(sanitized, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel }) => {
  if (!channel) return null;

  const channelId = parseNumber(channel.channelId);
  const inboxNonce = parseNumber(channel.nextInboxNonce) - 1;
  const outboxNonce = parseNumber(channel.nextOutboxNonce) - 1;
  const lastResponse = parseNumber(channel.latestResponseReceivedMessageNonce);
  const pending = Math.max(outboxNonce - lastResponse, 0);
  const capacity = parseNumber(channel.maxOutgoingMessages);
  const usagePercent = capacity > 0 ? (pending / capacity) * 100 : 0;

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>Channel #{channelId}</Card.Title>
        <ul className="list-unstyled mb-3">
          <li><strong>Status:</strong> {channel.state}</li>
          <li><strong>Inbound Messages:</strong> {inboxNonce.toLocaleString()}</li>
          <li><strong>Outbound Messages:</strong> {outboxNonce.toLocaleString()}</li>
          <li><strong>Pending Messages:</strong> {pending.toLocaleString()}</li>
          <li><strong>Capacity:</strong> {capacity.toLocaleString()}</li>
        </ul>
        <ProgressBar now={usagePercent} label={`${usagePercent.toFixed(0)}%`} />
      </Card.Body>
    </Card>
  );
};

export default ChannelCard;
