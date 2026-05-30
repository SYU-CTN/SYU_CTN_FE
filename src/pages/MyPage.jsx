import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
    getCurrentLoginId,
    getStudentRecordsKey,
    fetchStudentCourseRecords,
    mergeCurriculumWithRecords,
    saveCourseRecordScore,
} from '../utils/studentRecords.js';

const GRADE_OPTIONS = ['', 'A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+', 'D0', 'F', 'P'];

const MyPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [selectedGrade, setSelectedGrade] = useState(1);
    const [newPassword, setNewPassword] = useState('');
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [curriculumList, setCurriculumList] = useState([]);
    const [userInfo, setUserInfo] = useState({
        name: '',
        loginId: '',
        grade: '',
        department: '',
        email: '',
        phone: '',
        userType: 'STUDENT',
        role: 'STUDENT',
        assignedStudentCount: 0,
        pendingApprovals: 0,
        registeredNotices: 0,
    });

    const refreshCurriculum = async () => {
        const loginId = getCurrentLoginId();
        const records = await fetchStudentCourseRecords(loginId);

        try {
            const response = await api.get('/api/v1/subjects');
            setCurriculumList(mergeCurriculumWithRecords(response.data || [], records));
        } catch (error) {
            console.error('커리큘럼 데이터 로딩 실패:', error);
            setCurriculumList(mergeCurriculumWithRecords([], records));
        }
    };

    useEffect(() => {
        const fetchMyInfo = async () => {
            const currentId = localStorage.getItem('loggedInId');
            if (!currentId) {
                alert('로그인이 필요합니다.');
                navigate('/login');
                return;
            }

            try {
                const response = await api.get(`/api/v1/auth/me?loginId=${currentId}`);
                setUserInfo(prev => ({ ...prev, ...response.data, password: '' }));
            } catch (error) {
                console.error('내 정보 로딩 실패:', error);
                setUserInfo(prev => ({ ...prev, loginId: currentId, role: localStorage.getItem('user_role') || 'STUDENT' }));
            }
        };

        fetchMyInfo();
        refreshCurriculum();

        const handleStorage = () => refreshCurriculum();
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [navigate]);

    const isStaff = userInfo.userType === 'STAFF' || userInfo.role === 'ADMIN' || userInfo.role === 'INSTRUCTOR';
    const completedSubjects = curriculumList.filter(subject => subject.isCompleted === true);
    const totalSubjects = curriculumList.length;
    const incompleteSubjects = totalSubjects - completedSubjects.length;
    const REQUIRED_CREDITS = 85;
    const acquiredCredits = completedSubjects.reduce((sum, subject) => sum + Number(subject.credit ?? subject.credits ?? 0), 0);
    const completionRate = acquiredCredits > 0 ? ((acquiredCredits / REQUIRED_CREDITS) * 100).toFixed(1) : 0;
    const remainingCredits = Math.max(0, REQUIRED_CREDITS - acquiredCredits);

    const filteredLearningSubjects = useMemo(() => {
        return curriculumList.filter(subject => {
            const subjectGrade = Number(subject.gradeLevel ?? subject.grade ?? selectedGrade);
            return subjectGrade === selectedGrade;
        });
    }, [curriculumList, selectedGrade]);

    const handleLogout = async () => {
        if (!window.confirm('로그아웃 하시겠습니까?')) return;
        try {
            await api.post('/api/v1/auth/logout');
        } catch {
            // 로컬 세션 정리는 항상 진행합니다.
        }
        localStorage.removeItem('loggedInId');
        localStorage.removeItem('token');
        localStorage.setItem('user_role', 'STUDENT');
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        const loginId = userInfo.loginId || localStorage.getItem('loggedInId');
        if (!loginId) {
            alert('로그인 정보를 확인할 수 없습니다.');
            navigate('/login');
            return;
        }

        if (!window.confirm('회원탈퇴를 진행하면 계정과 학습 기록을 복구할 수 없습니다. 정말 탈퇴하시겠습니까?')) {
            return;
        }

        const confirmation = window.prompt('회원탈퇴를 진행하려면 "탈퇴"를 입력해주세요.');
        if (confirmation !== '탈퇴') {
            alert('회원탈퇴가 취소되었습니다.');
            return;
        }

        setIsDeletingAccount(true);
        try {
            await api.delete(`/api/v1/auth/me?loginId=${encodeURIComponent(loginId)}`);
            localStorage.removeItem(getStudentRecordsKey(loginId));
            localStorage.removeItem('loggedInId');
            localStorage.removeItem('token');
            localStorage.setItem('user_role', 'STUDENT');
            alert('회원탈퇴가 완료되었습니다.');
            navigate('/login');
        } catch (error) {
            console.error('회원탈퇴 실패:', error);
            const errorMessage = typeof error.response?.data === 'string'
                ? error.response.data
                : (error.response?.data?.message || '회원탈퇴에 실패했습니다.');
            alert(errorMessage);
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async () => {
        if (!newPassword) {
            alert('변경할 새 비밀번호를 입력해주세요.');
            return;
        }

        try {
            await api.put('/api/v1/auth/update-password', {
                loginId: userInfo.loginId,
                password: newPassword,
            });
            alert('비밀번호가 변경되었습니다.');
            setNewPassword('');
        } catch (error) {
            console.error('비밀번호 변경 에러:', error);
            alert(error.response?.data || '비밀번호 변경에 실패했습니다.');
        }
    };

    const handleScoreChange = async (subject, score) => {
        const subjectId = String(subject.subjectId ?? subject.courseId ?? subject.id ?? '');
        setCurriculumList(prev => prev.map(item => {
            const itemId = String(item.subjectId ?? item.courseId ?? item.id ?? '');
            return itemId === subjectId ? { ...item, score } : item;
        }));
        const records = await saveCourseRecordScore(subjectId, score);
        setCurriculumList(prev => mergeCurriculumWithRecords(prev, records));
    };

    const studentStats = [
        { label: '전공 이수 완료 과목', value: `${completedSubjects.length}과목` },
        { label: '전공 요구 학점', value: `${REQUIRED_CREDITS}학점` },
        { label: '전공 취득 학점', value: `${acquiredCredits}학점` },
        { label: '이수율', value: `${completionRate}%` },
        { label: '남은 전공 학점', value: `${remainingCredits}학점` },
    ];

    const staffStats = [
        { label: '담당 학생 수', value: `${userInfo.assignedStudentCount || 0}명` },
        { label: '관리 커리큘럼', value: `${totalSubjects}개` },
        { label: '결재 대기', value: `${userInfo.pendingApprovals || 0}건` },
        { label: '공지사항 등록', value: `${userInfo.registeredNotices || 0}건` },
    ];

    return (
        <div style={styles.pageBackground}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                        {isStaff ? '교직원 마이페이지' : '학생 마이페이지'}
                    </h2>
                    <button onClick={() => navigate('/main')} style={styles.mainButton}>메인페이지</button>
                </div>

                <div style={styles.statsGrid}>
                    {(isStaff ? staffStats : studentStats).map((stat) => (
                        <div key={stat.label} style={styles.statCard}>
                            <div style={styles.statLabel}>{stat.label}</div>
                            <div style={styles.statValue}>{stat.value}</div>
                        </div>
                    ))}
                </div>

                <div style={styles.mainContent}>
                    <div style={styles.leftSidebar}>
                        <div style={{ ...styles.menuCard, border: activeTab === 'profile' ? '2px solid #2d73f5' : '1px solid #eee' }} onClick={() => setActiveTab('profile')}>
                            <h3 style={styles.menuTitle}>{userInfo.name || '사용자'} {isStaff && <span style={styles.staffMark}>(교직원)</span>}</h3>
                            <p style={styles.menuSubText}>{isStaff ? '사번' : '학번'} {userInfo.loginId}</p>
                            <p style={styles.menuSubText}>{isStaff ? userInfo.department : `${userInfo.grade || 0}학년 · ${userInfo.department || ''}`}</p>
                            <p style={{ ...styles.menuSubText, marginTop: '8px', color: '#2d73f5' }}>{userInfo.email}</p>
                        </div>

                        {isStaff ? (
                            <div style={{ ...styles.menuCard, border: activeTab === 'student_manage' ? '2px solid #2d73f5' : '1px solid #eee' }} onClick={() => setActiveTab('student_manage')}>
                                <h3 style={styles.menuTitle}>학생 관리</h3>
                                <p style={styles.menuSubText}>담당 학생 성적 및 이수 조회</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ ...styles.menuCard, border: activeTab === 'learning' ? '2px solid #2d73f5' : '1px solid #eee' }} onClick={() => setActiveTab('learning')}>
                                    <h3 style={styles.menuTitle}>학습 현황</h3>
                                    <p style={styles.menuSubText}>과정 및 이수 현황 조회</p>
                                </div>
                                <div style={{ ...styles.menuCard, border: activeTab === 'grade' ? '2px solid #2d73f5' : '1px solid #eee' }} onClick={() => setActiveTab('grade')}>
                                    <h3 style={styles.menuTitle}>성적 관리</h3>
                                    <p style={styles.menuSubText}>수강 과목 성적 입력 및 조회</p>
                                </div>
                            </>
                        )}

                        <button onClick={handleLogout} style={styles.logoutButton}>로그아웃</button>
                        <button onClick={handleDeleteAccount} style={styles.withdrawButton} disabled={isDeletingAccount}>
                            {isDeletingAccount ? '탈퇴 처리 중...' : '회원탈퇴'}
                        </button>
                    </div>

                    <div style={styles.rightContent}>
                        {activeTab === 'profile' && (
                            <div>
                                <div style={styles.sectionHeader}>
                                    <h3 style={styles.sectionTitle}>개인정보 관리</h3>
                                    <button onClick={handleUpdateProfile} style={styles.editButton}>변경</button>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>이메일</label>
                                    <input name="email" value={userInfo.email || ''} onChange={handleInputChange} style={styles.input} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>전화번호</label>
                                    <input name="phone" value={userInfo.phone || ''} onChange={handleInputChange} style={styles.input} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>소속 {isStaff ? '부서' : '학과'}</label>
                                    <input value={userInfo.department || ''} style={styles.input} disabled />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>비밀번호 변경</label>
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={styles.input} placeholder="새 비밀번호를 입력하세요" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'learning' && !isStaff && (
                            <div>
                                <h3 style={styles.sectionTitle}>학습현황 상세</h3>
                                <div style={styles.gradeTabs}>
                                    {[1, 2, 3, 4].map((grade) => (
                                        <button key={grade} onClick={() => setSelectedGrade(grade)} style={{ ...styles.gradeBtn, backgroundColor: selectedGrade === grade ? '#2d73f5' : '#fff', color: selectedGrade === grade ? '#fff' : '#555' }}>
                                            {grade}학년
                                        </button>
                                    ))}
                                </div>

                                <div style={styles.listContainer}>
                                    {filteredLearningSubjects.length > 0 ? filteredLearningSubjects.map((subject) => (
                                        <div key={subject.subjectId ?? subject.courseId ?? subject.id} style={styles.listItem}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#333' }}>
                                                    {subject.subjectName || subject.title}
                                                    <span style={styles.creditText}>({subject.credit ?? subject.credits ?? 0}학점)</span>
                                                </div>
                                                <p style={styles.itemMeta}>{subject.courseCode || subject.code || ''} {subject.semester ? `· ${subject.semester}학기` : ''}</p>
                                            </div>
                                            <span style={subject.isCompleted ? styles.badgeCompleted : styles.badgeIncomplete}>
                                                {subject.isCompleted ? '이수 완료' : '미이수'}
                                            </span>
                                        </div>
                                    )) : (
                                        <div style={styles.emptyBox}>표시할 과목이 없습니다. 메인페이지에서 과목을 더블클릭하면 수강 완료로 등록됩니다.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'grade' && !isStaff && (
                            <div>
                                <h3 style={styles.sectionTitle}>성적 관리</h3>
                                <div style={styles.listContainer}>
                                    {completedSubjects.length > 0 ? completedSubjects.map((subject) => (
                                        <div key={subject.subjectId ?? subject.courseId ?? subject.id} style={styles.listItem}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#333' }}>{subject.subjectName || subject.title}</div>
                                                <p style={styles.itemMeta}>{subject.courseCode || subject.code || ''} · {subject.credit ?? subject.credits ?? 0}학점</p>
                                            </div>
                                            <div style={styles.gradeInputGroup}>
                                                <select value={subject.score || ''} onChange={(e) => handleScoreChange(subject, e.target.value)} style={styles.gradeSelect}>
                                                    <option value="">성적 미입력</option>
                                                    {GRADE_OPTIONS.filter(Boolean).map(score => <option key={score} value={score}>{score}</option>)}
                                                </select>
                                                <span style={{ fontWeight: 'bold', color: subject.score ? '#2d73f5' : '#94a3b8' }}>{subject.score || '미입력'}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={styles.emptyBox}>성적을 입력할 수강 과목이 없습니다. 메인페이지에서 과목을 더블클릭해 수강 완료로 등록하세요.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'student_manage' && isStaff && (
                            <div>
                                <h3 style={styles.sectionTitle}>학생 통합 관리</h3>
                                <div style={styles.emptyBox}>
                                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>지도 학생 목록 및 성적 조회</p>
                                    <p style={{ marginTop: '10px' }}>학생 관리 API가 연결되면 이곳에 학생 목록이 표시됩니다.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    pageBackground: { backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' },
    container: { maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    mainButton: { padding: '8px 20px', backgroundColor: '#eef2ff', color: '#2d73f5', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
    statsGrid: { display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '40px', width: '100%', boxSizing: 'border-box', flexWrap: 'wrap' },
    statCard: { flex: '1 1 0px', minWidth: '100px', backgroundColor: 'white', padding: '20px 10px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', boxSizing: 'border-box', textAlign: 'center' },
    statLabel: { fontSize: '13px', color: '#555', marginBottom: '10px', fontWeight: 'bold' },
    statValue: { fontSize: '22px', fontWeight: 'bold', color: '#333' },
    mainContent: { display: 'flex', gap: '20px', alignItems: 'flex-start', width: '100%' },
    leftSidebar: { width: '300px', display: 'flex', flexDirection: 'column', gap: '15px', flexShrink: 0 },
    menuCard: { backgroundColor: 'white', padding: '25px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'all 0.2s', minHeight: '130px', boxSizing: 'border-box' },
    menuTitle: { fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#333' },
    menuSubText: { fontSize: '13px', color: '#777', margin: '0 0 4px 0' },
    staffMark: { fontSize: '14px', color: '#2d73f5', marginLeft: '5px' },
    logoutButton: { width: '100%', padding: '15px', backgroundColor: '#fff', color: '#ff4d4f', border: '1px solid #ff4d4f', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    withdrawButton: { width: '100%', padding: '15px', backgroundColor: '#ff4d4f', color: '#fff', border: '1px solid #ff4d4f', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
    rightContent: { flex: 1, backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', minHeight: '520px', boxSizing: 'border-box' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    sectionTitle: { fontSize: '24px', margin: '0 0 20px 0' },
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#333' },
    input: { width: '100%', padding: '15px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' },
    gradeTabs: { display: 'flex', gap: '10px', marginBottom: '25px' },
    gradeBtn: { padding: '8px 18px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
    emptyBox: { padding: '40px', textAlign: 'center', color: '#888', backgroundColor: '#f9f9f9', borderRadius: '8px' },
    editButton: { padding: '8px 20px', backgroundColor: '#eef2ff', color: '#2d73f5', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    listContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '18px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fafafa' },
    creditText: { color: '#888', fontWeight: 'normal', fontSize: '13px', marginLeft: '6px' },
    itemMeta: { margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8' },
    badgeCompleted: { padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#ffe5e5', color: '#ff4d4f' },
    badgeIncomplete: { padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#eef2ff', color: '#2d73f5' },
    gradeInputGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
    gradeSelect: { padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff' },
};

export default MyPage;
