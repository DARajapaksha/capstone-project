import React from 'react';

const StudentDashboard = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#1e293b' }}>Student Exam Portal</h1>
      <div style={{ 
        border: '1px solid #e2e8f0', 
        padding: '20px', 
        borderRadius: '8px',
        backgroundColor: '#f8fafc'
      }}>
        <h2>Available Exams</h2>
        <ul>
          <li>Final Year Capstone - 10:00 AM</li>
          <li>Machine Learning Quiz - 02:00 PM</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentDashboard;