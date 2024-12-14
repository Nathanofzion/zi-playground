import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://api.soroswap.finance',
  headers: {
    'Cache-Control': 'no-cache',
  },
});

export default axiosInstance;
