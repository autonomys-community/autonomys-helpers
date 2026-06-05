import { ai3ToShannons } from '@autonomys/auto-utils';
import { Contract, formatUnits } from 'ethers';
import type { JsonRpcSigner, BrowserProvider } from 'ethers';
import { NETWORKS, type NetworkType } from '../config/networks';
import { getEvmFeeOverrides } from './evmFees';

/**
 * Minimal ABI for the WAI3 contract.
 * WAI3 is a WETH-style wrapper: `deposit()` wraps native AI3 sent with the tx,
 * `withdraw(uint256)` unwraps WAI3 back to native AI3, and standard ERC-20
 * methods expose balance and metadata.
 */
export const WAI3_ABI = [
  'function deposit() payable',
  'function withdraw(uint256 amount)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
] as const;

export interface WrapResult {
  success: boolean;
  txHash: string;
  blockNumber?: number;
}

/**
 * Wrap native AI3 into WAI3 by calling `deposit()` with the native amount as value.
 */
export async function wrapAi3(params: {
  network: NetworkType;
  signer: JsonRpcSigner;
  amountAi3: string;
}): Promise<WrapResult> {
  const { network, signer, amountAi3 } = params;
  const { wai3Address } = NETWORKS[network];
  const value = ai3ToShannons(amountAi3);

  const contract = new Contract(wai3Address, WAI3_ABI, signer);
  const tx = await contract.deposit({
    value,
    ...(await getEvmFeeOverrides(signer)),
  });
  const receipt = await tx.wait();
  return {
    success: receipt?.status === 1,
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber,
  };
}

/**
 * Unwrap WAI3 back into native AI3 by calling `withdraw(amount)`.
 */
export async function unwrapWai3(params: {
  network: NetworkType;
  signer: JsonRpcSigner;
  amountAi3: string;
}): Promise<WrapResult> {
  const { network, signer, amountAi3 } = params;
  const { wai3Address } = NETWORKS[network];
  const amount = ai3ToShannons(amountAi3);

  const contract = new Contract(wai3Address, WAI3_ABI, signer);
  const tx = await contract.withdraw(amount, await getEvmFeeOverrides(signer));
  const receipt = await tx.wait();
  return {
    success: receipt?.status === 1,
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber,
  };
}

/**
 * Read the WAI3 balance of an address, formatted as a 4-decimal AI3 string.
 */
export async function getWai3Balance(
  network: NetworkType,
  provider: BrowserProvider,
  address: string,
): Promise<string> {
  const { wai3Address } = NETWORKS[network];
  const contract = new Contract(wai3Address, WAI3_ABI, provider);
  const raw: bigint = await contract.balanceOf(address);
  // WAI3 uses 18 decimals (same as native AI3)
  return Number(formatUnits(raw, 18)).toFixed(4);
}

/**
 * Ask the connected wallet (MetaMask) to track WAI3 as an ERC-20.
 * Returns true if the user added the token, false if they declined or it failed.
 */
export async function addWai3ToWallet(network: NetworkType): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false;
  const { wai3Address, nativeSymbol } = NETWORKS[network];
  try {
    const result = await window.ethereum.request({
      method: 'wallet_watchAsset',
      // wallet_watchAsset expects an object, not an array — MetaMask accepts both
      // but the EIP-747 shape is a plain object. Cast to the loose params type.
      params: {
        type: 'ERC20',
        options: {
          address: wai3Address,
          symbol: `W${nativeSymbol}`,
          decimals: 18,
        },
      } as unknown as unknown[],
    });
    return Boolean(result);
  } catch {
    return false;
  }
}
