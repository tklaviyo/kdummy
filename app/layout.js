import './globals.css'
import { ConfirmProvider } from '@/context/ConfirmContext'

export const metadata = {
  title: 'K:Dummy - Klaviyo Dummy Data Generator',
  description: 'Quickly create personalised dummy data for demo and educational purposes',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  )
}

