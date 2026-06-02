import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, User } from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';

import ExamCard from '../../components/student/ExamCard';
import './AvailableExams.css';

const AvailableExams = ({ onBack }) => {
  const navigate = useNavigate();
  const { refreshProfile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');


  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('http://localhost:3000/api/user/available-exams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.exams) {
          setExams(data.exams);
        }
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Filter exams based on search query
  const filteredExams = exams.filter((exam) =>
    (exam.courseName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (exam.courseCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (exam.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEnroll = async (examId) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('http://localhost:3000/api/user/enroll-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ examId })
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || `Successfully enrolled in ${exam.courseName}`);
        fetchExams(); // Refresh to update enrollment state
        refreshProfile(); // Refresh profile state to update dashboard and my exams list
      } else {
        alert(data.error || 'Failed to enroll in exam');
      }
    } catch (err) {
      console.error('Error enrolling in exam:', err);
      alert('An error occurred during enrollment');
    }
  };

  return (
    <div className="available-exams-page">
      <div className="exams-header">
        <div className="header-left">
          <div className="header-title-container">
            {onBack && (
              <button className="back-arrow-btn" onClick={onBack} aria-label="Go Back">
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="header-content">
              <h1 className="page-title">Available Exams</h1>
              <p className="page-subtitle">
                Browse and enroll in upcoming exams. Identity verification required for each exam.
              </p>
            </div>
          </div>
        </div>

        <button className="profile-button" onClick={() => navigate('/student/profile')}>
          <User size={18} />
          <span>My Profile</span>
        </button>
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

      <div className="exams-grid">
        {filteredExams.length > 0 ? (
          filteredExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} onEnroll={handleEnroll} />
          ))
        ) : (
          <div className="no-exams-message">
            <p>No exams found matching your search.</p>
            <p className="no-exams-subtitle">Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableExams;
