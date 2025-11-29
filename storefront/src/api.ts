import axios from 'axios';

const api = axios.create({
    baseURL: '/api/public/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
