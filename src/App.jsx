import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage'; // 🌟 1. 마이페이지 컴포넌트를 불러옵니다!

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 기본 경로로 오면 로그인 페이지로 이동 */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* 🌟 2. 로그인 성공 후 이동할 마이페이지 주소를 등록합니다! */}
                <Route path="/mypage" element={<MyPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;