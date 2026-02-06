import React from 'react';
import { Card, Badge, ProgressBar } from 'react-bootstrap';
import {
  XdmTransfer,
  getTransferStatus,
  formatChainName,
  formatAmount,
  truncateHash,
  truncateAddress,
} from '../utils/fetchTransfers';
import { TransferProgress, ProgressEntry } from '../utils/fetchTransferProgress';
import CopyableText from './CopyableText';

interface TransferCardProps {
  transfer: XdmTransfer;
  searchAddress: string;
  progress?: TransferProgress;
}

function ProgressSection({
  entry,
  label,
  prominent,
}: {
  entry: ProgressEntry;
  label: string;
  prominent: boolean;
}) {
  const percent = Math.min(
    100,
    ((entry.totalBlocks - entry.remainingBlocks) / entry.totalBlocks) * 100
  );

  if (prominent) {
    return (
      <div className="mt-2 mb-1">
        <div className="d-flex justify-content-between small mb-1">
          <span className="fw-bold">{label}</span>
          <span>
            {entry.remainingBlocks > 0 ? (
              <>{entry.remainingBlocks.toLocaleString()} domain blocks remaining</>
            ) : (
              <span className="text-success fw-bold">Ready</span>
            )}
          </span>
        </div>
        <ProgressBar
          now={percent}
          label={`${percent.toFixed(0)}%`}
          variant={percent >= 100 ? 'success' : 'primary'}
          animated={percent < 100}
        />
        <div className="text-muted small mt-1">
          Block {entry.currentBlock.toLocaleString()} of {entry.targetBlock.toLocaleString()} (target)
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 small text-muted">
      <div className="d-flex justify-content-between mb-1">
        <span>{label}</span>
        <span>
          {entry.remainingBlocks > 0 ? (
            <>{entry.remainingBlocks.toLocaleString()} domain blocks remaining</>
          ) : (
            <>Complete</>
          )}
        </span>
      </div>
      <ProgressBar
        now={percent}
        label={`${percent.toFixed(0)}%`}
        variant={percent >= 100 ? 'success' : 'secondary'}
        style={{ height: '0.5rem' }}
      />
    </div>
  );
}

const TransferCard: React.FC<TransferCardProps> = ({ transfer, searchAddress, progress }) => {
  const status = getTransferStatus(transfer);
  const isSender =
    transfer.sender.toLowerCase() === searchAddress.toLowerCase();

  // Tokens are available once the transfer has been executed on the destination
  const tokensAvailable = !!transfer.executed_dst_block;

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
            <CopyableText
              text={transfer.sender}
              displayText={truncateAddress(transfer.sender)}
              className="text-break small"
            />
          </div>
          <div className="col-md-6">
            <div className="small text-muted">To</div>
            <div className="fw-bold">{formatChainName(transfer.dst_chain)}</div>
            <CopyableText
              text={transfer.receiver}
              displayText={truncateAddress(transfer.receiver)}
              className="text-break small"
            />
          </div>
        </div>

        <div className="mb-2">
          <span className="fs-5 fw-bold">{formatAmount(transfer.amount)} AI3</span>
        </div>

        <div className="small text-muted mb-1">{status.description}</div>

        {/* Token availability progress — shown prominently for pending transfers */}
        {progress?.availability && (
          <ProgressSection
            entry={progress.availability}
            label="Token Availability"
            prominent
          />
        )}

        {/* For executed transfers: show that tokens are available */}
        {tokensAvailable && !transfer.acknowledged_src_block && (
          <div className="mt-2 mb-1 small text-success fw-bold">
            Tokens available to recipient
          </div>
        )}

        {/* Completion/acknowledgment progress — shown as secondary */}
        {progress?.completion && (
          <ProgressSection
            entry={progress.completion}
            label="Transfer Completion"
            prominent={false}
          />
        )}

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
