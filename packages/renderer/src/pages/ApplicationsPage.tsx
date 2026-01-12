import { Box, Grid, Text, Menu } from 'grommet';
import { FormFolder } from 'grommet-icons';
import { Header } from '../components/layout/Header';
import { ApplicationTile } from '../components/ApplicationTile';
import { useConfig } from '../hooks/useConfig';
import { trpc } from '../trpc-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { useLocalStorage } from 'react-use';
import { groupBy, startCase } from 'lodash';
import type { ApplicationInstance } from '@app/shared';

type GroupingMode = 'vesselName' | 'type';

export const ApplicationsPage = () => {
  const { applications, launchApp } = useConfig();
  const utils = trpc.useUtils();
  const [groupingMode, setGroupingMode] = useLocalStorage<GroupingMode>(
    'app-grouping',
    'vesselName'
  );

  // Use useMemo to optimize filtering of enabled applications
  const enabledApplications = useMemo(
    () => (applications.data || []).filter((app) => app.enabled),
    [applications.data]
  );

  // Group applications based on selected grouping mode
  const groupedApplications = useMemo(() => {
    if (!enabledApplications.length) return {};

    if (groupingMode === 'vesselName') {
      return groupBy(
        enabledApplications,
        (app: ApplicationInstance) => app.vesselName || 'Unassigned'
      );
    } else {
      return groupBy(enabledApplications, 'type');
    }
  }, [enabledApplications, groupingMode]);

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
      const result = await launchApp.mutateAsync({ appId: app.id });
      if (!result.success) {
        console.error('Failed to launch application:', result.message);
      }
    } catch (err) {
      console.error('Failed to launch application:', err);
    }
  };

  const groupMenu = (
    <Menu
      icon={<FormFolder />}
      tip="Group by"
      items={[
        {
          label: startCase('vesselName'),
          onClick: () => setGroupingMode('vesselName'),
          active: groupingMode === 'vesselName',
        },
        {
          label: startCase('type'),
          onClick: () => setGroupingMode('type'),
          active: groupingMode === 'type',
        },
      ]}
      dropProps={{ align: { top: 'bottom', right: 'right' } }}
    />
  );

  return (
    <Box fill>
      <Header title="Launchpad - Apps">{groupMenu}</Header>
      <Box
        fill
        overflow="auto"
        pad={{ top: 'small', horizontal: 'medium', bottom: 'medium' }}
        gap="xsmall"
      >
        {Object.entries(groupedApplications).map(
          ([groupName, apps]: [string, ApplicationInstance[]]) => (
            <Box flex={false} key={groupName} margin={{ bottom: 'medium' }}>
              <Text size="medium" weight="bold" margin={{ bottom: 'small' }}>
                {startCase(groupingMode)}: {groupName}
              </Text>
              <Grid columns={{ count: 'fill', size: '300px' }} gap="small">
                {apps.map((app: ApplicationInstance) => (
                  <ApplicationTile
                    key={app.id}
                    application={app}
                    onClick={() => handleApplicationClick(app)}
                    checkConnectivity={() => utils.client.apps.checkAppConnectivity.query(app.id)}
                  />
                ))}
              </Grid>
            </Box>
          )
        )}
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
