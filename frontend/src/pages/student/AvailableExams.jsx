import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, User, Calendar, Clock, MapPin } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase/firebase';
import './AvailableExams.css';

const AvailableExams = ({ onBack }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);

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
      const { ref: dbRef, set, serverTimestamp } = await import('firebase/database');
      const enrollmentRef = dbRef(db, `Enrollments/${user.uid}/${examId}`);
      await set(enrollmentRef, {
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          Loading exams...
        </div>
      ) : (
        <div className="exams-grid">
          {filteredExams.length > 0 ? (
            filteredExams.map((exam) => (
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
                  className={`enroll-btn ${exam.status !== 'Open' ? 'enroll-btn-disabled' : ''}`}
                  onClick={() => handleEnroll(exam.id)}
                  disabled={exam.status !== 'Open' || enrolling === exam.id}
                >
                  {enrolling === exam.id ? 'Enrolling...' : exam.status === 'Full' ? 'Exam Full' : exam.status === 'Cancelled' ? 'Cancelled' : 'Enroll Now'}
                </button>
                <p className="identity-note">Identity verification required</p>
              </div>
            ))
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
