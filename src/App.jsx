import React, { useState, useEffect } from 'react';
import MainPage from './pages/main-page.jsx'; // 💡 경로 매핑 체크

function App() {
    // 💡 [핵심] 브라우저 스토리지를 검사해 관리자 여부를 정석대로 초기화합니다.
    const [isAdmin, setIsAdmin] = useState(() => {
        const savedRole = localStorage.getItem('user_role');
        return savedRole === 'ADMIN' || savedRole === 'INSTRUCTOR';
    });

    const [view, setView] = useState('main');
    const [loginOpen, setLoginOpen] = useState(false);

    // 로그인 핸들러: 클릭하는 순간 스토리지를 채우고 상태를 강제 동기화합니다.
    const handleLoginSubmit = () => {
        localStorage.setItem('user_role', 'ADMIN');
        setIsAdmin(true);
        setLoginOpen(false);
    };

    // 로그아웃 핸들러: 권한을 학생으로 완전히 격리 격하합니다.
    const handleLogout = () => {
        localStorage.setItem('user_role', 'STUDENT');
        setIsAdmin(false);
        setView('main');
    };

    return (
        <div className="relative min-h-screen">
            {/* 🎯 중요: 부모가 들고 있는 진짜 isAdmin 상태값을 MainPage에 확실하게 꽂아줍니다! */}
            <MainPage
                isAdmin={isAdmin}
                onSwitchToAdmin={() => setView('admin')}
                onLogout={handleLogout}
            />

            {/* 🔒 화면 우측 상단 유령 레이어 방지형 로그인 버튼 제어 */}
            {!isAdmin && (
                <button
                    onClick={() => setLoginOpen(true)}
                    className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-md transition-all"
                >
                    관리자 로그인
                </button>
            )}

            {/* 팝업형 임시 로그인 모달 */}
            {loginOpen && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xl w-[320px]">
                        <h3 className="text-sm font-bold text-slate-800 mb-4">🔐 최고 관리자 인증</h3>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">프로젝트 매니저 전용 테스트 계정으로 간편 로그인 처리를 수행합니다.</p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setLoginOpen(false)} className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">취소</button>
                            <button onClick={handleLoginSubmit} className="px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm">인증 완료</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;