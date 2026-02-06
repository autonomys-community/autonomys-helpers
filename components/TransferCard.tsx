import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import {
  XdmTransfer,
  getTransferStatus,
  formatChainName,
  formatAmount,
  truncateHash,
  truncateAddress,
} from '../utils/fetchTransfers';

interface TransferCardProps {
  transfer: XdmTransfer;
  searchAddress: string;
}

const TransferCard: React.FC<TransferCardProps> = ({ transfer, searchAddress }) => {
  const status = getTransferStatus(transfer);
  const isSender =
    transfer.sender.toLowerCase() === searchAddress.toLowerCase();

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <Badge bg={isSender ? 'primary' : 'secondary'} className="me-2">
              {isSender ? 'Sent' : 'Received'}
            </Badge>
            <Badge bg={status.variant}>{status.label}</Badge>
          </div>
          <span className="text-muted small">
            Nonce: {transfer.nonce} &middot; Channel: {transfer.channel_id}
          </span>
        </div>

        <div className="row mb-2">
          <div className="col-md-6">
            <div className="small text-muted">From</div>
            <div className="fw-bold">{formatChainName(transfer.src_chain)}</div>
            <div className="text-break small" title={transfer.sender}>
              {truncateAddress(transfer.sender)}
            </div>
          </div>
          <div className="col-md-6">
            <div className="small text-muted">To</div>
            <div className="fw-bold">{formatChainName(transfer.dst_chain)}</div>
            <div className="text-break small" title={transfer.receiver}>
              {truncateAddress(transfer.receiver)}
            </div>
          </div>
        </div>

        <div className="mb-2">
          <span className="fs-5 fw-bold">{formatAmount(transfer.amount)} AI3</span>
        </div>

        <div className="small text-muted mb-1">{status.description}</div>

        <details className="mt-2">
          <summary className="small text-muted" style={{ cursor: 'pointer' }}>
            Block Details
          </summary>
          <div className="mt-2 small">
            {transfer.initiated_src_block && (
              <div className="mb-1">
                <strong>Initiated:</strong> Block #{transfer.initiated_src_block.block_number.toLocaleString()}
                <br />
                <span className="text-muted" title={transfer.initiated_src_block.block_hash}>
                  {truncateHash(transfer.initiated_src_block.block_hash)}
                </span>
              </div>
            )}
            {transfer.executed_dst_block && (
              <div className="mb-1">
                <strong>Executed:</strong> Block #{transfer.executed_dst_block.block_number.toLocaleString()}
                <br />
                <span className="text-muted" title={transfer.executed_dst_block.block_hash}>
                  {truncateHash(transfer.executed_dst_block.block_hash)}
                </span>
              </div>
            )}
            {transfer.acknowledged_src_block && (
              <div className="mb-1">
                <strong>Acknowledged:</strong> Block #{transfer.acknowledged_src_block.block_number.toLocaleString()}
                <br />
                <span className="text-muted" title={transfer.acknowledged_src_block.block_hash}>
                  {truncateHash(transfer.acknowledged_src_block.block_hash)}
                </span>
              </div>
            )}
          </div>
        </details>
      </Card.Body>
    </Card>
  );
};

export default TransferCard;
