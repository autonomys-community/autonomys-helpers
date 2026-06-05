import { activate, disconnect, ai3ToShannons, signAndSendTx } from '@autonomys/auto-utils';
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await signAndSendTx(senderAddress, tx, { signer: injector.signer as any });

    return { success: result.success, txHash: result.txHash };
  } finally {
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
