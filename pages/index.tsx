import Link from 'next/link'

export default function Home() {
  return (
    <div className="container py-5">
      <h1>Autonomys Helpers</h1>
      <ul className="mt-4">
        <li><Link href="/channels">View XDM Channel Status</Link></li>
        {/* Add more links to other sub-pages as needed */}
      </ul>
    </div>
  )
}
