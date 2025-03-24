import { Card, ProgressBar } from 'react-bootstrap';
import { ChannelEntry } from '../pages/channels';

function parseNumber(value: string): number {
  return Number(value.replace(/,/g, '').trim());
}

export default function ChannelCard(props: ChannelEntry) {
  const nextInboxNonce = parseNumber(props.nextInboxNonce);
  const nextOutboxNonce = parseNumber(props.nextOutboxNonce);
  const latestResponseNonce = parseNumber(props.latestResponseReceivedMessageNonce);
  const capacity = parseNumber(props.maxOutgoingMessages);

  const inboundMessages = Math.max(0, nextInboxNonce - 1);
  const outboundMessages = Math.max(0, nextOutboxNonce - 1);
  const totalMessagesProcessed = inboundMessages + outboundMessages;

  const pendingMessages = Math.max(0, outboundMessages - latestResponseNonce);
  const utilization = capacity > 0
    ? Math.min((pendingMessages / capacity) * 100, 100)
    : 0;

  return (
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>Channel #{props.channelId}</Card.Title>
        <Card.Text>Status: {props.state}</Card.Text>
        <Card.Text>Capacity: {capacity.toLocaleString()}</Card.Text>
        <Card.Text>Inbound Messages: {inboundMessages.toLocaleString()}</Card.Text>
        <Card.Text>Outbound Messages: {outboundMessages.toLocaleString()}</Card.Text>
        <Card.Text>Total Messages Processed: {totalMessagesProcessed.toLocaleString()}</Card.Text>
        <Card.Text>Pending Messages: {pendingMessages.toLocaleString()}</Card.Text>
        <div>
          <ProgressBar now={utilization} label={`${utilization.toFixed(1)}%`} />
        </div>
      </Card.Body>
    </Card>
  );
}
