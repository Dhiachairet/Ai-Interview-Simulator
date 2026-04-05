import api from './api';

const interviewService = {
  startInterview: async (config) => {
    const response = await api.post('/api/interview/start', config);
    return response.data;
  },
  
  submitAnswer: async (data) => {
    const response = await api.post('/api/interview/answer', data);
    return response.data;
  }
};

export default interviewService;