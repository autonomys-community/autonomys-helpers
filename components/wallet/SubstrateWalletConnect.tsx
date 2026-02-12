import React from 'react';
import { Button, Dropdown, Spinner, Alert } from 'react-bootstrap';
import type { Wallet, WalletAccount } from '@autonomys/auto-wallet';

interface SubstrateWalletConnectProps {
  isConnected: boolean;
  isLoading: boolean;
  connectionError: string | null;
  selectedAccount: WalletAccount | null;
  accounts: WalletAccount[];
  availableWallets: Wallet[];
  onConnect: (extensionName: string) => Promise<void>;
  onDisconnect: () => void;
  onSelectAccount: (address: string) => void;
  onClearError: () => void;
}

function shortenAddress(addr: string, chars = 6): string {
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

const SubstrateWalletConnect: React.FC<SubstrateWalletConnectProps> = ({
  isConnected,
  isLoading,
  connectionError,
  selectedAccount,
  accounts,
  availableWallets,
  onConnect,
  onDisconnect,
  onSelectAccount,
  onClearError,
}) => {
  if (isConnected && selectedAccount) {
    return (
      <div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success">Connected</span>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              {selectedAccount.name || shortenAddress(selectedAccount.address)}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {accounts.map((acc) => (
                <Dropdown.Item
                  key={acc.address}
                  active={acc.address === selectedAccount.address}
                  onClick={() => onSelectAccount(acc.address)}
                >
                  <div className="fw-bold small">{acc.name || 'Account'}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {shortenAddress(acc.address)}
                  </div>
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={onDisconnect} className="text-danger">
                Disconnect
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <div className="text-muted small mt-1" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {selectedAccount.address}
        </div>
      </div>
    );
  }

  const installedWallets = availableWallets.filter((w) => w.installed);
  const notInstalledWallets = availableWallets.filter((w) => !w.installed);

  return (
    <div>
      {connectionError && (
        <Alert variant="danger" dismissible onClose={onClearError} className="mb-2 py-2 small">
          {connectionError}
        </Alert>
      )}

      {isLoading ? (
        <div className="d-flex align-items-center gap-2 text-muted">
          <Spinner animation="border" size="sm" />
          <span className="small">Connecting wallet…</span>
        </div>
      ) : (
        <>
          {installedWallets.length > 0 ? (
            <div className="d-flex flex-wrap gap-2">
              {installedWallets.map((wallet) => (
                <Button
                  key={wallet.extensionName}
                  variant="outline-primary"
                  size="sm"
                  onClick={() => onConnect(wallet.extensionName)}
                  className="d-flex align-items-center gap-1"
                >
                  {wallet.logo && (
                    <img
                      src={wallet.logo.src}
                      alt={wallet.logo.alt}
                      width={18}
                      height={18}
                    />
                  )}
                  {wallet.title}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-muted small">
              No Substrate wallets detected.
            </div>
          )}

          {notInstalledWallets.length > 0 && (
            <div className="mt-2 small text-muted">
              Not installed:{' '}
              {notInstalledWallets.map((wallet, i) => (
                <span key={wallet.extensionName}>
                  {i > 0 && ', '}
                  <a
                    href={wallet.installUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {wallet.title}
                  </a>
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SubstrateWalletConnect;
