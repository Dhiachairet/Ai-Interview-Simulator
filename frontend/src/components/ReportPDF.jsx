import React from 'react';
import { 
  BriefcaseIcon, 
  CalendarIcon, 
  ClockIcon, 
  TrophyIcon, 
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const ReportPDF = React.forwardRef(({ interview, overallScore, communicationScore, technicalScore, confidenceLevel, summary, strengths, improvements, questions }, ref) => {
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

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  const getPersonalityColor = (personality) => {
    switch(personality) {
      case 'Strict Technical': return '#3b82f6';
      case 'Friendly HR': return '#10b981';
      case 'Stress Tester': return '#ef4444';
      case 'Theoretical Expert': return '#8b5cf6';
      default: return '#6366f1';
    }
  };

  const personalityColor = getPersonalityColor(interview?.personality);

  // Separate page break style for PDF printing
  const pageBreakStyle = {
    pageBreakBefore: 'avoid',
    pageBreakInside: 'avoid',
    breakInside: 'avoid'
  };

  return (
    <div ref={ref} className="pdf-report" style={{ 
      fontFamily: 'Arial, Helvetica, sans-serif',
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '40px',
      backgroundColor: 'white',
      color: '#1f2937'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: `3px solid ${personalityColor}`, paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e293b' }}>
          AI Interview Pro
        </h1>
        <h2 style={{ fontSize: '20px', margin: '0', color: '#475569' }}>
          Interview Performance Report
        </h2>
      </div>

      {/* Interview Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0', color: personalityColor }}>
          {interview?.personality || 'Friendly HR'} Interviewer
        </h3>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '5px 0 0 0' }}>
          {interview?.jobRole || 'Frontend Developer'} • {interview?.difficulty || 'medium'} difficulty
        </p>
      </div>

      {/* Score Section - Centered with SVG */}
      <div style={{ textAlign: 'center', marginBottom: '40px', ...pageBreakStyle }}>
        <div style={{ display: 'inline-block', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '140px', height: '140px' }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke={getScoreColor(overallScore)}
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 60}
                strokeDashoffset={2 * Math.PI * 60 * (1 - overallScore / 100)}
                transform="rotate(-90 70 70)"
              />
              <text x="70" y="78" textAnchor="middle" fontSize="24" fontWeight="bold" fill={getScoreColor(overallScore)}>
                {Math.round(overallScore)}%
              </text>
            </svg>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginTop: '12px' }}>Overall Score</p>
        </div>
      </div>

      {/* Metrics Grid - Separated cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '20px', 
        marginBottom: '40px',
        ...pageBreakStyle
      }}>
        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <BriefcaseIcon style={{ width: '28px', height: '28px', margin: '0 auto 10px', color: '#3b82f6' }} />
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Job Role</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '6px 0 0 0' }}>{interview?.jobRole || 'Frontend Developer'}</p>
        </div>
        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <CalendarIcon style={{ width: '28px', height: '28px', margin: '0 auto 10px', color: '#3b82f6' }} />
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Date</p>
          <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '6px 0 0 0' }}>{formatDate(interview?.createdAt)}</p>
        </div>
        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <ClockIcon style={{ width: '28px', height: '28px', margin: '0 auto 10px', color: '#3b82f6' }} />
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Duration</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '6px 0 0 0' }}>{formatDuration(interview?.duration)}</p>
        </div>
        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <SparklesIcon style={{ width: '28px', height: '28px', margin: '0 auto 10px', color: '#3b82f6' }} />
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Confidence</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '6px 0 0 0' }}>{confidenceLevel || 'High'}</p>
        </div>
      </div>

      {/* Communication & Technical Scores - Side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px', ...pageBreakStyle }}>
        <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb' }}>Communication Score</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>{Math.round(communicationScore)}%</span>
          </div>
          <div style={{ backgroundColor: '#bfdbfe', borderRadius: '10px', height: '10px' }}>
            <div style={{ width: `${communicationScore}%`, backgroundColor: '#3b82f6', borderRadius: '10px', height: '10px' }} />
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px' }}>Clarity, articulation, and professionalism</p>
        </div>
        <div style={{ backgroundColor: '#ecfdf5', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669' }}>Technical Score</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>{Math.round(technicalScore)}%</span>
          </div>
          <div style={{ backgroundColor: '#a7f3d0', borderRadius: '10px', height: '10px' }}>
            <div style={{ width: `${technicalScore}%`, backgroundColor: '#10b981', borderRadius: '10px', height: '10px' }} />
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px' }}>Technical knowledge and depth</p>
        </div>
      </div>

      {/* Summary - Separated card */}
      {summary && summary !== 'No summary available' && (
        <div style={{ marginBottom: '40px', ...pageBreakStyle }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b', borderLeft: `4px solid ${personalityColor}`, paddingLeft: '12px' }}>
            Interview Summary
          </h4>
          <div style={{ backgroundColor: '#fefce8', padding: '20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#334155', margin: 0 }}>{summary}</p>
          </div>
        </div>
      )}

      {/* Strengths & Improvements - Side by side cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px', ...pageBreakStyle }}>
        {strengths && strengths.length > 0 && (
          <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <TrophyIcon style={{ width: '22px', height: '22px', color: '#22c55e' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#166534' }}>Top Strengths</h4>
            </div>
            <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none' }}>
              {strengths.map((strength, idx) => (
                <li key={idx} style={{ fontSize: '12px', marginBottom: '10px', color: '#14532d', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <CheckCircleIcon style={{ width: '16px', height: '16px', flexShrink: 0, color: '#22c55e' }} />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {improvements && improvements.length > 0 && (
          <div style={{ backgroundColor: '#fefce8', padding: '20px', borderRadius: '12px', border: '1px solid #fde047' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <SparklesIcon style={{ width: '22px', height: '22px', color: '#eab308' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#854d0e' }}>Areas for Improvement</h4>
            </div>
            <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none' }}>
              {improvements.map((improvement, idx) => (
                <li key={idx} style={{ fontSize: '12px', marginBottom: '10px', color: '#713f12', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <XCircleIcon style={{ width: '16px', height: '16px', flexShrink: 0, color: '#eab308' }} />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Question Breakdown - Section separated */}
      {questions && questions.length > 0 && (
        <div style={{ marginBottom: '40px', ...pageBreakStyle }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b', borderLeft: `4px solid ${personalityColor}`, paddingLeft: '12px' }}>
            Question Breakdown
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {questions.map((q, idx) => (
              <div key={idx} style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ 
                  backgroundColor: '#f8fafc', 
                  padding: '12px 20px', 
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: personalityColor }}>
                    Question {idx + 1}
                  </span>
                  {q.score && q.score > 0 && (
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      padding: '2px 8px',
                      borderRadius: '20px',
                      backgroundColor: q.score >= 80 ? '#dcfce7' : q.score >= 60 ? '#fef9c3' : '#fee2e2',
                      color: q.score >= 80 ? '#16a34a' : q.score >= 60 ? '#ca8a04' : '#dc2626'
                    }}>
                      Score: {q.score}%
                    </span>
                  )}
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 16px 0', color: '#1e293b' }}>{q.question}</p>
                  
                  {q.userAnswer && q.userAnswer !== 'No answer provided' && (
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', margin: '0 0 6px 0' }}>Your Answer:</p>
                      <div style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '8px' }}>
                        <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: '1.5' }}>{q.userAnswer}</p>
                      </div>
                    </div>
                  )}
                  
                  {q.feedback && q.feedback !== 'No feedback available' && (
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#8b5cf6', margin: '0 0 6px 0' }}>Feedback:</p>
                      <div style={{ backgroundColor: '#faf5ff', padding: '12px', borderRadius: '8px' }}>
                        <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: '1.5' }}>{q.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px', 
        paddingTop: '20px', 
        borderTop: '1px solid #e2e8f0',
        fontSize: '10px',
        color: '#94a3b8'
      }}>
        <p>Generated by AI Interview Pro • {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
});

ReportPDF.displayName = 'ReportPDF';

export default ReportPDF;