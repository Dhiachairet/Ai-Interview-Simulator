import api from './api';

const interviewService = {
  startInterview: async (config) => {
    try {
      const response = await api.post('/api/interview/start', config);
      return response.data;
    } catch (error) {
      console.error('Start interview error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to start interview' 
      };
    }
  },
  
  submitAnswer: async (data) => {
    try {
      const response = await api.post('/api/interview/answer', data);
      return response.data;
    } catch (error) {
      console.error('Submit answer error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to submit answer' 
      };
    }
  },
  
  getHistory: async () => {
    try {
      const response = await api.get('/api/interview/history');
      return response.data;
    } catch (error) {
      console.error('Get history error:', error);
      return { success: false, data: [] };
    }
  },
  
  getInterviewById: async (id) => {
    try {
      const response = await api.get(`/api/interview/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get interview error:', error);
      return { success: false };
    }
  },
  
  speak: async (text, personality, isQuestion = true) => {
    try {
      const response = await api.post('/api/interview/speak', {
        text,
        personality,
        isQuestion
      });
      return response.data;
    } catch (error) {
      console.error('TTS error:', error);
      return { success: false };
    }
  }
};

export default interviewService;