import React, { useState, useCallback, useEffect } from 'react';
import { Form, Button, Spinner, Alert, Card, Modal } from 'react-bootstrap';
import type { TransferDirection } from '../utils/xdmTransfer';
import {
  isValidEvmAddress,
  isValidSubstrateAddress,
  getConsensusBalance,
  getEvmBalance,
} from '../utils/xdmTransfer';
import type { NetworkType } from '../config/networks';
import { CONSENSUS_TO_DOMAIN_DEPTH, DOMAIN_TO_CONSENSUS_DEPTH } from '../config/networks';
import type { BrowserProvider } from 'ethers';

interface SendFormProps {
  direction: TransferDirection;
  network: NetworkType;
  senderAddress: string | null;
  evmProvider: BrowserProvider | null;
  onSubmit: (recipient: string, amount: string) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

const SendForm: React.FC<SendFormProps> = ({
  direction,
  network,
  senderAddress,
  evmProvider,
  onSubmit,
  isSubmitting,
  submitError,
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isConsensusToEvm = direction === 'consensus-to-evm';
  const recipientLabel = isConsensusToEvm ? 'Recipient EVM Address (0x…)' : 'Recipient Substrate Address';
  const recipientPlaceholder = isConsensusToEvm
    ? '0x0000000000000000000000000000000000000000'
    : 'subsp…';
  const confirmationTime = isConsensusToEvm
    ? `~10 minutes (${CONSENSUS_TO_DOMAIN_DEPTH} domain blocks)`
    : `~1 day (${DOMAIN_TO_CONSENSUS_DEPTH.toLocaleString()} domain blocks)`;

  // Reset form fields when direction or network changes
  useEffect(() => {
    setRecipient('');
    setAmount('');
    setValidationError(null);
    setBalance(null);
  }, [direction, network]);

  // Fetch balance when sender address changes
  useEffect(() => {
    if (!senderAddress) {
      setBalance(null);
      return;
    }

    let cancelled = false;
    setBalanceLoading(true);

    const fetchBalance = async () => {
      try {
        let bal: string;
        if (isConsensusToEvm) {
          bal = await getConsensusBalance(network, senderAddress);
        } else if (evmProvider) {
          bal = await getEvmBalance(evmProvider, senderAddress);
        } else {
          setBalance(null);
          return;
        }
        if (!cancelled) setBalance(bal);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
        if (!cancelled) setBalance(null);
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    };

    fetchBalance();
    return () => { cancelled = true; };
  }, [senderAddress, network, isConsensusToEvm, evmProvider]);

  const validateForm = useCallback((): string | null => {
    if (!recipient.trim()) return 'Recipient address is required.';

    if (isConsensusToEvm) {
      if (!isValidEvmAddress(recipient.trim())) {
        return 'Invalid EVM address. Please enter a valid checksummed address (0x…).';
      }
    } else {
      if (!isValidSubstrateAddress(recipient.trim())) {
        return 'Invalid Substrate address.';
      }
    }

    if (!amount.trim()) return 'Amount is required.';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return 'Amount must be greater than 0.';
    if (numAmount < 1) return 'Minimum XDM transfer amount is 1 AI3.';

    if (balance !== null) {
      const balNum = parseFloat(balance);
      if (numAmount > balNum) return 'Insufficient balance.';
    }

    return null;
  }, [recipient, amount, isConsensusToEvm, balance]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    setShowConfirm(true);
  }, [validateForm]);

  const handleConfirm = useCallback(async () => {
    setShowConfirm(false);
    try {
      await onSubmit(recipient.trim(), amount.trim());
    } catch {
      // Error is handled by the parent via submitError prop;
      // catch here to prevent unhandled promise rejection.
    }
  }, [onSubmit, recipient, amount]);

  const handleSetMax = useCallback(() => {
    if (balance !== null) {
      // Leave a small buffer for tx fees
      const maxAmount = Math.max(0, parseFloat(balance) - 0.01);
      setAmount(maxAmount > 0 ? maxAmount.toFixed(4) : '0');
    }
  }, [balance]);

  if (!senderAddress) {
    return (
      <Card className="bg-light">
        <Card.Body className="text-center text-muted py-4">
          Connect your wallet above to send a transfer.
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">From</Form.Label>
              <div className="d-flex align-items-center gap-2">
                <Form.Control
                  type="text"
                  value={senderAddress}
                  disabled
                  className="font-monospace small"
                />
                <div className="text-nowrap small">
                  {balanceLoading ? (
                    <Spinner animation="border" size="sm" />
                  ) : balance !== null ? (
                    <span className="fw-bold">{balance} AI3</span>
                  ) : null}
                </div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">{recipientLabel}</Form.Label>
              <Form.Control
                type="text"
                placeholder={recipientPlaceholder}
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  setValidationError(null);
                }}
                disabled={isSubmitting}
                className="font-monospace"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Amount (AI3)</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setValidationError(null);
                  }}
                  disabled={isSubmitting}
                />
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleSetMax}
                  disabled={!balance || isSubmitting}
                  className="flex-shrink-0"
                >
                  MAX
                </Button>
              </div>
            </Form.Group>

            <div className="mb-3 p-2 bg-light rounded small">
              <strong>Estimated confirmation time:</strong> {confirmationTime}
            </div>

            {validationError && (
              <Alert variant="warning" className="py-2 small">
                {validationError}
              </Alert>
            )}

            {submitError && (
              <Alert variant="danger" className="py-2 small">
                {submitError}
              </Alert>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={isSubmitting || !senderAddress}
            >
              {isSubmitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Sending Transfer…
                </>
              ) : (
                'Send Transfer'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">Confirm Transfer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2">
            <strong className="small text-muted">Direction</strong>
            <div>{isConsensusToEvm ? 'Consensus → Auto EVM' : 'Auto EVM → Consensus'}</div>
          </div>
          <div className="mb-2">
            <strong className="small text-muted">From</strong>
            <div className="font-monospace small text-break">{senderAddress}</div>
          </div>
          <div className="mb-2">
            <strong className="small text-muted">To</strong>
            <div className="font-monospace small text-break">{recipient}</div>
          </div>
          <div className="mb-2">
            <strong className="small text-muted">Amount</strong>
            <div className="fs-5 fw-bold">{amount} AI3</div>
          </div>
          <div className="p-2 bg-light rounded small">
            <strong>Estimated confirmation time:</strong> {confirmationTime}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Confirm &amp; Send
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SendForm;
