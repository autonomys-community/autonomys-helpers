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
import { formatTimeAgo } from '../utils/fetchTimestamps';
import CopyableText from './CopyableText';

interface TransferCardProps {
  transfer: XdmTransfer;
  searchAddress: string;
  progress?: TransferProgress;
  initiatedAt?: Date;
}

function StatusIcon({ statusLabel }: { statusLabel: string }) {
  const size = 24;
  const props = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (statusLabel) {
    case 'Pending':
      // Hourglass / clock
      return (
        <svg {...props} stroke="#f0ad4e">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'Executed':
      // Arrow right circle (in transit)
      return (
        <svg {...props} stroke="#0dcaf0">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 16 16 12 12 8" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'Completed':
      // Check circle
      return (
        <svg {...props} stroke="#198754">
          <circle cx="12" cy="12" r="10" />
          <polyline points="9 12 11.5 14.5 16 9.5" />
        </svg>
      );
    case 'Failed':
      // X circle
      return (
        <svg {...props} stroke="#dc3545">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    default:
      // Question mark circle
      return (
        <svg {...props} stroke="#6c757d">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
  }
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

const TransferCard: React.FC<TransferCardProps> = ({ transfer, searchAddress, progress, initiatedAt }) => {
  const status = getTransferStatus(transfer);
  const isSender =
    transfer.sender.toLowerCase() === searchAddress.toLowerCase();

  // Tokens are available once the transfer has been executed on the destination
  const tokensAvailable = !!transfer.executed_dst_block;

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center">
            <span className="me-2" title={status.label}>
              <StatusIcon statusLabel={status.label} />
            </span>
            <Badge bg={isSender ? 'primary' : 'secondary'} className="me-2">
              {isSender ? 'Sent' : 'Received'}
            </Badge>
            <Badge bg={status.variant}>{status.label}</Badge>
          </div>
          <span className="text-muted small text-end">
            {initiatedAt && (
              <span title={initiatedAt.toLocaleString()}>
                {formatTimeAgo(initiatedAt)} &middot;{' '}
              </span>
            )}
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
