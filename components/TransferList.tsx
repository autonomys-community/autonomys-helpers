import React from 'react';
import TransferCard from './TransferCard';
import { XdmTransfer } from '../utils/fetchTransfers';
import { TransferProgress, transferKey } from '../utils/fetchTransferProgress';

interface TransferListProps {
  transfers: XdmTransfer[];
  searchAddress: string;
  progress?: Map<string, TransferProgress>;
}

const TransferList: React.FC<TransferListProps> = ({ transfers, searchAddress, progress }) => {
  if (transfers.length === 0) {
    return (
      <div className="text-center text-muted py-4">
        No transfers found for this address.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 text-muted">
        Found {transfers.length} transfer{transfers.length !== 1 ? 's' : ''}
      </div>
      {transfers.map((transfer, index) => (
        <TransferCard
          key={transferKey(transfer, index)}
          transfer={transfer}
          searchAddress={searchAddress}
          progress={progress?.get(transferKey(transfer, index))}
        />
      ))}
    </div>
  );
};

export default TransferList;
