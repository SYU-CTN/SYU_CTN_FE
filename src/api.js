import axios from 'axios';

const api = axios.create({
    // 🌟 뒤에 있던 /api 를 지웠습니다! 이제 헷갈리지 않습니다.
    baseURL: 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 5000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
