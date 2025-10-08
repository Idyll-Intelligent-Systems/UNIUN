import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Layout from '../components/Layout'
import { ToastProvider } from '../components/ui/Toast'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  useEffect(() => {
    const onStart = () => {
      document.body.classList.add('page-fade-exit-active')
    }
    const onDone = () => {
      document.body.classList.remove('page-fade-exit-active')
      document.body.classList.add('page-fade-enter')
      requestAnimationFrame(() => {
        document.body.classList.add('page-fade-enter-active')
        setTimeout(() => {
          document.body.classList.remove('page-fade-enter')
          document.body.classList.remove('page-fade-enter-active')
        }, 220)
      })
    }
    router.events.on('routeChangeStart', onStart)
    router.events.on('routeChangeComplete', onDone)
    router.events.on('routeChangeError', onDone)
    return () => {
      router.events.off('routeChangeStart', onStart)
      router.events.off('routeChangeComplete', onDone)
      router.events.off('routeChangeError', onDone)
    }
  }, [router.events])
  return (
    <ToastProvider>
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta name="theme-color" content="#0b0b0f" />
        </Head>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </>
    </ToastProvider>
  )
}
