import { TexturedPanel } from './components/TexturedPanel';
import { Sidebar } from './components/layout/Sidebar';
import { Routes, Route } from "react-router";
import { ApplicationsPage } from './pages/ApplicationsPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx';
import { InstallerPage } from './pages/InstallerPage.tsx';

export const App = () => {
    return (
        <TexturedPanel fill direction="row">
          <Sidebar />
          <Routes>
            <Route path="/" element={<ApplicationsPage />} />
            <Route path="/installer" element={<InstallerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </TexturedPanel>
    )
}