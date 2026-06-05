import type { JsonRpcSigner } from 'ethers';

/**
 * Fetch current EIP-1559 fee data from the connected provider so a tx meets
 * the block base fee.
 *
 * MetaMask's built-in fee estimator is tuned for Ethereum mainnet/L2s and
 * frequently picks a maxFeePerGas below Auto EVM's current base fee, which the
 * node then rejects with "gas price less than block base fee". Passing the
 * RPC's own values explicitly bypasses MetaMask's estimator.
 */
export async function getEvmFeeOverrides(signer: JsonRpcSigner): Promise<{
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}> {
  const feeData = await signer.provider.getFeeData();
  return {
    maxFeePerGas: feeData.maxFeePerGas ?? undefined,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
  };
}
