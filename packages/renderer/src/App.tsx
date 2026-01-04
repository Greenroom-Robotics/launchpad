import gamaHeroImage from '/gama-hero-box.svg'
import lookoutHeroImage from '/lookout-hero-box.svg'
import maropsHeroImage from '/marops-hero-box.svg'
import missimHeroImage from '/missim-hero-box.svg'

import './App.css'
import { ApplicationTile } from './components/application-tile'

function App() {
  return (
    <>
      <div className='application-tiles'>
        <ApplicationTile title="GAMA" src={gamaHeroImage} />
        <ApplicationTile title="Lookout+" src={lookoutHeroImage} />
        <ApplicationTile title="MarOps" src={maropsHeroImage} />
        <ApplicationTile title="MIS-SIM" src={missimHeroImage} />
      </div>
    </>
  )
}

export default App
