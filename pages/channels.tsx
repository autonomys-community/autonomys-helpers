import { useEffect, useState } from 'react';
import { fetchChannels } from '../utils/fetchChannels';
import ChannelList from '../components/ChannelList';

export interface ChannelEntry {
  channelId: string;
  state: string;
  nextInboxNonce: string;
  nextOutboxNonce: string;
  latestResponseReceivedMessageNonce: string;
  maxOutgoingMessages: string;
  [key: string]: unknown; // allow extra fields without using `any`
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels()
      .then((data: unknown[]) => {
        const validChannels = data.filter((entry): entry is ChannelEntry => {
          return (
            typeof entry === 'object' &&
            entry !== null &&
            'channelId' in entry &&
            'state' in entry &&
            'nextInboxNonce' in entry &&
            'nextOutboxNonce' in entry &&
            'latestResponseReceivedMessageNonce' in entry &&
            'maxOutgoingMessages' in entry
          );
        });

        setChannels(validChannels);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Fetching channels failed:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="container py-5">Loading channel data...</div>;
  }

  if (!channels.length) {
    return <div className="container py-5">No channel data available.</div>;
  }

  return (
    <div className="container py-5">
      <h1>XDM Channels Status</h1>
      <ChannelList channels={channels} />
    </div>
  );
}
