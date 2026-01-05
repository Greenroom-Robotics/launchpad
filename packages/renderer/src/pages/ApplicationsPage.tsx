import gamaHeroImage from '/gama-hero-box.svg'
import lookoutHeroImage from '/lookout-hero-box.svg'
import maropsHeroImage from '/marops-hero-box.svg'
import missimHeroImage from '/missim-hero-box.svg'
import { Box, Text } from 'grommet'
import { Header } from '../components/layout/Header'
import { ApplicationTile } from '../components/ApplicationTile'
import { useConfig } from '../hooks/useConfig'
import type { ApplicationInstance } from '../types/config'

const applicationImages = {
  gama: gamaHeroImage,
  lookout: lookoutHeroImage,
  marops: maropsHeroImage,
  missim: missimHeroImage
} as const;

export const ApplicationsPage = () => {
  const { applications, isLoading, error, openApplication } = useConfig();

  if (isLoading) {
    return (
      <Box fill>
        <Header title="Launchpad" />
        <Box align="center" justify="center" fill>
          <Text>Loading applications...</Text>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box fill>
        <Header title="Launchpad" />
        <Box align="center" justify="center" fill>
          <Text color="status-error">Error: {error}</Text>
        </Box>
      </Box>
    );
  }

  const enabledApplications = applications.filter(app => app.enabled);

  const handleApplicationClick = async (app: ApplicationInstance) => {
    try {
      await openApplication(app.url);
    } catch (err) {
      console.error('Failed to open application:', err);
    }
  };

  return (
    <Box fill>
      <Header title="Launchpad" />
      <Box direction="row" margin={{ horizontal: "medium", bottom: "medium" }} gap="medium" wrap>
        {enabledApplications.map(app => (
          <ApplicationTile
            key={app.id}
            title={app.name}
            src={applicationImages[app.type]}
            onClick={() => handleApplicationClick(app)}
          />
        ))}
      </Box>
    </Box>
  )
}
