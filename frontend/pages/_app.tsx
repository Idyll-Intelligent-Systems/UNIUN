// @ts-expect-error: Next.js allows global CSS side-effect import here
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import { ToastProvider } from '../components/ui/Toast'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ToastProvider>
  )
}
