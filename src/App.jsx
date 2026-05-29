import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage';

import MainPage from './pages/main-page.jsx';
import AdminDashboard from './constants/admin-dashboard.jsx';
import CurriculumChatPage from './pages/CurriculumChatPage';
import './styles/App.css';

const isAdminRole = (role) => role === 'ADMIN' || role === 'INSTRUCTOR' || role === 'STAFF';

function CurriculumManager({ initialView = 'main' }) {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(() => isAdminRole(localStorage.getItem('user_role')));
    const [view, setView] = useState(() => initialView === 'admin' && isAdminRole(localStorage.getItem('user_role')) ? 'admin' : 'main');

    useEffect(() => {
        const checkAuth = () => {
            const nextIsAdmin = isAdminRole(localStorage.getItem('user_role'));
            setIsAdmin(nextIsAdmin);
            if (!nextIsAdmin) setView('main');
        };
        checkAuth();
        const interval = setInterval(checkAuth, 1000);
        window.addEventListener('storage', checkAuth);
        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', checkAuth);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInId');
        localStorage.setItem('user_role', 'STUDENT');
        setIsAdmin(false);
        setView('main');
        navigate('/login');
    };

    return (
        <div className="w-full text-left box-border" style={{ width: '100vw', textAlign: 'left' }}>
            {view === 'admin' && isAdmin ? (
                <AdminDashboard
                    onSwitchToMain={() => setView('main')}
                    onLogout={handleLogout}
                />
            ) : (
                <MainPage
                    isAdmin={isAdmin}
                    onSwitchToChat={() => navigate('/chat')}
                    onSwitchToAdmin={isAdmin ? () => setView('admin') : undefined}
                    onLogout={handleLogout}
                />
            )}
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/mypage" element={<MyPage />} />

                <Route path="/main" element={<CurriculumManager />} />
                <Route path="/admin" element={<CurriculumManager initialView="admin" />} />

                <Route path="/chat" element={<CurriculumChatPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
