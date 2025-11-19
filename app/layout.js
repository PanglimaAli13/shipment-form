import './globals.css'

export const metadata = {
  title: 'Shipment Form',
  description: 'Form Input Data Shipment Driver',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}