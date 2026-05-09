import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { 
  HomeIcon,
  PlayIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BriefcaseIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  CalendarIcon,
  TrophyIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ReportPDF from '../components/ReportPDF';

const InterviewReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const componentRef = useRef();

  useEffect(() => {
    fetchInterviewDetails();
  }, [id]);

  const fetchInterviewDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/interview/${id}`);
      console.log('Interview details:', response.data);
      
      if (response.data.success) {
        setInterview(response.data.data);
      } else {
        setError('Failed to load interview details');
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      setError(error.response?.data?.error || 'Failed to load interview details');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Interview_Report_${interview?.jobRole || 'interview'}_${new Date().toISOString().split('T')[0]}`,
    onBeforeGetContent: () => {
      setIsPrinting(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
    pageStyle: `
      @media print {
        @page {
          size: A4;
          margin: 1.5cm;
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `
  });

  const navigationItems = [
    { name: 'Dashboard', icon: <HomeIcon className="h-5 w-5" />, path: '/' },
    { name: 'New Interview', icon: <PlayIcon className="h-5 w-5" />, path: '/interview-config' },
    { name: 'History', icon: <ClockIcon className="h-5 w-5" />, path: '/history' },
    { name: 'Reports', icon: <ChartBarIcon className="h-5 w-5" />, path: '/reports', active: true },
  ];

  const getScoreColor = (score) => {
    if (!score || score === 0) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (!score || score === 0) return 'bg-gray-500/20';
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  // Calculate overall score from questions if not available
  const calculateOverallScore = () => {
    if (!interview) return 0;
    
    if (interview.report?.overallScore && interview.report.overallScore > 0) {
      return interview.report.overallScore;
    }
    
    if (interview.questions && interview.questions.length > 0) {
      const scores = interview.questions.filter(q => q.score && q.score > 0).map(q => q.score);
      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return Math.round(avg);
      }
    }
    
    return 0;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1E] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Loading interview report...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1E] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ {error || 'Interview not found'}</div>
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  const overallScore = calculateOverallScore();
  const strengths = interview.report?.strengths || [];
  const improvements = interview.report?.improvements || [];
  const questions = interview.questions || [];
  const communicationScore = interview.report?.communicationScore || overallScore;
  const technicalScore = interview.report?.technicalScore || overallScore;
  const confidenceLevel = interview.report?.confidenceLevel || 'Unknown';
  const summary = interview.report?.summary || 'No summary available';

  return (
    <div className="fixed inset-0 bg-[#0A0F1E] text-white flex overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Left Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-64 border-r border-white/10 bg-white/5 backdrop-blur-xl flex flex-col relative z-10 flex-shrink-0"
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <BriefcaseIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Interview Pro
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item, index) => (
            <motion.button
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                item.active
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </motion.button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4 mb-3">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-5xl mx-auto p-8">
          {/* Header with Back Button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              <span>Back to History</span>
            </button>
            
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Interview Report
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                    {interview.personality}
                  </span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                    {interview.difficulty}
                  </span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    {interview.status === 'completed' ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </div>
              
              {/* Score Circle */}
              <div className="text-center">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center ${getScoreBg(overallScore)} border-4 border-white/20`}>
                  <div>
                    <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                      {Math.round(overallScore)}%
                    </div>
                    <div className="text-xs text-gray-400">Overall Score</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Interview Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <BriefcaseIcon className="h-5 w-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Job Role</span>
              </div>
              <p className="text-lg font-semibold mt-1">{interview.jobRole}</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Date & Time</span>
              </div>
              <p className="text-sm font-semibold mt-1">{formatDate(interview.createdAt)}</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Duration</span>
              </div>
              <p className="text-lg font-semibold mt-1">{formatDuration(interview.duration)}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <SparklesIcon className="h-5 w-5 text-purple-400" />
                <span className="text-gray-400 text-sm">Confidence</span>
              </div>
              <p className="text-lg font-semibold mt-1">{confidenceLevel}</p>
            </div>
          </motion.div>

          {/* Communication & Technical Scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-blue-400">Communication Score</h3>
                <span className="text-2xl font-bold text-blue-400">{Math.round(communicationScore)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${communicationScore}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Clarity, articulation, and professional communication</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-green-400">Technical Score</h3>
                <span className="text-2xl font-bold text-green-400">{Math.round(technicalScore)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${technicalScore}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Technical knowledge and depth of understanding</p>
            </div>
          </motion.div>

          {/* Summary Section */}
          {summary && summary !== 'No summary available' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
            >
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <DocumentTextIcon className="h-6 w-6 text-yellow-400" />
                Interview Summary
              </h2>
              <p className="text-gray-300 leading-relaxed">{summary}</p>
            </motion.div>
          )}

          {/* Strengths & Improvements */}
          {(strengths.length > 0 || improvements.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
            >
              {strengths.length > 0 && (
                <div className="bg-green-500/10 backdrop-blur-xl border border-green-500/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrophyIcon className="h-5 w-5 text-green-400" />
                    <h3 className="font-semibold text-green-400">Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircleIcon className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {improvements.length > 0 && (
                <div className="bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <SparklesIcon className="h-5 w-5 text-yellow-400" />
                    <h3 className="font-semibold text-yellow-400">Areas for Improvement</h3>
                  </div>
                  <ul className="space-y-2">
                    {improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <XCircleIcon className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* Question Breakdown */}
          {questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-400" />
                Question Breakdown
              </h2>
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium">
                          Q{idx + 1}
                        </span>
                        {q.score > 0 && (
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getScoreBg(q.score)}`}>
                            Score: {q.score}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-white font-medium mb-3">{q.question}</p>
                    
                    {q.userAnswer && (
                      <div className="mt-3 p-3 bg-blue-500/10 rounded-xl">
                        <p className="text-xs text-blue-400 mb-1">Your Answer:</p>
                        <p className="text-sm text-gray-300">{q.userAnswer}</p>
                      </div>
                    )}
                    
                    {q.feedback && (
                      <div className="mt-3 p-3 bg-purple-500/10 rounded-xl">
                        <p className="text-xs text-purple-400 mb-1">AI Feedback:</p>
                        <p className="text-sm text-gray-300">{q.feedback}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recommendations */}
          {interview.report?.recommendations && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-5"
            >
              <h3 className="font-semibold text-blue-400 mb-2">Recommendations</h3>
              <p className="text-gray-300 text-sm">{interview.report.recommendations}</p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex gap-4 mt-8"
          >
            <button
              onClick={() => navigate('/interview-config')}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium hover:opacity-90 transition"
            >
              Start New Interview
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-6 py-3 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20 transition disabled:opacity-50"
            >
              {isPrinting ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating PDF...
                </>
              ) : (
                'Download PDF Report'
              )}
            </button>
          </motion.div>
        </div>
      </main>

      {/* Hidden PDF component - positioned off-screen to be printable */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', height: 0, overflow: 'hidden' }}>
        <ReportPDF
          ref={componentRef}
          interview={interview}
          overallScore={overallScore}
          communicationScore={communicationScore}
          technicalScore={technicalScore}
          confidenceLevel={confidenceLevel}
          summary={summary}
          strengths={strengths}
          improvements={improvements}
          questions={questions}
        />
      </div>

      <style jsx>{`
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

export default InterviewReport;