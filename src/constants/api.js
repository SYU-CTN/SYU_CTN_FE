import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const courseApi = {
    getAll: async () => {
        const response = await apiClient.get('/api/v1/courses');
        return response.data;
    },

    create: async (courseData) => {
        const response = await apiClient.post('/api/v1/courses', courseData);
        return response.data;
    },

    update: async (id, courseData) => {
        try {
            const response = await apiClient.patch(`/api/v1/courses/${id}`, courseData);
            return response.data;
        } catch (error) {
            if (error.response?.status !== 404 && error.response?.status !== 405) {
                throw error;
            }
            const response = await apiClient.put(`/api/v1/courses/${id}`, courseData);
            return response.data;
        }
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/api/v1/courses/${id}`);
        return response.data;
    },

    uploadSyllabus: async (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`/api/v1/courses/${id}/syllabus`, formData);
        return response.data;
    },
};

export const prerequisiteApi = {
    getAll: async () => {
        const response = await apiClient.get('/api/v1/prerequisites');
        return response.data;
    },

    create: async (preCourseId, postCourseId) => {
        const response = await apiClient.post('/api/v1/prerequisites', { preCourseId, postCourseId });
        return response.data;
    },

    deleteByPair: async (preCourseId, postCourseId) => {
        const response = await apiClient.delete('/api/v1/prerequisites', { data: { preCourseId, postCourseId } });
        return response.data;
    },
};
