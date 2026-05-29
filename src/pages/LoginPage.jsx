import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const normalizeRole = (loginResult) => {
    const rawRole = typeof loginResult === 'object' && loginResult !== null
        ? loginResult.role || loginResult.userType || loginResult.authority
        : null;
    const upperRole = String(rawRole || 'STUDENT').toUpperCase();

    if (upperRole === 'STAFF' || upperRole === 'INSTRUCTOR' || upperRole === 'ADMIN') {
        return upperRole === 'STAFF' ? 'INSTRUCTOR' : upperRole;
    }

    return 'STUDENT';
};

const LoginPage = () => {
    const navigate = useNavigate();
    const [loginData, setLoginData] = useState({
        loginId: '',
        password: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/v1/auth/login', loginData);
            const loginResult = response.data;
            const role = normalizeRole(loginResult);

            if (loginResult && typeof loginResult === 'object' && loginResult.accessToken) {
                localStorage.setItem('token', loginResult.accessToken);
            }

            localStorage.setItem('loggedInId', loginData.loginId);
            localStorage.setItem('user_role', role);
            navigate('/main');
        } catch (error) {
            const errorMessage = typeof error.response?.data === 'string'
                ? error.response.data
                : (error.response?.data?.message || '로그인 정보를 확인해주세요.');
            alert(errorMessage);
        }
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <span style={{ fontSize: '40px' }}>🎓</span>
                    <h2 style={styles.title}>커리큘럼 트리 네비게이터</h2>
                </div>

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>학번/사번</label>
                        <input name="loginId" style={styles.input} placeholder="학번 또는 사번을 입력하세요" onChange={handleInputChange} required />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>비밀번호</label>
                        <input name="password" type="password" style={styles.input} placeholder="비밀번호를 입력하세요" onChange={handleInputChange} required />
                    </div>

                    <button type="submit" style={styles.loginButton}>로그인</button>
                    <button type="button" onClick={() => navigate('/signup')} style={styles.signupButton}>회원가입</button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    pageContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%', backgroundColor: '#f9f9f9' },
    card: { width: '450px', backgroundColor: '#ffffff', padding: '50px 40px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' },
    header: { marginBottom: '30px' },
    title: { fontSize: '22px', fontWeight: 'bold', color: '#333', marginTop: '15px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' },
    label: { fontSize: '13px', color: '#888' },
    input: { padding: '15px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none' },
    loginButton: { padding: '15px', backgroundColor: '#2d73f5', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    signupButton: { padding: '15px', backgroundColor: '#ffffff', color: '#333', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }
};

export default LoginPage;
