import React from 'react';
import ChannelCard from './ChannelCard';
import { ChannelEntry } from '../pages/channels';

interface ChannelListProps {
  channels: ChannelEntry[];
}

const ChannelList: React.FC<ChannelListProps> = ({ channels }) => {
  if (!channels || channels.length === 0) {
    return <div>No channel data available.</div>;
  }

  return (
    <div>
      {channels.map((channel, index) => (
        <ChannelCard key={index} channel={channel} />
      ))}
    </div>
  );
};

export default ChannelList;
