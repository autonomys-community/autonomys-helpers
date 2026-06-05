import { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

interface EvmWalletState {
  isConnected: boolean;
  isLoading: boolean;
  address: string | null;
  chainId: number | null;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  error: string | null;
  isMetaMaskInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number, chainName: string, rpcUrl: string) => Promise<void>;
  clearError: () => void;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

/**
 * React hook for EVM wallet connection via window.ethereum (MetaMask).
 * Uses ethers.js BrowserProvider for a lightweight, standards-based approach.
 */
export function useEvmWallet(): EvmWalletState {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Resolved after mount so server-rendered HTML doesn't disagree with client.
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setIsMetaMaskInstalled(true);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    setChainId(null);
    setSigner(null);
    setProvider(null);
    setError(null);
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      await browserProvider.send('eth_requestAccounts', []);
      const jsonRpcSigner = await browserProvider.getSigner();
      const addr = await jsonRpcSigner.getAddress();
      const network = await browserProvider.getNetwork();

      if (mountedRef.current) {
        setProvider(browserProvider);
        setSigner(jsonRpcSigner);
        setAddress(addr);
        setChainId(Number(network.chainId));
        setIsConnected(true);
      }
    } catch (err) {
      if (mountedRef.current) {
        const msg = err instanceof Error ? err.message : 'Failed to connect wallet';
        if (msg.includes('user rejected')) {
          setError('Connection rejected. Please try again.');
        } else {
          setError(msg);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const switchChain = useCallback(async (targetChainId: number, chainName: string, rpcUrl: string) => {
    if (!window.ethereum) return;

    const hexChainId = '0x' + targetChainId.toString(16);
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: unknown) {
      // Chain not added yet — add it
      if (switchError && typeof switchError === 'object' && 'code' in switchError && (switchError as { code: number }).code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hexChainId,
              chainName,
              nativeCurrency: { name: 'AI3', symbol: 'AI3', decimals: 18 },
              rpcUrls: [rpcUrl],
            }],
          });
        } catch (addError) {
          setError(addError instanceof Error ? addError.message : 'Failed to add network');
        }
      } else {
        setError(switchError instanceof Error ? switchError.message : 'Failed to switch network');
      }
    }
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum || !isConnected) return;

    const handleAccountsChanged = async (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      } else if (mountedRef.current) {
        setAddress(accounts[0]);
        // Refresh signer with new account
        if (provider) {
          try {
            const newSigner = await provider.getSigner();
            setSigner(newSigner);
          } catch {
            // Signer refresh failed, reconnect
            disconnect();
          }
        }
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const newChainId = args[0] as string;
      if (mountedRef.current) {
        setChainId(parseInt(newChainId, 16));
        // Refresh provider and signer on chain change
        const newProvider = new BrowserProvider(window.ethereum!);
        setProvider(newProvider);
        newProvider.getSigner().then(s => {
          if (mountedRef.current) setSigner(s);
        }).catch(() => {
          if (mountedRef.current) disconnect();
        });
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [isConnected, provider, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  return {
    isConnected,
    isLoading,
    address,
    chainId,
    signer,
    provider,
    error,
    isMetaMaskInstalled,
    connect,
    disconnect,
    switchChain,
    clearError,
  };
}
