import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ChannelsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/xdm/channels');
  }, [router]);

  return (
    <div className="container py-5 text-center">
      <p>Redirecting to <a href="/xdm/channels">/xdm/channels</a>...</p>
    </div>
  );
}
