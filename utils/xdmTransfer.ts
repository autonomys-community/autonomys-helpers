import { activate, disconnect, signAndSendTx, ai3ToShannons } from '@autonomys/auto-utils';
import type { SignerOptions } from '@autonomys/auto-utils';
import { transporterTransfer, transferToConsensus } from '@autonomys/auto-xdm';
import type { InjectedExtension } from '@polkadot/extension-inject/types';
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

    // Cast signer to work around @polkadot version mismatch between extension-inject and auto-utils
    const result = await signAndSendTx(senderAddress, tx, { signer: injector.signer } as Partial<SignerOptions>);
    return {
      success: result.success,
      txHash: result.txHash,
    };
  } finally {
    await disconnect(api);
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
 * Basic address format validation.
 */
export function isValidEvmAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export function isValidSubstrateAddress(addr: string): boolean {
  // Substrate addresses are base58 encoded, typically 46-48 chars
  // Starting with a character (not 0x)
  if (addr.startsWith('0x')) return false;
  if (addr.length < 40 || addr.length > 60) return false;
  // Basic base58 character check
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(addr);
}
