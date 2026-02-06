import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ChannelsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/xdm/channels');
  }, [router]);

  return (
    <div className="container py-5 text-center">
      <p>Redirecting to <Link href="/xdm/channels">/xdm/channels</Link>...</p>
    </div>
  );
}
