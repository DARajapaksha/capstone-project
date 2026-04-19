import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Download, Eye } from 'lucide-react';
import './MyExamsTab.css';

const MyExamsTab = () => {
  const [exams] = useState([
    {
      id: 1,
      courseName: 'Advanced Mathematics Final',
      courseCode: 'MATH-401',
      date: 'March 15, 2026',
      time: '10:00 AM - 12:00 PM',
      duration: '120 min',
      status: 'upcoming',
      verificationStatus: 'required',
      badge: 'Verify Required',
      badgeColor: 'yellow',
      verificationMessage: 'You must verify your identity before taking this exam',
    },
    {
      id: 2,
      courseName: 'Computer Science Midterm',
      courseCode: 'CS-302',
      date: 'March 20, 2026',
      time: '2:00 PM - 4:00 PM',
      duration: '120 min',
      status: 'upcoming',
      verificationStatus: 'verified',
      badge: 'Verified',
      badgeColor: 'green',
      verifiedAt: 'March 5, 2026',
    },
    {
      id: 3,
      courseName: 'Physics Lab Exam',
      courseCode: 'PHY-201',
      date: 'February 28, 2026',
      time: '9:00 AM - 11:00 AM',
      duration: '120 min',
      status: 'completed',
      verificationStatus: 'verified',
      badges: ['Verified'],
      badgeColors: ['green'],
      score: '92%',
    },
  ]);

  const handleVerifyIdentity = (examId) => {
    console.log('Verify identity for exam:', examId);
    alert('Identity verification flow would open here');
  };

  const handleCancelEnrollment = (examId) => {
    console.log('Cancel enrollment for exam:', examId);
    alert('Are you sure you want to cancel enrollment?');
  };

  const handleViewDetails = (examId) => {
    console.log('View details for exam:', examId);
    alert('Exam details would open here');
  };

  const handleDownloadCertificate = (examId) => {
    console.log('Download certificate for exam:', examId);
    alert('Certificate download started');
  };

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
