import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, User, Calendar, Clock, MapPin } from 'lucide-react';
import { ref, onValue, set as dbSet } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase/firebase';
import './AvailableExams.css';

const AvailableExams = ({ onBack }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [enrollments, setEnrollments] = useState({});

  // Real-time listener on Firebase /Exams node
  useEffect(() => {
    const auth = getAuth();
    let unsubscribeDb = null;
    
    // Wait for Firebase Auth to initialize before fetching data
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        // Still initializing or actually logged out. Don't fetch yet.
        return; 
      }

      const examsRef = ref(db, 'Exams');
      
      // Clean up previous listener if it exists
      if (unsubscribeDb) unsubscribeDb();

      unsubscribeDb = onValue(examsRef, (snapshot) => {
        setLoading(false);
        if (!snapshot.exists()) {
          setExams([]);
          return;
        }
        const data = snapshot.val();
        const examsList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by date ascending
        examsList.sort((a, b) => new Date(a.date) - new Date(b.date));
        setExams(examsList);
      }, (error) => {
        console.error("Firebase read error (Exams):", error);
        setLoading(false);
        alert("Error loading exams from database. Check Firebase security rules.");
      });

      // Fetch user's enrollments
      const enrollmentsRef = ref(db, `Enrollments/${user.uid}`);
      onValue(enrollmentsRef, (enrollSnap) => {
        if (enrollSnap.exists()) {
          setEnrollments(enrollSnap.val());
        } else {
          setEnrollments({});
        }
      });
    });

    // Cleanup listener on unmount
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeDb) unsubscribeDb();
    };
  }, []);

  // Filter exams based on search query
  const filteredExams = exams.filter((exam) =>
    exam.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.courseCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEnroll = async (examId) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in to enroll.');
      return;
    }

    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;

    if (exam.status === 'Full' || exam.status === 'Cancelled') {
      alert(`Cannot enroll: exam is ${exam.status}.`);
      return;
    }

    setEnrolling(examId);
    try {
      // Write enrollment to Firebase
      const enrollmentRef = ref(db, `Enrollments/${user.uid}/${examId}`);
      await dbSet(enrollmentRef, {
        examId,
        enrolledAt: new Date().toISOString(),
        verificationStatus: 'pending',
        studentId: user.uid,
        studentEmail: user.email
      });
      navigate('/verification', { state: { examId: exam.id, examCode: exam.courseCode } });
    } catch (err) {
      console.error('Enrollment error:', err);
      alert('Failed to enroll. Please try again.');
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div className="available-exams-page">
      <div className="exams-header">
        <div className="header-left">
          <div className="top-actions">
            {onBack && (
              <button className="back-button" onClick={onBack}>
                <ArrowLeft size={20} />
                <span>Back</span>
              </button>
            )}
            <button className="profile-button" onClick={() => navigate('/student/profile')}>
              <User size={18} />
              <span>My Profile</span>
            </button>
          </div>
          <div className="header-content">
            <h1 className="page-title">Available Exams</h1>
            <p className="page-subtitle">
              Browse and enroll in upcoming exams. Identity verification required for each exam.
            </p>
          </div>
        </div>
      </div>

      <div className="search-bar-card">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search exams by name, code, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          Loading exams...
        </div>
      ) : (
        <div className="exams-grid">
          {filteredExams.length > 0 ? (
            filteredExams.map((exam) => {
              const myEnrollment = enrollments[exam.id];
              const isEnrolled = !!myEnrollment;
              const statusVal = myEnrollment?.verificationStatus || 'pending';
              const verified = isEnrolled && statusVal === 'verified';
              const rejected = isEnrolled && statusVal === 'rejected';
              const pending = isEnrolled && statusVal === 'pending';

              let buttonText = 'Enroll Now';
              let buttonDisabled = exam.status !== 'Open' || enrolling === exam.id;
              let buttonAction = () => handleEnroll(exam.id);
              let buttonClass = `enroll-btn ${exam.status !== 'Open' ? 'enroll-btn-disabled' : ''}`;
              
              if (verified) {
                buttonText = 'Verified';
                buttonDisabled = true;
                buttonClass = 'enroll-btn enroll-btn-verified bg-[#00C950] opacity-100 cursor-default';
              } else if (rejected) {
                buttonText = 'Retry Verification';
                buttonDisabled = false;
                buttonClass = 'enroll-btn enroll-btn-rejected bg-[#DC2626]';
                buttonAction = () => navigate('/verification', { state: { examId: exam.id, examCode: exam.courseCode } });
              } else if (pending) {
                buttonText = 'Complete Verification';
                buttonDisabled = false;
                buttonClass = 'enroll-btn enroll-btn-pending bg-[#F0B100]';
                buttonAction = () => navigate('/verification', { state: { examId: exam.id, examCode: exam.courseCode } });
              } else if (enrolling === exam.id) {
                buttonText = 'Enrolling...';
              } else if (exam.status === 'Full') {
                buttonText = 'Exam Full';
              } else if (exam.status === 'Cancelled') {
                buttonText = 'Cancelled';
              }

              return (
                <div key={exam.id} className="exam-card">
                  <div className="exam-card-header">
                    <span className="course-code-badge">{exam.courseCode}</span>
                    <span className={`status-pill ${exam.status === 'Full' ? 'full' : exam.status === 'Cancelled' ? 'cancelled' : 'open'}`}>
                      {exam.status?.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="exam-card-title">{exam.courseName}</h3>
                  <p className="exam-card-desc">{exam.description}</p>
                  <div className="exam-card-details">
                    <span><Calendar size={14} /> {exam.date}</span>
                    <span><Clock size={14} /> {exam.time} &bull; {exam.duration}h</span>
                    <span><MapPin size={14} /> {exam.proctoring}</span>
                  </div>
                  <button
                    className={buttonClass}
                    onClick={buttonAction}
                    disabled={buttonDisabled}
                  >
                    {buttonText}
                  </button>
                  <p className="identity-note">
                    {verified ? 'Identity verification successful' : 
                     rejected ? 'Identity verification required (Previous attempt failed)' : 
                     'Identity verification required'}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="no-exams-message">
              <p>No exams found{searchQuery ? ' matching your search' : ''}.</p>
              {searchQuery && <p className="no-exams-subtitle">Try a different search term.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailableExams;
