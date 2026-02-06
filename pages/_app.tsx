import 'bootstrap/dist/css/bootstrap.min.css'
import { AppProps } from 'next/app'
import Link from 'next/link'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <nav className="navbar navbar-light bg-white border-bottom">
        <div className="container">
          <Link href="/" className="navbar-brand fw-bold">
            Autonomys Helpers
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </>
  )
}
