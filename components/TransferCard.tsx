import React from 'react';
import { Card, Badge, ProgressBar } from 'react-bootstrap';
import {
  XdmTransfer,
  getTransferStatus,
  formatChainName,
  formatAmount,
  truncateAddress,
} from '../utils/fetchTransfers';
import { TransferProgress, ProgressEntry } from '../utils/fetchTransferProgress';
import { formatTimeAgo } from '../utils/fetchTimestamps';
import { getAddressExplorerUrl, getBlockExplorerUrl, NetworkType } from '../config/networks';
import CopyableText from './CopyableText';

interface TransferCardProps {
  transfer: XdmTransfer;
  searchAddress: string;
  progress?: TransferProgress;
  initiatedAt?: Date;
  network: string;
  onSearchAddress?: (address: string) => void;
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
      />
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  warning: '#f0ad4e',
  info: '#0dcaf0',
  success: '#198754',
  danger: '#dc3545',
  secondary: '#6c757d',
};

const TransferCard: React.FC<TransferCardProps> = ({ transfer, searchAddress, progress, initiatedAt, network, onSearchAddress }) => {
  const status = getTransferStatus(transfer);
  const isSender =
    transfer.sender.toLowerCase() === searchAddress.toLowerCase();
  const counterpart = isSender ? transfer.receiver : transfer.sender;

  // Tokens are available once the transfer has been executed on the destination
  const tokensAvailable = !!transfer.executed_dst_block;
  const statusColor = STATUS_COLORS[status.variant] || STATUS_COLORS.secondary;

  return (
    <Card
      className="mb-3 shadow-sm"
      style={{ borderLeft: `4px solid ${statusColor}`, borderTop: 0, borderRight: 0, borderBottom: 0 }}
    >
      <Card.Body className="p-3">
        {/* Header: status icon + text, direction badge, timestamp */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-1 mb-2">
          <div className="d-flex align-items-center gap-2">
            <StatusIcon statusLabel={status.label} />
            <span className="fw-semibold small" style={{ color: statusColor }}>
              {status.label}
            </span>
            <Badge
              pill
              bg={isSender ? 'primary' : 'secondary'}
              className="opacity-75"
              style={{ fontSize: '0.7rem' }}
            >
              {isSender ? 'Sent' : 'Received'}
            </Badge>
          </div>
          {initiatedAt && (
            <span className="text-muted small" title={initiatedAt.toLocaleString()}>
              {formatTimeAgo(initiatedAt)}
            </span>
          )}
        </div>

        {/* Amount */}
        <div className="mb-2">
          <span className="fs-4 fw-bold">{formatAmount(transfer.amount)}</span>
          <span className="text-muted ms-1 small">AI3</span>
        </div>

        {/* From → To */}
        <div className="row g-0 mb-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="text-muted mb-1" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              From
            </div>
            <div className="fw-semibold" style={{ fontSize: '1.2rem' }}>{formatChainName(transfer.src_chain)}</div>
            <div className="d-flex align-items-center gap-1">
              <a
                href={getAddressExplorerUrl(network as NetworkType, transfer.sender, transfer.src_chain)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-break small text-decoration-none"
                title={`View ${transfer.sender} on explorer`}
              >
                {truncateAddress(transfer.sender)}
              </a>
              <CopyableText
                text={transfer.sender}
                displayText=""
                className="small"
              />
              {!isSender && onSearchAddress && (
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 border-0"
                  onClick={() => onSearchAddress(counterpart)}
                  title={`Search transfers for ${truncateAddress(counterpart)}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="col-12 col-md-2 d-flex align-items-center justify-content-center py-1 py-md-0">
            {/* Right arrow on md+ screens */}
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted d-none d-md-block">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            {/* Down arrow on small screens */}
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted d-md-none">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </div>
          <div className="col-12 col-md-5">
            <div className="text-muted mb-1" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              To
            </div>
            <div className="fw-semibold" style={{ fontSize: '1.2rem' }}>{formatChainName(transfer.dst_chain)}</div>
            <div className="d-flex align-items-center gap-1">
              <a
                href={getAddressExplorerUrl(network as NetworkType, transfer.receiver, transfer.dst_chain)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-break small text-decoration-none"
                title={`View ${transfer.receiver} on explorer`}
              >
                {truncateAddress(transfer.receiver)}
              </a>
              <CopyableText
                text={transfer.receiver}
                displayText=""
                className="small"
              />
              {isSender && onSearchAddress && (
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 border-0"
                  onClick={() => onSearchAddress(counterpart)}
                  title={`Search transfers for ${truncateAddress(counterpart)}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status description */}
        <div className="small text-muted" title={status.description}>{status.description}</div>

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
            <span className="ms-1">Details</span>
          </summary>
          <div className="mt-2 ms-3 small">
            <div className="border rounded p-2 mb-2" style={{ backgroundColor: '#f8f9fa' }}>
              <div className="mb-1"><strong>Nonce:</strong> {transfer.nonce}</div>
              <div><strong>Channel:</strong> {transfer.channel_id}</div>
            </div>
            <div className="border rounded p-2" style={{ backgroundColor: '#f0f6ff' }}>
              {transfer.initiated_src_block && (
                <div className="mb-1">
                  <strong>Initiated:</strong>{' '}
                  <a
                    href={getBlockExplorerUrl(network as NetworkType, transfer.initiated_src_block.block_number, transfer.src_chain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none"
                  >
                    Block #{transfer.initiated_src_block.block_number.toLocaleString()}
                  </a>
                </div>
              )}
              {transfer.executed_dst_block && (
                <div className="mb-1">
                  <strong>Executed:</strong>{' '}
                  <a
                    href={getBlockExplorerUrl(network as NetworkType, transfer.executed_dst_block.block_number, transfer.dst_chain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none"
                  >
                    Block #{transfer.executed_dst_block.block_number.toLocaleString()}
                  </a>
                </div>
              )}
              {transfer.acknowledged_src_block && (
                <div>
                  <strong>Acknowledged:</strong>{' '}
                  <a
                    href={getBlockExplorerUrl(network as NetworkType, transfer.acknowledged_src_block.block_number, transfer.src_chain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none"
                  >
                    Block #{transfer.acknowledged_src_block.block_number.toLocaleString()}
                  </a>
                </div>
              )}
            </div>
          </div>
        </details>
      </Card.Body>
    </Card>
  );
};

export default TransferCard;
