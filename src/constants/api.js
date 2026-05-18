// ============================================================
// Tree Navigator API 클라이언트
// 위치: client/src/constants/api.js
// ============================================================

const API_BASE_URL = 'http://localhost:8080/V1/api';

// ===== 공통 fetch 래퍼 =====
async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API 요청 실패: ${response.status}`);
    }

    // 204 No Content 응답이면 null 반환
    if (response.status === 204) return null;
    return response.json();
}

// ============================================================
// 과목 API
// ============================================================
export const courseApi = {
    /** 전체 과목 조회 */
    getAll: () => apiFetch('/courses'),

    /** 학년별 조회 */
    getByGrade: (grade) => apiFetch(`/courses?grade=${grade}`),

    /** 카테고리별 조회 */
    getByCategory: (category) => apiFetch(`/courses?category=${encodeURIComponent(category)}`),

    /** 키워드 검색 */
    search: (keyword) => apiFetch(`/courses?keyword=${encodeURIComponent(keyword)}`),

    /** 단일 조회 */
    getById: (id) => apiFetch(`/courses/${id}`),

    /** 추가 */
    create: (course) => apiFetch('/courses', {
        method: 'POST',
        body: JSON.stringify(course),
    }),

    /** 수정 */
    update: (id, course) => apiFetch(`/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(course),
    }),

    /** 삭제 */
    delete: (id) => apiFetch(`/courses/${id}`, {
        method: 'DELETE',
    }),
};

// ============================================================
// 선수관계 API
// ============================================================
export const prerequisiteApi = {
    /** 전체 조회 */
    getAll: () => apiFetch('/prerequisites'),

    /** 특정 과목의 선수 과목들 */
    getPrereqsOf: (courseId) => apiFetch(`/prerequisites/of/${courseId}/prereqs`),

    /** 특정 과목의 후속 과목들 */
    getNextOf: (courseId) => apiFetch(`/prerequisites/of/${courseId}/next`),

    /** 추가 */
    create: (preCourseId, postCourseId) => apiFetch('/prerequisites', {
        method: 'POST',
        body: JSON.stringify({ preCourseId, postCourseId }),
    }),

    /** id로 삭제 */
    delete: (id) => apiFetch(`/prerequisites/${id}`, {
        method: 'DELETE',
    }),

    /** 쌍으로 삭제 */
    deleteByPair: (preId, postId) =>
        apiFetch(`/prerequisites?preId=${preId}&postId=${postId}`, {
            method: 'DELETE',
        }),
};

// ============================================================
// 사용 예시 (React 컴포넌트 안에서)
// ============================================================
//
// import { courseApi, prerequisiteApi } from './constants/api.js';
//
// useEffect(() => {
//   const fetchData = async () => {
//     try {
//       const courses = await courseApi.getAll();
//       const prerequisites = await prerequisiteApi.getAll();
//       // 백엔드 응답 형식에 맞게 state에 저장
//       // courses: [{ id, code, title, credits, grade, semester, category }, ...]
//       // prerequisites: [{ id, preCourseId, postCourseId, ... }, ...]
//     } catch (error) {
//       console.error('API 오류:', error);
//     }
//   };
//   fetchData();
// }, []);