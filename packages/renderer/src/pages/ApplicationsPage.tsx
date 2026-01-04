import gamaHeroImage from '/gama-hero-box.svg'
import lookoutHeroImage from '/lookout-hero-box.svg'
import maropsHeroImage from '/marops-hero-box.svg'
import missimHeroImage from '/missim-hero-box.svg'
import { Box } from 'grommet'
import { Header } from '../components/layout/Header'
import { ApplicationTile } from '../components/ApplicationTile'

export const ApplicationsPage = () => {
  return (
    <Box fill>
      <Header title="Launchpad" />
      <Box direction="row" margin={{ horizontal: "medium", bottom: "medium" }} gap="medium">
        <ApplicationTile title="GAMA" src={gamaHeroImage} />
        <ApplicationTile title="Lookout+" src={lookoutHeroImage} />
        <ApplicationTile title="MarOps" src={maropsHeroImage} />
        <ApplicationTile title="MIS-SIM" src={missimHeroImage} />
      </Box>
    </Box>
  )
}
