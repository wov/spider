import '@/styles/globals.css'
import localFont from 'next/font/local'

// Font files can be colocated inside of `pages`
const GeoSlab703MdBT = localFont({ src: './GeoSlab703MdBT.ttf' })


export default function App({ Component, pageProps }) {
  return  <main className={GeoSlab703MdBT.className}>
            <Component {...pageProps} />
           </main>
}
