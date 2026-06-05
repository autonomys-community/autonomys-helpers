/**
 * Detect whether a thrown error represents the user rejecting a wallet prompt.
 * Covers MetaMask ("user rejected"/"User rejected the request"), ethers
 * (ACTION_REJECTED), and a few Substrate/Polkadot phrasings.
 */
export function isUserRejection(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /user rejected|cancelled|action_rejected|rejected by user/i.test(msg);
}

/**
 * Turn an error from a wallet-signed transaction into a message suitable for
 * the UI: a friendly string for user-rejection, otherwise the raw error.
 */
export function describeWalletError(err: unknown, fallback = 'Transaction failed. Please try again.'): string {
  if (isUserRejection(err)) return 'Transaction was rejected in your wallet.';
  const raw = err instanceof Error ? err.message : String(err);
  return raw || fallback;
}
