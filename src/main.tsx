import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tailwind.css'
import './styles/global.css'
import './styles/theme-dark-overrides.css'
import App from './App.tsx'

document.documentElement.classList.add('sa-dark')
document.body.classList.add('sa-dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
