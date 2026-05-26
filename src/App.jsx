import React, { useState, useEffect } from 'react';
import MainPage from './pages/main-page.jsx';
import AdminDashboard from './constants/admin-dashboard.jsx';

function App() {
    const [isAdmin, setIsAdmin] = useState(() => {
        const savedRole = localStorage.getItem('user_role');
        return savedRole === 'ADMIN' || savedRole === 'INSTRUCTOR';
    });
    const [view, setView] = useState('main');
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
        /* 🎯 [팀원 코드 보호 레이어]
          팀원분이 #root에 걸어둔 width: 2000px과 text-align: center 스타일이
          하위 컴포넌트로 침범하지 못하도록, 최상단에서 스타일을 강제로 초기화(w-full text-left)해 줍니다!
        */
        <div className="w-full text-left box-border" style={{ width: '100vw', textAlign: 'left' }}>

            {view === 'main' ? (
                <MainPage
                    isAdmin={isAdmin}
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
                <button
                    onClick={() => setLoginOpen(true)}
                    className="fixed right-4 top-4 z-[100000] rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-700"
                >
                    관리자 로그인
                </button>
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

export default App;
