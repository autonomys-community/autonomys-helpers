import React from 'react';
import ChannelCard from './ChannelCard';
import { ChannelEntry } from '../pages/channels';

interface ChannelListProps {
  channels: ChannelEntry[];
  parseNumber: (val: string | undefined) => number;
}

const ChannelList: React.FC<ChannelListProps> = ({ channels, parseNumber }) => {
  return (
    <div>
      {channels.map((channel) => (
        <ChannelCard key={channel.channelId} channel={channel} parseNumber={parseNumber} />
      ))}
    </div>
  );
};

export default ChannelList;
