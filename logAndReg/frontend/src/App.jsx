import React, { useState } from 'react';
import Auth from './pages/Auth';
import VerificationPage from './pages/VerificationPage';

function App() {
  // This state tracks which page to show
  const [currentPage, setCurrentPage] = useState('auth');

  // Function to handle successful login
  const handleLoginSuccess = () => {
    setCurrentPage('verification');
  };

  return (
    <div className="min-h-screen">
      {currentPage === 'auth' ? (
        <Auth onLogin={handleLoginSuccess} />
      ) : (
        <VerificationPage />
      )}
    </div>
  );
}

export default App;