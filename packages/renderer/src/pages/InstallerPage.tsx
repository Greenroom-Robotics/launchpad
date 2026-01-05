import { Box } from 'grommet';
import { Header } from '../components/layout/Header';

export const InstallerPage = () => {
  return (
    <Box fill>
      <Header title="Launchpad - Installer" />
      <Box direction="row" margin={{ horizontal: 'medium', bottom: 'medium' }} gap="medium"></Box>
      Woop
    </Box>
  );
};
