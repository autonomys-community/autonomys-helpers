import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import TransferList from '../../components/TransferList';
import NetworkSelector from '../../components/NetworkSelector';
import { fetchTransfers, XdmTransfer } from '../../utils/fetchTransfers';
import { fetchTransferProgress, TransferProgress } from '../../utils/fetchTransferProgress';
import { NETWORKS, NetworkType } from '../../config/networks';

export default function TransfersPage() {
  const router = useRouter();
  const initialSearchDone = useRef(false);
  const isAutoRefreshing = useRef(false);

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('mainnet');
  const [address, setAddress] = useState('');
  const [submittedAddress, setSubmittedAddress] = useState('');
  const [transfers, setTransfers] = useState<XdmTransfer[]>([]);
  const [progress, setProgress] = useState<Map<string, TransferProgress>>(new Map());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const loadProgress = useCallback(
    async (network: NetworkType, data: XdmTransfer[]) => {
      const hasInFlight = data.some(
        (t) => t.initiated_src_block && (!t.executed_dst_block || !t.acknowledged_src_block)
      );
      if (!hasInFlight) {
        setProgress(new Map());
        return;
      }
      setProgressLoading(true);
      try {
        const progressData = await fetchTransferProgress(network, data);
        setProgress(progressData);
      } catch (err) {
        console.error('Error fetching transfer progress:', err);
        // Non-critical: transfers still display, just without progress
      } finally {
        setProgressLoading(false);
      }
    },
    []
  );

  const searchFor = useCallback(
    (newAddress: string) => {
      setAddress(newAddress);
      setLoading(true);
      setError(null);
      setHasSearched(true);
      setSubmittedAddress(newAddress);
      setProgress(new Map());

      fetchTransfers(selectedNetwork, newAddress)
        .then((data) => {
          setTransfers(data);
          setLoading(false);
          loadProgress(selectedNetwork, data);
        })
        .catch((err) => {
          console.error('Error fetching transfers:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred while fetching transfers.'
          );
          setTransfers([]);
          setLoading(false);
        });
    },
    [selectedNetwork, loadProgress]
  );

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      const trimmed = address.trim();
      if (!trimmed) return;

      setLoading(true);
      setError(null);
      setHasSearched(true);
      setSubmittedAddress(trimmed);
      setProgress(new Map());

      try {
        const data = await fetchTransfers(selectedNetwork, trimmed);
        setTransfers(data);
        setLoading(false);
        // Fetch progress in the background after transfers are displayed
        loadProgress(selectedNetwork, data);
      } catch (err) {
        console.error('Error fetching transfers:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while fetching transfers.'
        );
        setTransfers([]);
        setLoading(false);
      }
    },
    [address, selectedNetwork, loadProgress]
  );

  const handleNetworkChange = useCallback(
    (network: NetworkType) => {
      setSelectedNetwork(network);
      // Re-fetch if user has already searched
      if (submittedAddress) {
        setLoading(true);
        setError(null);
        setProgress(new Map());
        fetchTransfers(network, submittedAddress)
          .then((data) => {
            setTransfers(data);
            setLoading(false);
            loadProgress(network, data);
          })
          .catch((err) => {
            console.error('Error fetching transfers:', err);
            setError(
              err instanceof Error
                ? err.message
                : 'An unexpected error occurred while fetching transfers.'
            );
            setTransfers([]);
            setLoading(false);
          });
      }
    },
    [submittedAddress, loadProgress]
  );

  // Auto-refresh every 30s when there are in-flight transfers
  const autoRefreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const hasInFlight = transfers.some(
      (t) => t.initiated_src_block && (!t.executed_dst_block || !t.acknowledged_src_block)
    );

    // Clear any existing interval
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }

    if (hasInFlight && submittedAddress) {
      autoRefreshInterval.current = setInterval(async () => {
        isAutoRefreshing.current = true;
        setRefreshing(true);
        try {
          const data = await fetchTransfers(selectedNetwork, submittedAddress);
          setTransfers(data);
          await loadProgress(selectedNetwork, data);
        } catch (err) {
          console.error('Auto-refresh failed:', err);
        } finally {
          isAutoRefreshing.current = false;
          setRefreshing(false);
        }
      }, 30_000);
    }

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [transfers, submittedAddress, selectedNetwork, loadProgress]);

  // Read query parameters on mount and auto-search if ?search= is provided
  useEffect(() => {
    if (!router.isReady || initialSearchDone.current) return;
    initialSearchDone.current = true;

    const searchParam = router.query.search as string | undefined;
    const networkParam = router.query.network as string | undefined;

    if (networkParam && networkParam in NETWORKS) {
      setSelectedNetwork(networkParam as NetworkType);
    }

    if (searchParam) {
      const trimmed = searchParam.trim();
      setAddress(trimmed);
      setSubmittedAddress(trimmed);
      setHasSearched(true);
      setLoading(true);
      setError(null);

      const network = (networkParam && networkParam in NETWORKS)
        ? networkParam as NetworkType
        : 'mainnet';

      fetchTransfers(network, trimmed)
        .then((data) => {
          setTransfers(data);
          setLoading(false);
          loadProgress(network, data);
        })
        .catch((err) => {
          console.error('Error fetching transfers:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred while fetching transfers.'
          );
          setTransfers([]);
          setLoading(false);
        });
    }
  }, [router.isReady, router.query, loadProgress]);

  return (
    <div className="container py-3 py-md-5">
      <h1 className="fs-3 fs-md-1">XDM Transfer Status</h1>
      <p className="text-muted mb-4">
        Look up cross-domain message transfers by sender or receiver address.
        Enter a Substrate (SS58) or EVM (0x) address to view transfer history.
      </p>

      <NetworkSelector
        selectedNetwork={selectedNetwork}
        onChange={handleNetworkChange}
      />

      <Form onSubmit={handleSearch} className="mb-4">
        <Form.Group>
          <Form.Label className="fw-bold">Wallet Address:</Form.Label>
          <div className="d-flex flex-column flex-sm-row gap-2">
            <Form.Control
              type="text"
              placeholder="Enter address (e.g. sub... or 0x...)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !address.trim()}
              className="flex-shrink-0"
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-1"
                  />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </Form.Group>
      </Form>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" variant="primary" />
          <div className="mt-2 text-muted">Fetching transfers...</div>
        </div>
      )}

      {!loading && hasSearched && (
        <>
          {progressLoading && !isAutoRefreshing.current && (
            <div className="mb-3 text-muted small">
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-1"
              />
              Loading progress data from chain...
            </div>
          )}
          {transfers.some(
            (t) => t.initiated_src_block && (!t.executed_dst_block || !t.acknowledged_src_block)
          ) && (
            <div className="mb-2 text-muted small d-flex align-items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Auto-refreshing every 30 seconds
              {refreshing && (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="ms-1"
                />
              )}
            </div>
          )}
          <TransferList
            transfers={transfers}
            searchAddress={submittedAddress}
            progress={progress}
            network={selectedNetwork}
            onSearchAddress={searchFor}
          />
        </>
      )}

      {!hasSearched && (
        <div className="border rounded p-4 text-center bg-light">
          <h5 className="text-muted">XDM Transfer Lookup</h5>
          <p className="text-muted mb-3">
            Enter your wallet address above and click Search to view your cross-domain transfers.
          </p>
          <div className="small text-muted">
            <strong>Confirmation Times:</strong>
            <br />
            Consensus &rarr; Domain: ~10 minutes (100 domain blocks)
            <br />
            Domain &rarr; Consensus: ~1 day (14,400 domain blocks)
            <br />
            Domain &rarr; Domain: ~1 day (14,400 domain blocks)
          </div>
        </div>
      )}
    </div>
  );
}
