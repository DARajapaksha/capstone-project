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
  const [enrollments, setEnrollments] = useState({});

  // Fetch Exams and Enrollments from REST API
  useEffect(() => {
    const fetchData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      const token = localStorage.getItem('token');

      try {
        // Fetch all exams
        const examsRes = await fetch(`http://${window.location.hostname}:5000/api/exam`);
        if (examsRes.ok) {
          const examsData = await examsRes.json();
          setExams(examsData.exams || []);
        }

        // Fetch user's enrollments if logged in
        if (user && token) {
          const userRes = await fetch(`http://${window.location.hostname}:5000/api/user/home`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            const enrolledDict = {};
            const upcoming = userData.myExams?.upcoming || [];
            const past = userData.myExams?.past || [];
            [...upcoming, ...past].forEach(ex => {
              enrolledDict[ex.id] = { verificationStatus: ex.verificationStatus || 'pending' };
            });
            setEnrollments(enrolledDict);
          }
        }
      } catch (err) {
        console.error("Error loading exams:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter exams based on search query
  const filteredExams = exams.filter((exam) =>
    exam.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.courseCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEnroll = async (examId) => {
    const token = localStorage.getItem('token');
    if (!token) {
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
      const res = await fetch(`http://${window.location.hostname}:5000/api/user/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ examId })
      });

      if (res.ok) {
        navigate('/verification', { state: { examId: exam.id, examCode: exam.courseCode } });
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to enroll.');
      }
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
