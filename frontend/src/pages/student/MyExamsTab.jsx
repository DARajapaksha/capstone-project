import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Download, Eye } from 'lucide-react';
import { ref, onValue, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase/firebase';
import './MyExamsTab.css';

const MyExamsTab = () => {
  const navigate = useNavigate();
  const [myExams, setMyExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }

    // Listen to this user's enrollments
    const enrollmentsRef = ref(db, `Enrollments/${user.uid}`);
    const unsubEnrollments = onValue(enrollmentsRef, (enrollSnapshot) => {
      if (!enrollSnapshot.exists()) {
        setMyExams([]);
        setLoading(false);
        return;
      }

      const enrollments = enrollSnapshot.val();
      const examIds = Object.keys(enrollments);

      // Listen to all exams to join data
      const examsRef = ref(db, 'Exams');
      const unsubExams = onValue(examsRef, (examsSnapshot) => {
        setLoading(false);
        const allExams = examsSnapshot.exists() ? examsSnapshot.val() : {};

        const joined = examIds
          .filter(examId => allExams[examId])
          .map(examId => {
          const enrollment = enrollments[examId];
          const exam = allExams[examId];
          return {
            id: examId,
            courseName: exam.courseName || 'Unknown Exam',
            courseCode: exam.courseCode || examId,
            date: exam.date || 'TBD',
            time: exam.time ? `${exam.time}` : 'TBD',
            duration: exam.duration ? `${exam.duration * 60} min` : 'TBD',
            status: 'upcoming',
            verificationStatus: enrollment.verificationStatus || 'pending',
            enrolledAt: enrollment.enrolledAt,
            verifiedAt: enrollment.verifiedAt || null,
          };
        });

        // Sort by exam date
        joined.sort((a, b) => new Date(a.date) - new Date(b.date));
        setMyExams(joined);
      });

      return () => unsubExams();
    });

    return () => unsubEnrollments();
  }, []);

  const handleVerifyIdentity = () => {
    navigate('/verification');
  };

  const handleCancelEnrollment = async (examId) => {
    if (!window.confirm('Are you sure you want to cancel this enrollment?')) return;
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    try {
      const enrollmentRef = ref(db, `Enrollments/${user.uid}/${examId}`);
      await remove(enrollmentRef);
    } catch (err) {
      alert('Failed to cancel enrollment. Please try again.');
      console.error(err);
    }
  };

  const handleViewDetails = (examId) => {
    alert('Exam details coming soon!');
  };

  const handleDownloadCertificate = (examId) => {
    alert('Certificate download started.');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        Loading your exams...
      </div>
    );
  }

  if (myExams.length === 0) {
    return (
      <div className="my-exams-tab">
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'white', borderRadius: '14px',
          border: '2px dashed #e5e7eb'
        }}>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
            You haven't enrolled in any exams yet.
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
            Go to "Available Exams" to browse and enroll.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-exams-tab">
      <div className="exams-list">
        {myExams.map((exam, index) => (
          <div key={exam.id} className="exam-item">
            <div className="exam-header">
              <div className="exam-title-section">
                <h3 className="exam-name">{exam.courseName}</h3>
                <p className="exam-code">{exam.courseCode}</p>
              </div>

              <div className="exam-badges">
                <span className={`status-label ${exam.status}`}>
                  {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                </span>
                <span className={`badge-tag ${exam.verificationStatus === 'verified' ? 'green' : 'yellow'}`}>
                  {exam.verificationStatus === 'verified' ? 'Verified' : 'Verify Required'}
                </span>
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
                  <p className="detail-value verified">
                    {new Date(exam.verifiedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {exam.verificationStatus !== 'verified' && (
              <div className="verification-alert">
                <AlertCircle size={20} className="alert-icon" />
                <div>
                  <p className="alert-title">Identity verification required</p>
                  <p className="alert-message">You must verify your identity before taking this exam</p>
                </div>
              </div>
            )}

            <div className="exam-actions">
              {exam.verificationStatus !== 'verified' && (
                <>
                  <button
                    className="action-button primary verify-btn"
                    onClick={handleVerifyIdentity}
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

              {exam.verificationStatus === 'verified' && (
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
            </div>

            {index < myExams.length - 1 && <div className="exam-divider"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyExamsTab;
