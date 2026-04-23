import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Developer Dashboard',
  description: 'A production-ready AI-powered developer insights dashboard.',
};

const themeInitScript = `(function(){try{var storageKey='developer-dashboard-theme';var savedTheme=localStorage.getItem(storageKey);var parsedTheme=savedTheme?JSON.parse(savedTheme):'system';var systemTheme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var resolvedTheme=parsedTheme==='system'?systemTheme:parsedTheme;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolvedTheme);root.dataset.theme=resolvedTheme;root.style.colorScheme=resolvedTheme;}catch(error){document.documentElement.classList.add('light');document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light';}})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
