import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'
import Home from './pages/Home'
import InterviewConfig from './pages/InterviewConfig'
import InterviewSession from './pages/InterviewSession'
import InterviewReport from './pages/InterviewReport'
import CharacterTest from './pages/CharacterTest'
import SimpleCharacterTest from './pages/SimpleCharacterTest'
import { AuthProvider } from './context/AuthContext'
import History from './pages/History';
import VapiCallSession from './pages/VapiCallSession';
import { useAuth } from './context/AuthContext';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminUsers from './pages/admin/AdminUsers';
import AdminInterviews from './pages/admin/AdminInterviews';
import AdminVapiSettings from './pages/admin/AdminVapiSettings';

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
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* User Routes */}
          <Route path="/interview-config" element={<InterviewConfig />} />
          <Route path="/interview-session" element={<InterviewSession />} />
          <Route path="/interview-report/:id" element={<InterviewReport />} />
          <Route path="/history" element={<History />} />
          <Route path="/vapi-call" element={<VapiCallSession />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Test Routes */}
          <Route path="/character-test" element={<CharacterTest />} />
          <Route path="/simple-test" element={<SimpleCharacterTest />} />

          {/* Admin Routes - Separated */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminAnalytics />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/interviews"
            element={
              <AdminRoute>
                <AdminInterviews />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/vapi-settings"
            element={
              <AdminRoute>
                <AdminVapiSettings />
              </AdminRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App