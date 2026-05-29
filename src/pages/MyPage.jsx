import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const MyPage = () => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('profile');
    const [selectedGrade, setSelectedGrade] = useState(1);

    // 🌟 사용자 정보 상태 (교직원 통계용 기본값 추가)
    const [userInfo, setUserInfo] = useState({
        name: '',
        loginId: '',
        grade: '',
        department: '',
        email: '',
        phone: '',
        password: '',
        userType: 'STUDENT',
        role: 'STUDENT', // 안전한 권한 체크를 위해 role 추가
        assignedStudentCount: 0, // 관리자 통계용
        pendingApprovals: 0,     // 관리자 통계용
        registeredNotices: 0     // 관리자 통계용
    });

    const [newPassword, setNewPassword] = useState('');

    // 커리큘럼(과목) DB 데이터를 담을 상태
    const [curriculumList, setCurriculumList] = useState([]);

    useEffect(() => {
        // 1. 내 정보 불러오기
        const fetchMyInfo = async () => {
            try {
                const currentId = localStorage.getItem('loggedInId');
                if (!currentId) {
                    alert("로그인이 필요한 서비스입니다.");
                    navigate('/login');
                    return;
                }

                // 백엔드 주소 규격에 맞게 앞에 /api/v1 추가
                const response = await api.get(`/api/v1/auth/me?loginId=${currentId}`);
                setUserInfo(prev => ({
                    ...prev,
                    ...response.data,
                    password: ''
                }));
            } catch (error) {
                console.error("데이터 로딩 실패:", error);
            }
        };

        // 2. 커리큘럼 DB 데이터 불러오기 함수
        const fetchCurriculum = async () => {
            try {
                // 백엔드 API 명세에 맞춰 엔드포인트 수정
                const response = await api.get('/api/v1/subjects');
                setCurriculumList(response.data);
            } catch (error) {
                console.error("커리큘럼 데이터 로딩 실패:", error);
            }
        };

        fetchMyInfo();
        fetchCurriculum();
    }, [navigate]);

    // userType이 STAFF이거나 role이 ADMIN일 때 모두 교직원으로 완벽하게 인식
    const isStaff = userInfo.userType === 'STAFF' || userInfo.userType === '교직원' || userInfo.role === 'ADMIN';

    const handleLogout = async () => {
        if (window.confirm("로그아웃 하시겠습니까?")) {
            try {
                await api.post('/api/v1/auth/logout');
                localStorage.removeItem('loggedInId');
                localStorage.removeItem('token');
                alert("안전하게 로그아웃 되었습니다.");
                navigate('/login');
            } catch (error) {
                localStorage.removeItem('loggedInId');
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async () => {
        if (!newPassword) {
            alert('변경할 새로운 비밀번호를 입력해주세요.');
            return;
        }

        try {
            const submitData = {
                loginId: userInfo.loginId,
                password: newPassword
            };

            await api.put('/api/v1/auth/update-password', submitData);
            alert('비밀번호가 성공적으로 변경되었습니다.');
            setNewPassword('');
        } catch (error) {
            console.error('비밀번호 변경 에러:', error);
            const errorMessage = error.response?.data || '비밀번호 변경에 실패했습니다.';
            alert(errorMessage);
        }
    };

    // ==========================================
    // 📈 [학생용] 실시간 통계 데이터 계산 로직
    // ==========================================
    const totalSubjects = curriculumList.length;
    // DB에서 받아온 isCompleted 값으로 이수 완료 여부 파악
    const completedSubjects = curriculumList.filter(subject => subject.isCompleted === true).length;
    const incompleteSubjects = totalSubjects - completedSubjects;

    const REQUIRED_CREDITS = 85; // 총 요구 학점 고정

    // 취득 학점 합산 (기존 코드의 subject.credit 필드 사용)
    const acquiredCredits = curriculumList
        .filter(subject => subject.isCompleted === true)
        .reduce((sum, subject) => sum + (subject.credit || 0), 0);

    const completionRate = acquiredCredits > 0
        ? ((acquiredCredits / REQUIRED_CREDITS) * 100).toFixed(1)
        : 0;

    const remainingCredits = Math.max(0, REQUIRED_CREDITS - acquiredCredits);

    const studentStats = [
        { label: '전체 과목 수', value: `${totalSubjects}과목` },
        { label: '이수 완료', value: `${completedSubjects}과목` },
        { label: '미이수', value: `${incompleteSubjects}과목` },
        { label: '총 요구 학점', value: `${REQUIRED_CREDITS}학점` },
        { label: '취득 학점', value: `${acquiredCredits}학점` },
        { label: '이수율', value: `${completionRate}%` },
        { label: '남은 학점', value: `${remainingCredits}학점` },
    ];

    // ==========================================
    // 👨‍💼 [교직원용] 실시간 통계 데이터 로직
    // ==========================================
    const staffStats = [
        { label: '담당 학생 수', value: `${userInfo.assignedStudentCount || 0}명` },
        { label: '관리 커리큘럼', value: `${totalSubjects}개` }, // 전체 커리큘럼 개수 연동
        { label: '결재 대기', value: `${userInfo.pendingApprovals || 0}건` },
        { label: '공지사항 등록', value: `${userInfo.registeredNotices || 0}건` },
    ];

    const displayStats = isStaff ? staffStats : studentStats;

    return (
        <div style={styles.pageBackground}>
            <div style={styles.container}>

                <div style={styles.header}>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                        {isStaff ? '👨‍💼 교직원 마이페이지' : '🧑‍🎓 학생 마이페이지'}
                    </h2>
                    <button onClick={() => navigate('/home')} style={styles.mainButton}>메인페이지</button>
                </div>

                {/* 🌟 다이내믹 상단 통계 그리드 */}
                <div style={styles.statsGrid}>
                    {displayStats.map((stat, index) => (
                        <div key={index} style={styles.statCard}>
                            <div style={styles.statLabel}>{stat.label}</div>
                            <div style={styles.statValue}>{stat.value}</div>
                        </div>
                    ))}
                </div>

                <div style={styles.mainContent}>

                    {/* 왼쪽 사이드바 영역 (개인정보 DB 연동) */}
                    <div style={styles.leftSidebar}>
                        <div
                            style={{ ...styles.menuCard, border: activeTab === 'profile' ? '2px solid #2d73f5' : '1px solid #eee' }}
                            onClick={() => setActiveTab('profile')}
                        >
                            <h3 style={styles.menuTitle}>
                                {userInfo.name || '로딩 중...'}
                                {isStaff && <span style={{ fontSize: '14px', color: '#2d73f5', marginLeft: '5px' }}>(교직원)</span>}
                            </h3>
                            <p style={styles.menuSubText}>{isStaff ? '사번' : '학번'} {userInfo.loginId}</p>
                            <p style={styles.menuSubText}>
                                {isStaff ? userInfo.department : `${userInfo.grade || 0}학년 · ${userInfo.department}`}
                            </p>
                            <p style={{ ...styles.menuSubText, marginTop: '8px', color: '#2d73f5' }}>{userInfo.email}</p>
                        </div>

                        {isStaff ? (
                            <>
                                <div
                                    style={{ ...styles.menuCard, border: activeTab === 'student_manage' ? '2px solid #2d73f5' : '1px solid #eee' }}
                                    onClick={() => setActiveTab('student_manage')}
                                >
                                    <h3 style={styles.menuTitle}>학생 관리</h3>
                                    <p style={styles.menuSubText}>담당 학생 성적 및 이수 조회</p>
                                </div>
                                <div
                                    style={{ ...styles.menuCard, border: activeTab === 'curriculum_manage' ? '2px solid #2d73f5' : '1px solid #eee' }}
                                    onClick={() => setActiveTab('curriculum_manage')}
                                >
                                    <h3 style={styles.menuTitle}>커리큘럼 관리</h3>
                                    <p style={styles.menuSubText}>과목 개설 및 수정</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    style={{ ...styles.menuCard, border: activeTab === 'learning' ? '2px solid #2d73f5' : '1px solid #eee' }}
                                    onClick={() => setActiveTab('learning')}
                                >
                                    <h3 style={styles.menuTitle}>학습 현황</h3>
                                    <p style={styles.menuSubText}>과정 및 이수 현황 조회</p>
                                </div>
                                <div
                                    style={{ ...styles.menuCard, border: activeTab === 'grade' ? '2px solid #2d73f5' : '1px solid #eee' }}
                                    onClick={() => setActiveTab('grade')}
                                >
                                    <h3 style={styles.menuTitle}>성적 관리</h3>
                                    <p style={styles.menuSubText}>학기별 평점 및 성적 조회</p>
                                </div>
                            </>
                        )}

                        <button onClick={handleLogout} style={styles.logoutButton}>로그아웃</button>
                    </div>

                    {/* 오른쪽 메인 콘텐츠 표시 영역 */}
                    <div style={styles.rightContent}>

                        {/* 1. 공통: 개인정보 관리 */}
                        {activeTab === 'profile' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '24px', margin: 0 }}>개인정보 관리</h3>
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
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={styles.input} placeholder="새로운 비밀번호를 입력하세요" />
                                </div>
                            </div>
                        )}

                        {/* 2. 학생 전용: 학습현황 */}
                        {activeTab === 'learning' && !isStaff && (
                            <div>
                                <h3 style={{ fontSize: '24px', margin: '0 0 20px 0' }}>학습현황 상세</h3>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                                    {[1, 2, 3, 4].map((grade) => (
                                        <button key={grade} onClick={() => setSelectedGrade(grade)} style={{ ...styles.gradeBtn, backgroundColor: selectedGrade === grade ? '#2d73f5' : '#fff', color: selectedGrade === grade ? '#fff' : '#555' }}>
                                            {grade}학년
                                        </button>
                                    ))}
                                </div>

                                <div style={styles.listContainer}>
                                    {curriculumList.length > 0 ? (
                                        curriculumList.map((subject) => (
                                            <div key={subject.subjectId} style={styles.listItem}>
                                                <div style={{ fontWeight: 'bold', color: '#333' }}>
                                                    {subject.subjectName} <span style={{ color: '#888', fontWeight: 'normal', fontSize: '13px' }}>({subject.credit}학점)</span>
                                                </div>
                                                <span style={subject.isRequired ? styles.badgeRequired : styles.badgeElective}>
                                                    {subject.isRequired ? '전공필수' : '전공선택'}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={styles.emptyBox}>등록된 커리큘럼 데이터가 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. 학생 전용: 성적 관리 */}
                        {activeTab === 'grade' && !isStaff && (
                            <div>
                                <h3 style={{ fontSize: '24px', margin: '0 0 20px 0' }}>성적 관리</h3>
                                <div style={styles.listContainer}>
                                    {curriculumList.length > 0 ? (
                                        curriculumList.map((subject) => (
                                            <div key={subject.subjectId} style={styles.listItem}>
                                                <div style={{ fontWeight: 'bold', color: '#333' }}>{subject.subjectName}</div>
                                                <span style={{ fontWeight: 'bold', color: '#2d73f5' }}>성적 미입력</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={styles.emptyBox}>조회 가능한 성적 데이터가 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 4. 교직원 전용: 학생 관리 */}
                        {activeTab === 'student_manage' && isStaff && (
                            <div>
                                <h3 style={{ fontSize: '24px', margin: '0 0 20px 0' }}>학생 통합 관리</h3>
                                <div style={styles.emptyBox}>
                                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>지도 학생 목록 및 성적 조회</p>
                                    <p style={{ marginTop: '10px' }}>학생 관리 API가 연결되면 이곳에 학생 목록이 렌더링됩니다.</p>
                                </div>
                            </div>
                        )}

                        {/* 5. 교직원 전용: 커리큘럼 관리 */}
                        {activeTab === 'curriculum_manage' && isStaff && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '24px', margin: 0 }}>커리큘럼 관리</h3>
                                    <button style={styles.editButton}>+ 새 과목 등록</button>
                                </div>
                                <div style={styles.listContainer}>
                                    {curriculumList.length > 0 ? (
                                        curriculumList.map((subject) => (
                                            <div key={subject.subjectId} style={styles.listItem}>
                                                <div style={{ fontWeight: 'bold', color: '#333' }}>
                                                    {subject.subjectName} <span style={{ color: '#888', fontWeight: 'normal', fontSize: '13px' }}>({subject.credit}학점)</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <span style={subject.isRequired ? styles.badgeRequired : styles.badgeElective}>
                                                        {subject.isRequired ? '전공필수' : '전공선택'}
                                                    </span>
                                                    <button style={styles.smallActionBtn}>수정</button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={styles.emptyBox}>등록된 커리큘럼 데이터가 없습니다.</div>
                                    )}
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
    menuCard: { backgroundColor: 'white', padding: '25px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'all 0.2s', height: '150px', boxSizing: 'border-box' },
    menuTitle: { fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#333' },
    menuSubText: { fontSize: '13px', color: '#777', margin: '0 0 4px 0' },
    logoutButton: { width: '100%', padding: '15px', backgroundColor: '#fff', color: '#ff4d4f', border: '1px solid #ff4d4f', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    rightContent: { flex: 1, backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', minHeight: '520px', boxSizing: 'border-box' },
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#333' },
    input: { width: '100%', padding: '15px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' },
    gradeBtn: { padding: '8px 18px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
    emptyBox: { padding: '40px', textAlign: 'center', color: '#888', backgroundColor: '#f9f9f9', borderRadius: '8px' },
    editButton: { padding: '8px 20px', backgroundColor: '#eef2ff', color: '#2d73f5', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },

    listContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fafafa' },
    badgeRequired: { padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#ffe5e5', color: '#ff4d4f' },
    badgeElective: { padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#eef2ff', color: '#2d73f5' },
    smallActionBtn: { padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }
};

export default MyPage;
