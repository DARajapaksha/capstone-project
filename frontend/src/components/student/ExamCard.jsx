import React from 'react';
import './ExamCard.css';
import { Calendar, Clock, MapPin } from 'lucide-react';

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

const ExamCard = ({ exam, onEnroll }) => {
  const isEnrolled = exam.isEnrolled;
  const isFull = exam.isFull || (exam.enrolled || 0) >= (exam.capacity || 0);
  const badgeText = isEnrolled ? 'Enrolled' : (isFull ? 'Full' : 'Open');
  
  let buttonText = 'Enroll Now';
  let isDisabled = false;
  const buttonStyle = {};

  if (isEnrolled) {
    buttonText = 'Enrolled';
    isDisabled = true;
    buttonStyle.background = '#E2E8F0';
    buttonStyle.color = '#64748B';
    buttonStyle.cursor = 'not-allowed';
  } else if (isFull) {
    buttonText = 'Exam Full';
    isDisabled = true;
    buttonStyle.background = '#F1F5F9';
    buttonStyle.color = '#94A3B8';
    buttonStyle.cursor = 'not-allowed';
  }

  const badgeStyle = {};
  if (badgeText === 'Enrolled') {
    badgeStyle.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
  } else if (badgeText === 'Open') {
    badgeStyle.background = 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)';
  }

  return (
    <div className={`exam-card ${badgeText.toLowerCase()}`}>
      <div className="exam-card-header">
        <div className="exam-code">{exam.courseCode}</div>
        <div className="exam-badge" style={badgeStyle}>{badgeText}</div>
      </div>

      <h3 className="exam-title">{exam.courseName}</h3>
      <p className="exam-description">{exam.description}</p>

      <div className="exam-details">
        <div className="detail-item">
          <Calendar size={18} />
          <span>{parseDateSafe(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
        className="enroll-button" 
        onClick={() => onEnroll(exam.id)} 
        disabled={isDisabled}
        style={buttonStyle}
      >
        {buttonText}
      </button>

      <p className="verification-text">Identity verification required</p>
    </div>
  );
};

export default ExamCard;
