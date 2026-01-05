import { Box, Grid, Text } from 'grommet';
import { Header } from '../components/layout/Header';
import { ApplicationTile } from '../components/ApplicationTile';
import { useConfig } from '../hooks/useConfig';
import { trpc } from '../trpc-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import type { ApplicationInstance } from '@app/shared';

export const ApplicationsPage = () => {
  const { applications, openApplication } = useConfig();
  const utils = trpc.useUtils();

  // Use useMemo to optimize filtering of enabled applications
  const enabledApplications = useMemo(
    () => (applications.data || []).filter((app) => app.enabled),
    [applications.data]
  );

  if (applications.isLoading) {
    return (
      <Box fill>
        <Header title="Launchpad - Apps" />
        <Box align="center" justify="center" fill>
          <Text>Loading applications...</Text>
        </Box>
      </Box>
    );
  }

  if (applications.error) {
    return (
      <Box fill>
        <Header title="Launchpad - Apps" />
        <Box align="center" justify="center" fill>
          <Text color="status-error">Error: {applications.error.message}</Text>
        </Box>
      </Box>
    );
  }

  const handleApplicationClick = async (app: ApplicationInstance) => {
    try {
      await openApplication.mutateAsync({ url: app.url, name: app.name });
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
              checkConnectivity={(url) => utils.client.app.checkConnectivity.query(url)}
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
