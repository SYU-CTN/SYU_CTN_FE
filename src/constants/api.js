import axios from 'axios';

// 백엔드 Spring Boot 8080 서버 주소 바인딩
const API_BASE_URL = 'http://localhost:8080/V1';

export const courseApi = {
    // 1. 전체 과목 조회 (기존 연동 데이터)
    getAll: async () => {
        const response = await axios.get(`${API_BASE_URL}/courses`);
        return response.data;
    },

    // 2. 🛠️ [12번 이슈] 신규 과목 등록 파이프라인 (POST)
    create: async (courseData) => {
        const response = await axios.post(`${API_BASE_URL}/courses`, courseData);
        return response.data;
    },

    // 3. 🛠️ [12번 이슈] 기존 과목 수정 파이프라인 (PATCH)
    update: async (id, courseData) => {
        const response = await axios.patch(`${API_BASE_URL}/courses/${id}`, courseData);
        return response.data;
    }
};

export const prerequisiteApi = {
    getAll: async () => {
        const response = await axios.get(`${API_BASE_URL}/prerequisites`);
        return response.data;
    }
};