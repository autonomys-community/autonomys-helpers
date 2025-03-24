import ChannelCard from './ChannelCard';
import { ChannelEntry } from '../pages/channels';

interface ChannelListProps {
  channels: ChannelEntry[];
}

export default function ChannelList({ channels }: ChannelListProps) {
  return (
    <>
      {channels.map((channel, index) => (
        <ChannelCard key={index} {...channel} />
      ))}
    </>
  );
}
