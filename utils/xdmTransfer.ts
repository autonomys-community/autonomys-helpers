import { activate, disconnect, ai3ToShannons } from '@autonomys/auto-utils';
import { transporterTransfer, transferToConsensus } from '@autonomys/auto-xdm';
import type { InjectedExtension } from '@polkadot/extension-inject/types';
import { decodeAddress } from '@polkadot/keyring';
import { isAddress as isValidEthersAddress } from 'ethers';
import type { JsonRpcSigner, BrowserProvider } from 'ethers';
import type { NetworkType } from '../config/networks';
import { NETWORKS } from '../config/networks';

export type TransferDirection = 'consensus-to-evm' | 'evm-to-consensus';

export interface TransferResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  error?: string;
}

/**
 * Execute a Consensus → Auto EVM transfer using the Substrate wallet.
 * Uses tx.signAndSend() directly (rather than the SDK's signAndSendTx) so that
 * wallet rejections properly reject the promise instead of hanging forever.
 */
export async function transferConsensusToEvm(params: {
  network: NetworkType;
  injector: InjectedExtension;
  senderAddress: string;
  recipientEvmAddress: string;
  amountAi3: string;
}): Promise<TransferResult> {
  const { network, injector, senderAddress, recipientEvmAddress, amountAi3 } = params;
  const config = NETWORKS[network];

  const api = await activate({ networkId: config.networkId });
  try {
    const amount = ai3ToShannons(amountAi3);
    const tx = transporterTransfer(
      api,
      { domainId: config.domainId },
      { accountId20: recipientEvmAddress },
      amount,
    );

    // We use two racing promises:
    // 1. The status-callback promise that resolves/rejects based on tx lifecycle
    // 2. The signAndSend outer promise that rejects if the wallet denies signing
    //
    // Some wallet extensions (e.g. SubWallet) reject the outer promise while
    // others may throw synchronously or fire the callback with an error.
    // Racing both + wrapping in try/catch covers all paths.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await new Promise<TransferResult>((resolve, reject) => {
      let settled = false;
      let unsub: (() => void) | undefined;

      const cleanup = () => {
        if (unsub) { try { unsub(); } catch { /* ignore */ } }
      };
      const safeResolve = (v: TransferResult) => {
        if (!settled) { settled = true; cleanup(); resolve(v); }
      };
      const safeReject = (e: unknown) => {
        if (!settled) { settled = true; cleanup(); reject(e); }
      };

      try {
        const outerPromise = tx.signAndSend(
          senderAddress,
          { signer: injector.signer as any },
          ({ status, txHash, dispatchError }) => {
            if (dispatchError) {
              safeReject(new Error(`Transaction failed: ${dispatchError.toString()}`));
            } else if (status.isInBlock || status.isFinalized) {
              safeResolve({
                success: true,
                txHash: txHash.toHex(),
              });
            } else if (status.isDropped || status.isInvalid || status.isRetracted) {
              safeReject(new Error('Transaction was dropped or invalid.'));
            }
          },
        );
        // The outer promise resolves to an unsubscribe fn on success,
        // but rejects if the wallet denies the signing request.
        if (outerPromise && typeof (outerPromise as any).then === 'function') {
          (outerPromise as any).then(
            (fn: unknown) => { if (typeof fn === 'function') unsub = fn as () => void; },
            safeReject,
          );
        }
      } catch (err) {
        // Synchronous throw from signAndSend (some extension implementations)
        safeReject(err);
      }
    });

    return result;
  } finally {
    // disconnect in background — don't let it block error propagation
    disconnect(api).catch((e) => console.warn('Failed to disconnect API:', e));
  }
}

/**
 * Execute an Auto EVM → Consensus transfer using the EVM precompile.
 * Fetches current fee data to avoid "gas price less than block base fee" errors.
 */
export async function transferEvmToConsensus(params: {
  signer: JsonRpcSigner;
  recipientSs58Address: string;
  amountAi3: string;
}): Promise<TransferResult> {
  const { signer, recipientSs58Address, amountAi3 } = params;
  const amount = ai3ToShannons(amountAi3);

  // Fetch current fee data so the tx meets the block base fee
  const provider = signer.provider;
  const feeData = await provider.getFeeData();

  const result = await transferToConsensus(signer, recipientSs58Address, amount, {
    maxFeePerGas: feeData.maxFeePerGas ?? undefined,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
  });
  return {
    success: result.success,
    txHash: result.transactionHash,
    blockNumber: result.blockNumber,
  };
}

/**
 * Fetch the balance of a Substrate account on the consensus chain.
 * Returns balance in AI3 as a string.
 */
export async function getConsensusBalance(
  network: NetworkType,
  address: string,
): Promise<string> {
  const config = NETWORKS[network];
  const api = await activate({ networkId: config.networkId });
  try {
    const accountInfo = await api.query.system.account(address);
    const free = (accountInfo as unknown as { data: { free: { toBigInt: () => bigint } } }).data.free.toBigInt();
    // Convert from Shannons to AI3 (18 decimals)
    const ai3 = Number(free) / 1e18;
    return ai3.toFixed(4);
  } finally {
    await disconnect(api);
  }
}

/**
 * Fetch the balance of an EVM account on the Auto EVM domain.
 * Returns balance in AI3 as a string.
 */
export async function getEvmBalance(provider: BrowserProvider, address: string): Promise<string> {
  const balance = await provider.getBalance(address);
  // balance is in wei (18 decimals) — same as AI3 Shannons
  const ai3 = Number(balance) / 1e18;
  return ai3.toFixed(4);
}

/**
 * Validate an EVM address using ethers.js (includes EIP-55 checksum validation).
 */
export function isValidEvmAddress(addr: string): boolean {
  return isValidEthersAddress(addr);
}

export function isValidSubstrateAddress(addr: string): boolean {
  try {
    decodeAddress(addr);
    return true;
  } catch {
    return false;
  }
}
