import api from './api';

const chatService = {
  askQuestion: (message) => {
    return api.post('/chat/ask', { message });
  }
};

export default chatService;
