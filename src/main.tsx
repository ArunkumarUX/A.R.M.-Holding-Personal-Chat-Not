import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/arm-fonts.css'
import './styles/command-centre.css'
import './styles/micro-interactions.css'
import './index.css'
import './styles/auth-gate.css'
import './styles/arm-brand-tokens.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
