import { ChatInterface } from './components/ChatInterface'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header>
        <h1>Strategy AI Assistant</h1>
      </header>
      <main>
        <ChatInterface />
      </main>
    </div>
  )
}

export default App
