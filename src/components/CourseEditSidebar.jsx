import React, { useState } from 'react';
import { updateCourse } from '../api/course'; // 우리가 만든 API 함수

/**
 * 교과목 상세 정보 및 수정을 위한 우측 사이드바 컴포넌트
 * @param {boolean} isOpen - 사이드바 열림 상태
 * @param {function} onClose - 사이드바 닫기 함수
 * @param {Object} courseData - 현재 선택된 과목 데이터 (초기값 바인딩용)
 */
const CourseEditSidebar = ({ isOpen, onClose, courseData }) => {
  // 와이어프레임에 맞춰 입력 필드 상태(State) 설계
  const [title, setTitle] = useState(courseData?.title || 'AI를 위한 미적분학');
  const [code, setCode] = useState(courseData?.code || 'E01');
  const [credits, setCredits] = useState(courseData?.credits || '3학점');
  const [grade, setGrade] = useState(courseData?.grade || '1학년');
  const [type, setType] = useState(courseData?.type || '컴공전공');
  const [description, setDescription] = useState(courseData?.description || 'AI를 위한 미적분학의 기초를 학습합니다.');
  const [status, setStatus] = useState('');

  // 사이드바가 닫혀있으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  // 변경사항 저장 버튼 클릭 시 실행될 함수
  const handleSave = async () => {
    setStatus('저장 중...');
    try {
      const updateData = {
        title,
        credits: parseInt(credits), // "3학점"에서 숫자만 추출하는 로직 필요
        description,
        // 나머지 필드도 백엔드 스키마에 맞춰 추가
      };

      // 도연님의 PATCH API 호출!
      const result = await updateCourse(courseData?.id || 1, updateData);

      console.log('저장 성공:', result);
      setStatus('✅ 변경사항이 저장되었습니다.');
      setTimeout(() => onClose(), 1500); // 성공 시 1.5초 후 사이드바 닫기
    } catch (error) {
      setStatus('❌ 저장 실패. 서버를 확인하세요.');
    }
  };

  return (
    <>
      {/* 배경 오버레이 (클릭 시 닫힘) */}
      <div style={overlayStyle} onClick={onClose} />

      {/* 우측 슬라이드 인 사이드바 본체 */}
      <div style={sidebarStyle}>
        {/* 헤더 섹션 */}
        <div style={headerStyle}>
          <div style={titleAreaStyle}>
            <span role="img" aria-label="pencil" style={{marginRight: '10px'}}>✏️</span>
            <strong>과목 편집</strong>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>

        {/* 입력 폼 섹션 (스크롤 가능) */}
        <div style={formAreaStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>과목명</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>과목코드</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} style={disabledInputStyle} disabled />
          </div>

          {/* 이수 완료 체크박스 표시 영역 */}
          <div style={{...formGroupStyle, flexDirection: 'row', alignItems: 'center', gap: '8px', color: '#2ecc71'}}>
            <input type="checkbox" checked style={{width: '18px', height: '18px'}}/>
            <span><strong>이수 완료</strong></span>
          </div>

          <div style={twoColumnStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>학점</label>
              <input type="text" value={credits} onChange={(e) => setCredits(e.target.value)} style={inputStyle} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>학년</label>
              <input type="text" value={grade} onChange={(e) => setGrade(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>구분</label>
            <input type="text" value={type} onChange={(e) => setType(e.target.value)} style={inputStyle} />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>설명</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={textareaStyle} rows="4" />
          </div>

          {/* 선수과목 / 추천 다음 단계 표시 영역 (와이어프레임 참조) */}
          <div style={infoAreaStyle}>
            <div style={infoGroupStyle}>
              <strong>선수과목</strong>
              <div style={tagStyle}>컴퓨터프로그래밍응용, 자료구조</div>
            </div>
            <div style={infoGroupStyle}>
              <strong>추천 다음 단계</strong>
              <div style={boxStyle}>
                <strong>컴퓨터프로그래밍응용</strong>
                <p>1학년 | 컴공전공 | 3학점</p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 섹션 (고정) */}
        <div style={footerStyle}>
          {status && <div style={statusStyle}>{status}</div>}
          <button onClick={handleSave} style={saveButtonStyle}>변경사항 저장</button>
        </div>
      </div>
    </>
  );
};

// 와이어프레임 디자인을 위한 Inline CSS 스타일들 (styles 폴더로 분리 추천)
const overlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 };
const sidebarStyle = { position: 'fixed', top: 0, right: 0, width: '450px', height: '100vh', backgroundColor: '#fff', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 15px rgba(0,0,0,0.2)', transition: 'transform 0.3s ease-out' };
const headerStyle = { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleAreaStyle = { fontSize: '18px', fontWeight: 'bold', color: '#333' };
const closeButtonStyle = { background: 'none', border: 'none', fontSize: '28px', color: '#999', cursor: 'pointer' };
const formAreaStyle = { flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' };
const footerStyle = { padding: '20px', borderTop: '1px solid #eee', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '10px' };

const formGroupStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '14px', color: '#666', fontWeight: 'bold' };
const inputStyle = { padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '15px', width: '100%' };
const textareaStyle = { ...inputStyle, resize: 'none' };
const disabledInputStyle = { ...inputStyle, backgroundColor: '#f5f5f5', color: '#999', borderColor: '#eee' };
const twoColumnStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };

const infoAreaStyle = { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '15px', color: '#333' };
const infoGroupStyle = { display: 'flex', flexDirection: 'column', gap: '5px' };
const tagStyle = { color: '#8e44ad', fontSize: '14px' };
const boxStyle = { border: '1px solid #eee', padding: '15px', borderRadius: '4px', backgroundColor: '#fafafa' };

const statusStyle = { textAlign: 'center', fontSize: '14px', color: '#8e44ad' };
const saveButtonStyle = { padding: '15px', backgroundColor: '#7E57C2', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s' };

export default CourseEditSidebar;