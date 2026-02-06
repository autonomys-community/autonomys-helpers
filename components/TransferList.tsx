import React from 'react';
import TransferCard from './TransferCard';
import { XdmTransfer } from '../utils/fetchTransfers';

interface TransferListProps {
  transfers: XdmTransfer[];
  searchAddress: string;
}

const TransferList: React.FC<TransferListProps> = ({ transfers, searchAddress }) => {
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
          key={`${transfer.channel_id}-${transfer.nonce}-${transfer.src_chain}-${index}`}
          transfer={transfer}
          searchAddress={searchAddress}
        />
      ))}
    </div>
  );
};

export default TransferList;
