import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import VerificationFlow from './pages/student/VerificationFlow';
import BlockchainStatus from './pages/admin/BlockchainStatus';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-dark-900 font-sans text-slate-200 selection:bg-brand-500 selection:text-white">
                <Routes>
                    <Route path="/verify" element={<VerificationFlow />} />
                    <Route path="/status" element={<BlockchainStatus />} />

                    {/* Default Route */}
                    <Route path="*" element={<Navigate to="/verify" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
