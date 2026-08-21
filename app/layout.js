import "./globals.css";

export const metadata = {
  title: "Sixty Night – Mobil QR Beléptető",
  description: "Közös online QR-beléptető rendszer"
};

export default function RootLayout({ children }) {
  return <html lang="hu"><body>{children}</body></html>;
}
