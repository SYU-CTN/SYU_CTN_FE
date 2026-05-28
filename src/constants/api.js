import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/V1';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

export const courseApi = {
    getAll: async () => {
        const response = await apiClient.get('/api/courses');
        return response.data;
    },

    create: async (courseData) => {
        const response = await apiClient.post('/api/courses', courseData);
        return response.data;
    },

    update: async (id, courseData) => {
        try {
            const response = await apiClient.patch(`/api/courses/${id}`, courseData);
            return response.data;
        } catch (error) {
            if (error.response?.status !== 404 && error.response?.status !== 405) {
                throw error;
            }
            const response = await apiClient.put(`/api/courses/${id}`, courseData);
            return response.data;
        }
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/api/courses/${id}`);
        return response.data;
    },
};

export const prerequisiteApi = {
    getAll: async () => {
        const response = await apiClient.get('/api/prerequisites');
        return response.data;
    },

    create: async (preCourseId, postCourseId) => {
        const response = await apiClient.post('/api/prerequisites', { preCourseId, postCourseId });
        return response.data;
    },

    deleteByPair: async (preCourseId, postCourseId) => {
        const response = await apiClient.delete('/api/prerequisites', { data: { preCourseId, postCourseId } });
        return response.data;
    },
};
