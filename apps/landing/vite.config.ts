import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		port: 1421,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@doclocalizer/ui': path.resolve(__dirname, '../../packages/ui/src'),
		},
	},
})
