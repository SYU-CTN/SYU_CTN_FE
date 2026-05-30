import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || "http://localhost:8080";/**
 * 교과목 정보 수정 (PATCH) API 연동 함수
 * @param {number} courseId - 수정할 교과목의 고유 ID (예: 1)
 * @param {Object} updateData - 수정할 데이터 뭉치 (예: { title: "새로운 교과목명", credits: 3 })
 */
export const updateCourse = async (courseId, updateData) => {
  try {
    // 백엔드의 PATCH /api/courses/{id} 엔드포인트를 호출합니다.
    const response = await axios.patch(`${API_BASE_URL}/api/courses/${courseId}`, updateData);

    // 수정이 성공하면 백엔드가 돌려준 최신 데이터 결과를 반환합니다.
    return response.data;
  } catch (error) {
    console.error("프론트엔드 에러 - 교과목 정보 수정 실패:", error);
    throw error;
  }
};