import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MicrophoneIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  BoltIcon,
  ChatBubbleBottomCenterTextIcon,
  ComputerDesktopIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const features = [
    {
      icon: <MicrophoneIcon className="h-8 w-8" />,
      title: "Voice Interaction",
      description: "Natural conversations with real-time voice recognition",
      gradient: "from-blue-400 to-cyan-400",
      delay: 0.1
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: "AI Personalities",
      description: "Choose from 4 unique interviewer styles",
      gradient: "from-purple-400 to-pink-400",
      delay: 0.2
    },
    {
      icon: <DocumentTextIcon className="h-8 w-8" />,
      title: "Smart Feedback",
      description: "Detailed AI-powered performance analysis",
      gradient: "from-orange-400 to-red-400",
      delay: 0.3
    },
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: "Progress Tracking",
      description: "Watch your improvement over time",
      gradient: "from-green-400 to-emerald-400",
      delay: 0.4
    }
  ];

  const personalities = [
    {
      name: "Strict Technical",
      role: "The Expert",
      description: "Deep technical questions with critical evaluation",
      color: "from-blue-600 to-blue-400",
      icon: <BoltIcon className="h-6 w-6" />
    },
    {
      name: "Friendly HR",
      role: "The Mentor",
      description: "Behavioral questions with encouraging feedback",
      color: "from-green-600 to-green-400",
      icon: <ChatBubbleBottomCenterTextIcon className="h-6 w-6" />
    },
    {
      name: "Stress Tester",
      role: "The Challenger",
      description: "Rapid questions under pressure",
      color: "from-red-600 to-red-400",
      icon: <ShieldCheckIcon className="h-6 w-6" />
    },
    {
      name: "Theoretical Expert",
      role: "The Professor",
      description: "Deep conceptual discussions",
      color: "from-purple-600 to-purple-400",
      icon: <ComputerDesktopIcon className="h-6 w-6" />
    }
  ];

  const stats = [
    { value: "98%", label: "Success Rate" },
    { value: "10k+", label: "Interviews Completed" },
    { value: "4.9", label: "User Rating" },
    { value: "15min", label: "Average Session" }
  ];

  return (
    <div className="min-h-screen w-full bg-[#0A0F1E] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#0A0F1E]/80 backdrop-blur-lg border-b border-white/10' : ''
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 max-w-7xl mx-auto">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <SparklesIcon className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Interview Pro
              </span>
            </motion.div>
            
            <div className="flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-3">
                    <UserCircleIcon className="h-6 w-6 text-blue-400" />
                    <span className="text-gray-300 text-sm font-medium">
                      {user?.name}
                    </span>
                  </div>
                  {user?.role === 'admin' && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to="/admin"
                        className="text-gray-300 hover:text-white px-4 py-2 text-sm font-medium transition"
                      >
                        Admin
                      </Link>
                    </motion.div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <span>Logout</span>
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to="/login" className="text-gray-300 hover:text-white px-4 py-2 text-sm font-medium transition">
                      Login
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      to="/register" 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                    >
                      Get Started Free
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative w-full pt-32 pb-20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm font-medium text-blue-400 mb-8">
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  AI-Powered Interview Preparation
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold mb-6"
              >
                Master Your Next
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Job Interview
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto"
              >
                Practice with our intelligent AI interviewer. Get real-time feedback, 
                improve your responses, and land your dream job with confidence.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4"
              >
                <Link to={isAuthenticated ? "/interview-config" : "/register"}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-lg font-medium overflow-hidden"
                  >
                    <span className="relative z-10">
                      {isAuthenticated ? "Start New Interview" : "Start Practicing Now"}
                    </span>
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                      initial={{ x: "100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </Link>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-lg font-medium hover:bg-white/10 transition"
                >
                  Watch Demo <ArrowRightIcon className="inline h-5 w-5 ml-2" />
                </motion.button>
              </motion.div>

              {/* Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400 mt-2">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Features Section */}
            <div className="mt-32">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Everything You Need to
                  <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Ace Your Interview
                  </span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Our AI-powered platform provides all the tools you need to prepare effectively
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: feature.delay }}
                    viewport={{ once: true }}
                    whileHover={{ y: -10 }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"
                      style={{
                        background: `linear-gradient(135deg, ${feature.gradient.split(' ')[1]} 0%, ${feature.gradient.split(' ')[3]} 100%)`
                      }}
                    />
                    <div className="relative p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-300">
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-4`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Personalities Section */}
            <div className="mt-32">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Choose Your
                  <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    AI Interviewer
                  </span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Each personality has unique questioning style and feedback approach
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {personalities.map((personality, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    className="group cursor-pointer"
                  >
                    <div className={`relative p-6 bg-gradient-to-br ${personality.color} rounded-2xl overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            {personality.icon}
                          </div>
                          <span className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            {personality.role}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{personality.name}</h3>
                        <p className="text-sm text-white/80">{personality.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mt-32"
            >
              <div className="relative p-12 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600" />
                <div className="absolute inset-0 bg-black/20" />
                
                <div className="relative z-10 text-center">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Ready to Start Your Journey?
                  </h2>
                  <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                    Join thousands of successful job seekers who mastered their interviews with us
                  </p>
                  <Link to="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-white text-gray-900 rounded-full text-lg font-medium hover:shadow-2xl transition"
                    >
                      Create Free Account
                      <ArrowRightIcon className="inline h-5 w-5 ml-2" />
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Home;