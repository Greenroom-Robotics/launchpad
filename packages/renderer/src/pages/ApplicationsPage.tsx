import { Box, Grid, Text } from 'grommet';
import { Header } from '../components/layout/Header';
import { ApplicationTile } from '../components/ApplicationTile';
import { useConfig } from '../hooks/useConfig';
import { useMemo } from 'react';
import type { ApplicationInstance } from '../types/config';
import { Link } from 'react-router';

export const ApplicationsPage = () => {
  const { applications, isLoading, error, openApplication, checkConnectivity } = useConfig();

  // Use useMemo to optimize filtering of enabled applications
  const enabledApplications = useMemo(
    () => applications.filter((app) => app.enabled),
    [applications]
  );

  if (isLoading) {
    return (
      <Box fill>
        <Header title="Launchpad - Apps" />
        <Box align="center" justify="center" fill>
          <Text>Loading applications...</Text>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box fill>
        <Header title="Launchpad - Apps" />
        <Box align="center" justify="center" fill>
          <Text color="status-error">Error: {error}</Text>
        </Box>
      </Box>
    );
  }

  const handleApplicationClick = async (app: ApplicationInstance) => {
    try {
      await openApplication(app.url, app.name);
    } catch (err) {
      console.error('Failed to open application:', err);
    }
  };

  return (
    <Box fill>
      <Header title="Launchpad - Apps" />
      <Box fill overflow="auto" pad="medium">
        <Grid columns={{ count: 'fill', size: 'medium' }} gap="small">
          {enabledApplications.map((app) => (
            <ApplicationTile
              key={app.id}
              application={app}
              onClick={() => handleApplicationClick(app)}
              checkConnectivity={checkConnectivity}
            />
          ))}
        </Grid>
        {enabledApplications.length === 0 && (
          <Box fill align="center" justify="center" height="medium">
            <Text>
              No applications found. <Link to="/settings">Configure</Link> applications
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
