import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage';

import CurriculumChatPage from './pages/CurriculumChatPage';
import './styles/App.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 질문자님이 만드신 기존 페이지들 */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/mypage" element={<MyPage />} />

                {/* 💡 팀원분이 만든 채팅 페이지를 라우터에 추가 */}
                <Route path="/chat" element={<CurriculumChatPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;