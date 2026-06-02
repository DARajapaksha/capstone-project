import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, Download, Eye } from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';
import './MyExamsTab.css';


const parseDateSafe = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

const MyExamsTab = () => {
  const navigate = useNavigate();
  const { enrolledExams, loadingDashboard, refreshProfile } = useProfile();

  const exams = useMemo(() => {
    if (!enrolledExams) return [];
    return enrolledExams.map(exam => {
      const formattedDate = parseDateSafe(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return {
        id: exam.id || exam.courseCode,
        courseName: exam.courseName,
        courseCode: exam.courseCode,
        date: formattedDate,
        time: exam.time,
        duration: `${exam.duration * 60} min`,
        status: exam.status || 'upcoming',
        verificationStatus: exam.verificationStatus || 'required',
        badge: exam.verificationStatus === 'verified' ? 'Verified' : 'Verify Required',
        badgeColor: exam.verificationStatus === 'verified' ? 'green' : 'yellow',
        verificationMessage: exam.verificationMessage || 'You must verify your identity before taking this exam',
        verifiedAt: exam.verificationStatus === 'verified' ? 'Verified' : null
      };
    });
  }, [enrolledExams]);

  const handleVerifyIdentity = (examId) => {
    navigate('/verification', { state: { from: '/student', activeTab: 'my-exams' } });
  };

  const handleCancelEnrollment = async (examId) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel enrollment?');
    if (!confirmCancel) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3000/api/user/cancel-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ examId })
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Successfully cancelled enrollment');
        refreshProfile(); // Refresh context profile data to update dashboard and My Exams list
      } else {
        alert(data.error || 'Failed to cancel enrollment');
      }
    } catch (err) {
      console.error('Error cancelling enrollment:', err);
      alert('An error occurred during cancellation');
    }
  };

  const handleViewDetails = (examId) => {
    console.log('View details for exam:', examId);
    alert('Exam details would open here');
  };

  const handleDownloadCertificate = (examId) => {
    console.log('Download certificate for exam:', examId);
    alert('Certificate download started');
  };

  if (loadingDashboard) {
    return <div className="my-exams-tab" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading exams...</div>;
  }

  if (exams.length === 0) {
    return (
      <div className="my-exams-tab">
        <div className="no-exams-message" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#64748b' }}>You haven't enrolled in any exams yet.</p>
          <p className="no-exams-subtitle" style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Browse available exams to get started.</p>
          <button 
            onClick={() => navigate('/student/available')}
            style={{ 
              marginTop: '1.5rem', 
              padding: '0.6rem 1.5rem', 
              background: '#5B47FB', 
              color: '#fff', 
              borderRadius: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            Enroll in Exam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-exams-tab">
      <div className="exams-list">
        {exams.map((exam, index) => (
          <div key={exam.id} className="exam-item">
            <div className="exam-header">
              <div className="exam-title-section">
                <h3 className="exam-name">{exam.courseName}</h3>
                <p className="exam-code">{exam.courseCode}</p>
              </div>

              <div className="exam-badges">
                <span className={`status-label ${exam.status}`}>{exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}</span>
                {exam.badges ? (
                  exam.badges.map((badge, idx) => (
                    <span key={idx} className={`badge-tag ${exam.badgeColors[idx]}`}>
                      {badge}
                    </span>
                  ))
                ) : (
                  <span className={`badge-tag ${exam.badgeColor}`}>{exam.badge}</span>
                )}
              </div>
            </div>

            <div className="exam-details-row">
              <div className="detail-box">
                <p className="detail-label">Date</p>
                <p className="detail-value">{exam.date}</p>
              </div>

              <div className="detail-box">
                <p className="detail-label">Time</p>
                <p className="detail-value">{exam.time}</p>
              </div>

              <div className="detail-box">
                <p className="detail-label">Duration</p>
                <p className="detail-value">{exam.duration}</p>
              </div>

              {exam.verifiedAt && (
                <div className="detail-box">
                  <p className="detail-label">Verified At</p>
                  <p className="detail-value verified">{exam.verifiedAt}</p>
                </div>
              )}

              {exam.score && (
                <div className="detail-box">
                  <p className="detail-label">Score</p>
                  <p className="detail-value score">{exam.score}</p>
                </div>
              )}
            </div>

            {exam.verificationStatus === 'required' && (
              <div className="verification-alert">
                <AlertCircle size={20} className="alert-icon" />
                <div>
                  <p className="alert-title">Identity verification required</p>
                  <p className="alert-message">{exam.verificationMessage}</p>
                </div>
              </div>
            )}

            <div className="exam-actions">
              {exam.status === 'upcoming' && exam.verificationStatus === 'required' && (
                <>
                  <button
                    className="action-button primary verify-btn"
                    onClick={() => handleVerifyIdentity(exam.id)}
                  >
                    Verify Identity Now
                  </button>
                  <button
                    className="action-button secondary cancel-btn"
                    onClick={() => handleCancelEnrollment(exam.id)}
                  >
                    Cancel Enrollment
                  </button>
                </>
              )}

              {exam.status === 'upcoming' && exam.verificationStatus === 'verified' && (
                <div className="exam-actions-verified">
                  <button
                    className="action-button secondary view-details-btn"
                    onClick={() => handleViewDetails(exam.id)}
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                  <button
                    className="action-button secondary cancel-btn"
                    onClick={() => handleCancelEnrollment(exam.id)}
                  >
                    Cancel Enrollment
                  </button>
                </div>
              )}

              {exam.status === 'completed' && (
                <button
                  className="action-button secondary download-btn"
                  onClick={() => handleDownloadCertificate(exam.id)}
                >
                  <Download size={16} />
                  Download Result Certificate
                </button>
              )}
            </div>

            {index < exams.length - 1 && <div className="exam-divider"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyExamsTab;
