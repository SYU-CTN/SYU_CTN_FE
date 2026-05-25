import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { MainPage } from './pages/main-page.jsx';
import AdminDashboard from './constants/admin-dashboard.jsx';
import LoginModal from './constants/login-modal.jsx';

// ============================================================
// 최상위 App - 로그인 상태와 화면 전환 관리
// ============================================================
export default function App() {
    const [isAdmin, setIsAdmin] = useState(false);   // 관리자 로그인 여부
    const [view, setView] = useState('main');        // 'main' | 'admin'
    const [loginOpen, setLoginOpen] = useState(false);

    const handleLogin = () => {
        setIsAdmin(true);
        setLoginOpen(false);
    };

    const handleLogout = () => {
        setIsAdmin(false);
        setView('main');
    };

    return (
        <>
            {view === 'main' && (
                <>
                    <MainPage
                        isAdmin={isAdmin}
                        onSwitchToAdmin={() => setView('admin')}
                        onLogout={handleLogout}
                    />
                    {/* 비로그인 상태일 때만 우측 상단에 로그인 버튼 노출 */}
                    {!isAdmin && (
                        <button
                            onClick={() => setLoginOpen(true)}
                            className="fixed top-4 right-4 z-50 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-lg flex items-center gap-1.5 transition-colors"
                            style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}
                        >
                            <LogIn size={13} />
                            관리자 로그인
                        </button>
                    )}
                </>
            )}

            {view === 'admin' && isAdmin && (
                <AdminDashboard
                    onSwitchToMain={() => setView('main')}
                    onLogout={handleLogout}
                />
            )}

            <LoginModal
                open={loginOpen}
                onLogin={handleLogin}
                onClose={() => setLoginOpen(false)}
            />
        </>
    );
}
