import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GlobalStyles } from '@greenroom-robotics/alpha.ui/build/theme';
import { HashRouter } from "react-router";
import { App } from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalStyles>
      <HashRouter>
        <App />
      </HashRouter>
    </GlobalStyles>
  </StrictMode>,
)
