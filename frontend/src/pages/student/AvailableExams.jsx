import React, { useState } from 'react';
import { Search, ArrowLeft, User } from 'lucide-react';
import ExamCard from '../../components/student/ExamCard';
import './AvailableExams.css';

const AvailableExams = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock exam data - will be replaced with Firebase later
  const [exams] = useState([
    {
      id: 1,
      courseCode: 'MATH-401',
      courseName: 'Advanced Mathematics Final',
      description: 'Comprehensive final exam covering calculus, linear algebra, and differential equations.',
      date: '2026-03-15',
      time: '10:00 AM',
      duration: 3,
      proctoring: 'Online Proctored',
      status: 'Full',
    },
    {
      id: 2,
      courseCode: 'CS-302',
      courseName: 'Computer Science Theory',
      description: 'Exam on algorithms, data structures, and computational complexity.',
      date: '2026-03-18',
      time: '2:00 PM',
      duration: 2.5,
      proctoring: 'Online Proctored',
      status: 'Full',
    },
    {
      id: 3,
      courseCode: 'MKT-201',
      courseName: 'Digital Marketing Fundamentals',
      description: 'Assessment of digital marketing strategies, SEO, and social media marketing.',
      date: '2026-03-20',
      time: '9:00 AM',
      duration: 2,
      proctoring: 'Online Proctored',
      status: 'Full',
    },
    {
      id: 4,
      courseCode: 'DS-501',
      courseName: 'Data Science with Python',
      description: 'Practical exam on data analysis, machine learning, and Python programming.',
      date: '2026-03-22',
      time: '11:00 AM',
      duration: 4,
      proctoring: 'Online Proctored',
      status: 'Full',
    },
    {
      id: 5,
      courseCode: 'LAW-301',
      courseName: 'Business Law & Ethics',
      description: 'Examination covering business regulations, contracts, and professional ethics.',
      date: '2026-03-25',
      time: '1:00 PM',
      duration: 2,
      proctoring: 'Online Proctored',
      status: 'Full',
    },
    {
      id: 6,
      courseCode: 'WEB-401',
      courseName: 'Web Development Certification',
      description: 'Assessment including React, Node.js, databases, and full-stack development.',
      date: '2026-03-28',
      time: '3:00 PM',
      duration: 3,
      proctoring: 'Online Proctored',
      status: 'Full',
    },
  ]);

  // Filter exams based on search query
  const filteredExams = exams.filter((exam) =>
    exam.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEnroll = (examId) => {
    const exam = exams.find((e) => e.id === examId);
    console.log('Enrolling in exam:', exam);
    // TODO: Firebase enrollment logic will go here
    alert(`Successfully enrolled in ${exam.courseName}`);
  };

  return (
    <div className="available-exams-page">
      <div className="exams-header">
        <div className="header-left">
          {onBack && (
            <button className="back-button" onClick={onBack}>
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
          )}
          <div className="header-content">
            <h1 className="page-title">Available Exams</h1>
            <p className="page-subtitle">
              Browse and enroll in upcoming exams. Identity verification required for each exam.
            </p>
          </div>
        </div>

        <button className="profile-button">
          <User size={18} />
          <span>My Profile</span>
        </button>
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
