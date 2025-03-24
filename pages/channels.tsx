import { useEffect, useState } from 'react';
import { fetchChannels } from '../utils/fetchChannels';
import ChannelList from '../components/ChannelList';

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels()
      .then((data) => {
        setChannels(data);
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

  if (!channels || channels.length === 0) {
    return <div className="container py-5">No channel data available.</div>;
  }

  return (
    <div className="container py-5">
      <h1>XDM Channels Status</h1>
      <ChannelList channels={channels} />
    </div>
  );
}
