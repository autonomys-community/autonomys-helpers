import ChannelCard from './ChannelCard';

interface Channel {
  channelId: string;
  state: string;
  nextInboxNonce: string;
  nextOutboxNonce: string;
  latestResponseReceivedMessageNonce: string;
  maxOutgoingMessages: string;
}

interface ChannelListProps {
  channels: Channel[];
}

export default function ChannelList({ channels }: ChannelListProps) {
  return (
    <>
      {channels.map((channel) => (
        <ChannelCard key={channel.channelId} {...channel} />
      ))}
    </>
  );
}
