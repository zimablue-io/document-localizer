import Features from './components/Features'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Navigation from './components/Navigation'
import SetupGuide from './components/SetupGuide'
import StepViewer from './components/StepViewer'

export default function App() {
	return (
		<div className="min-h-screen flex flex-col">
			<Navigation />
			<Hero />
			<div id="features">
				<Features />
			</div>
			<div id="how-it-works">
				<StepViewer />
			</div>
			<div id="setup">
				<SetupGuide />
			</div>
			<Footer />
		</div>
	)
}
