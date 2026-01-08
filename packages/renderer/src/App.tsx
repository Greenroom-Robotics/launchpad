import { TexturedPanel } from './components/TexturedPanel';
import { Sidebar } from './components/layout/Sidebar';
import { Routes, Route } from 'react-router';
import { ApplicationsPage } from './pages/ApplicationsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { InstallerPage } from './pages/InstallerPage.tsx';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ipcLink } from 'electron-trpc-experimental/renderer';
import { trpc } from './trpc-react';
import { LoginPage } from './pages/LoginPage.tsx';

export const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [ipcLink()],
    })
  );

  // Check if this is a login window (based on URL parameters)
  const urlParams = new URLSearchParams(window.location.search);
  const isLoginWindow = urlParams.has('login');
  const url = urlParams.get('url');
  const realm = urlParams.get('realm');

  if (isLoginWindow && url) {
    return (
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <LoginPage url={url} realm={realm || undefined} />
        </QueryClientProvider>
      </trpc.Provider>
    );
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TexturedPanel fill direction="row">
          <Sidebar />
          <Routes>
            <Route path="/" element={<ApplicationsPage />} />
            <Route path="/installer" element={<InstallerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </TexturedPanel>
      </QueryClientProvider>
    </trpc.Provider>
  );
};

export default App;
