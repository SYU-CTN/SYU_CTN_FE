import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage';

import MainPage from './pages/main-page.jsx';
import AdminDashboard from './constants/admin-dashboard.jsx';
import CurriculumChatPage from './pages/CurriculumChatPage';
import './styles/App.css';

function CurriculumManager({ initialView = 'main' }) {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(() => {
        const savedRole = localStorage.getItem('user_role');
        return savedRole === 'ADMIN' || savedRole === 'INSTRUCTOR';
    });
    const [view, setView] = useState(initialView);
    const [loginOpen, setLoginOpen] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const savedRole = localStorage.getItem('user_role');
            setIsAdmin(savedRole === 'ADMIN' || savedRole === 'INSTRUCTOR');
        };
        const interval = setInterval(checkAuth, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleLoginSubmit = () => {
        localStorage.setItem('user_role', 'ADMIN');
        setIsAdmin(true);
        setLoginOpen(false);
    };

    const handleLogout = () => {
        localStorage.setItem('user_role', 'STUDENT');
        setIsAdmin(false);
        setView('main');
    };

    return (
        <div className="w-full text-left box-border" style={{ width: '100vw', textAlign: 'left' }}>
            {view === 'main' ? (
                <MainPage
                    isAdmin={isAdmin}
                    onSwitchToChat={() => navigate('/chat')}
                    onSwitchToAdmin={() => setView('admin')}
                    onLogout={handleLogout}
                />
            ) : (
                <AdminDashboard
                    onSwitchToMain={() => setView('main')}
                    onLogout={handleLogout}
                />
            )}

            {!isAdmin && (
                <div className="fixed right-4 top-3 z-[100000] flex gap-2">
                    <button
                        onClick={() => navigate('/mypage')}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg shadow-slate-900/5 transition-colors hover:bg-slate-50"
                    >
                        마이페이지
                    </button>
                    <button
                        onClick={() => setLoginOpen(true)}
                        className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-700"
                    >
                        관리자 로그인
                    </button>
                </div>
            )}

            {loginOpen && (
                <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-[340px] rounded-xl border border-violet-100 bg-white p-6 shadow-[0_24px_80px_rgba(88,28,135,0.28)]">
                        <h3 className="text-base font-bold text-slate-900">최고 관리자 인증</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">테스트 관리자 권한으로 전환합니다.</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button onClick={() => setLoginOpen(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100">취소</button>
                            <button onClick={handleLoginSubmit} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 transition-colors hover:bg-violet-700">인증 완료</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 기존 로그인/회원가입/마이페이지 라우트 */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/mypage" element={<MyPage />} />

                {/* 메인/관리자 커리큘럼 화면 */}
                <Route path="/main" element={<CurriculumManager />} />
                <Route path="/admin" element={<CurriculumManager initialView="admin" />} />

                {/* 커리큘럼 채팅 페이지 */}
                <Route path="/chat" element={<CurriculumChatPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
