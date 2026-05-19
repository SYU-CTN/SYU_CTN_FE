import React, { useState } from 'react';
import { LogIn, X, AlertCircle } from 'lucide-react';

// ============================================================
// 로그인 모달
// 데모 계정: admin / admin
// ============================================================
export default function LoginModal({ open, onLogin, onClose }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!open) return null;

    const handleSubmit = () => {
        // TODO: 실제 백엔드 API 연동 시 fetch('/api/login') 등으로 교체
        if (username === 'admin' && password === 'admin') {
            onLogin();
            setError('');
            setUsername('');
            setPassword('');
        } else {
            setError('아이디 또는 비밀번호가 올바르지 않습니다');
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
            style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{ animation: 'modalIn 0.2s ease-out' }}
            >
                <style>{`@keyframes modalIn { from { opacity:0; transform: translateY(-8px) scale(0.98);} to { opacity:1; transform: translateY(0) scale(1);} }`}</style>

                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                            <LogIn size={15} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">관리자 로그인</h2>
                            <p className="text-[11px] text-slate-500">계정 정보를 입력하세요</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                        <X size={15} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">아이디</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="admin"
                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="••••••"
                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                        />
                    </div>
                    {error && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
                            <AlertCircle size={12} />
                            {error}
                        </div>
                    )}
                    <div className="text-[11px] text-slate-400 bg-slate-50 rounded-md px-3 py-2 leading-relaxed">
                        <span className="font-medium text-slate-600">데모 계정</span><br />
                        아이디: <span className="font-mono">admin</span> · 비밀번호: <span className="font-mono">admin</span>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={handleSubmit}
                        className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                    >
                        로그인
                    </button>
                </div>
            </div>
        </div>
    );
}
