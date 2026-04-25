import Hero from './components/Hero'
import Features from './components/Features'
import StepViewer from './components/StepViewer'
import SetupGuide from './components/SetupGuide'
import Footer from './components/Footer'
import Navigation from './components/Navigation'

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
