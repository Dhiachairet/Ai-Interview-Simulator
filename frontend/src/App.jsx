import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'
import Home from './pages/Home'
import InterviewConfig from './pages/InterviewConfig'
import InterviewSession from './pages/InterviewSession'
import CharacterTest from './pages/CharacterTest'
import SimpleCharacterTest from './pages/SimpleCharacterTest'  // Add this
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/interview-config" element={<InterviewConfig />} />
          <Route path="/interview-session" element={<InterviewSession />} />
          <Route path="/character-test" element={<CharacterTest />} />
          <Route path="/simple-test" element={<SimpleCharacterTest />} /> {/* Add this route */}
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App