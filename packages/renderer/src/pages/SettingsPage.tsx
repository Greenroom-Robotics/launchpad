import { memo } from 'react';
import { Link, Route, Routes, useLocation, Navigate } from 'react-router';
import { Box, Button, Nav } from 'grommet';
import { Header } from '../components/layout/Header';
import { AppSettingsPage } from './AppSettingsPage';
import { AuthSettingsPage } from './AuthSettingsPage';
import { GeneralSettingsPage } from './GeneralSettingsPage';

export const SettingsPage = memo(() => {
  const location = useLocation();

  return (
    <Box fill>
      <Header title="Launchpad - Settings" border={{ side: 'bottom', size: '2px' }} />
      <Box fill direction="row">
        <Nav
          border={{ side: 'right', size: '2px' }}
          pad={{ top: 'small' }}
          gap="none"
          height={{ min: '100%' }}
          width="220px"
          flex={false}
        >
          <Link to="/settings/apps">
            <Button
              label="Apps"
              color={location?.pathname === '/settings/apps' ? 'green' : 'white'}
            />
          </Link>
          <Link to="/settings/auth">
            <Button
              label="Authentication"
              color={location?.pathname === '/settings/auth' ? 'green' : 'white'}
            />
          </Link>
          <Link to="/settings/general">
            <Button
              label="General"
              color={location?.pathname === '/settings/general' ? 'green' : 'white'}
            />
          </Link>
        </Nav>
        <Box fill overflow="auto">
          <Box pad="medium" flex={false}>
            <Routes>
              <Route path="/" element={<Navigate to="apps" replace />} />
              <Route path="apps" element={<AppSettingsPage />} />
              <Route path="auth" element={<AuthSettingsPage />} />
              <Route path="general" element={<GeneralSettingsPage />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

SettingsPage.displayName = 'SettingsPage';
