import React from 'react';
import './ExamCard.css';
import { Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';

const ExamCard = ({ exam, onEnroll }) => {
  let btnText = 'Enroll Now';
  if (exam.status === 'Full') btnText = 'Exam Full';
  if (exam.status === 'Enrolled') btnText = 'Already Enrolled';

  const disabled = exam.status === 'Full' || exam.status === 'Enrolled';

  return (
    <div className="exam-card">
      <div className="exam-card-header">
        <div className="exam-code">{exam.courseCode}</div>
        <div className={`exam-badge status-${exam.status}`}>{exam.status}</div>
      </div>

      <h3 className="exam-title">{exam.courseName}</h3>
      <p className="exam-description">{exam.description}</p>

      <div className="exam-details">
        <div className="detail-item">
          <Calendar size={18} />
          <span>{new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        <div className="detail-item">
          <Clock size={18} />
          <span>{exam.time} • {exam.duration} hours</span>
        </div>

        <div className="detail-item">
          <MapPin size={18} />
          <span>{exam.proctoring}</span>
        </div>
      </div>

      <button 
        className={`enroll-button status-${exam.status}`} 
        onClick={() => !disabled && onEnroll(exam.id)}
        disabled={disabled}
      >
        {exam.status === 'Enrolled' && <CheckCircle size={16} />}
        {btnText}
      </button>

      <p className="verification-text">Identity verification required</p>
    </div>
  );
};

export default ExamCard;
