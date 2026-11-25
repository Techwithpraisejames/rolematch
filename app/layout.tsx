import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
export const metadata: Metadata = { title: "RoleMatch | Find work that fits", description: "Discover jobs based on your experience." };
export default function Layout({children}: {children: React.ReactNode}) {
 return <html lang="en" className={GeistSans.className}><body>{children}</body></html>;
}
