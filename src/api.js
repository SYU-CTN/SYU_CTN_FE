import axios from 'axios';

const api = axios.create({
    // 🌟 뒤에 있던 /api 를 지웠습니다! 이제 헷갈리지 않습니다.
    baseURL: 'http://localhost:8081',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 5000,
});

export default api;