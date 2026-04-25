import './index.css'
import { Analytics } from '@vercel/analytics/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Analytics />
		<App />
	</StrictMode>
)
