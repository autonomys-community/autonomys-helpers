import React from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';

interface EvmWalletConnectProps {
  isConnected: boolean;
  isLoading: boolean;
  address: string | null;
  chainId: number | null;
  expectedChainId: number;
  expectedChainName: string;
  error: string | null;
  isMetaMaskInstalled: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
  onSwitchChain: () => Promise<void>;
  onClearError: () => void;
}

function shortenEvmAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const EvmWalletConnect: React.FC<EvmWalletConnectProps> = ({
  isConnected,
  isLoading,
  address,
  chainId,
  expectedChainId,
  expectedChainName,
  error,
  isMetaMaskInstalled,
  onConnect,
  onDisconnect,
  onSwitchChain,
  onClearError,
}) => {
  const isWrongChain = isConnected && chainId !== null && chainId !== expectedChainId;

  if (isConnected && address) {
    return (
      <div>
        <div className="d-flex align-items-center gap-2">
          <span className={`badge ${isWrongChain ? 'bg-warning text-dark' : 'bg-success'}`}>
            {isWrongChain ? 'Wrong Network' : 'Connected'}
          </span>
          <span className="small" style={{ fontFamily: 'monospace' }}>
            {shortenEvmAddress(address)}
          </span>
          <Button variant="outline-secondary" size="sm" onClick={onDisconnect}>
            Disconnect
          </Button>
        </div>
        <div className="text-muted small mt-1" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {address}
        </div>

        {isWrongChain && (
          <Alert variant="warning" className="mt-2 py-2 small">
            Please switch to <strong>{expectedChainName}</strong> (Chain ID: {expectedChainId}).
            <Button
              variant="warning"
              size="sm"
              className="ms-2"
              onClick={onSwitchChain}
            >
              Switch Network
            </Button>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Alert variant="danger" dismissible onClose={onClearError} className="mb-2 py-2 small">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="d-flex align-items-center gap-2 text-muted">
          <Spinner animation="border" size="sm" />
          <span className="small">Connecting wallet…</span>
        </div>
      ) : isMetaMaskInstalled ? (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={onConnect}
          className="d-flex align-items-center gap-1"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.5 4.5L13.5 1.5L4.5 4.5L1.5 12L4.5 19.5L13.5 22.5L22.5 19.5L25.5 12L22.5 4.5Z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.5"/>
          </svg>
          Connect MetaMask
        </Button>
      ) : (
        <div className="small text-muted">
          MetaMask is not installed.{' '}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Install MetaMask
          </a>
        </div>
      )}
    </div>
  );
};

export default EvmWalletConnect;
