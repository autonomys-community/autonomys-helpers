import React from 'react';
import { Card, ProgressBar } from 'react-bootstrap';

interface ChainSummaryCardProps {
  totalChannels: number;
  totalCapacity: number;
  totalInbound: number;
  totalOutbound: number;
  totalPending: number;
}

const ChainSummaryCard: React.FC<ChainSummaryCardProps> = ({
  totalChannels,
  totalCapacity,
  totalInbound,
  totalOutbound,
  totalPending
}) => {
  const utilizationPercent = totalCapacity > 0
    ? Math.min((totalPending / totalCapacity) * 100, 100)
    : 0;

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>Chain Summary</Card.Title>
        <div><strong>Total Channels:</strong> {totalChannels.toLocaleString()}</div>
        <div><strong>Total Capacity:</strong> {totalCapacity.toLocaleString()}</div>
        <div><strong>Total Inbound Messages:</strong> {totalInbound.toLocaleString()}</div>
        <div><strong>Total Outbound Messages:</strong> {totalOutbound.toLocaleString()}</div>
        <div><strong>Total Pending Messages:</strong> {totalPending.toLocaleString()}</div>
        <div className="mt-3">
          <strong>Network Utilization:</strong>
          <ProgressBar
            now={utilizationPercent}
            label={`${utilizationPercent.toFixed(1)}%`}
            variant={utilizationPercent > 90 ? 'danger' : utilizationPercent > 80 ? 'warning' : 'primary'}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

export default ChainSummaryCard;
