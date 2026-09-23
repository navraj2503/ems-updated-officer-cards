// Importing axios for making HTTP requests
import axios from 'axios';

// Creating a pre-configured axios instance
const api = axios.create({
  // Setting the base URL for all API calls
  baseURL: 'http://localhost:5000/api',
});

// Adding a request interceptor to automatically include the JWT token in headers
api.interceptors.request.use(
  (config) => {
    // Retrieving the token from browser local storage
    const token = localStorage.getItem('token');
    // If a token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handling request errors
    return Promise.reject(error);
  }
);

// Exporting the configured axios instance
export default api;
