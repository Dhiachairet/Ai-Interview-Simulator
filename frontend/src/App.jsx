import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'
import Home from './pages/Home'
import InterviewConfig from './pages/InterviewConfig'
import InterviewSession from './pages/InterviewSession'
import CharacterTest from './pages/CharacterTest'
import SimpleCharacterTest from './pages/SimpleCharacterTest'  // Add this
import { AuthProvider } from './context/AuthContext'
import History from './pages/History';
import VapiCallSession from './pages/VapiCallSession';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';
import InterviewReport from './pages/InterviewReport';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1E] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

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
          <Route path="/simple-test" element={<SimpleCharacterTest />} /> 
          <Route path="/history" element={<History />} />
          <Route path="/vapi-call" element={<VapiCallSession />} />
          <Route path="/interview-report/:id" element={<InterviewReport />} />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />


        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App