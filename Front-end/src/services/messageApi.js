// services/messageApi.js
import api from "../lib/axios.js";

export const messageApi = {
  getConversations:     ()             => api.get("/messages"),
  startConversation:    (participantId) => api.post("/messages/conversations", { participantId }),
  getMessages:          (id, params)   => api.get(`/messages/conversations/${id}`, { params }),
  sendMessage:          (id, content)  => api.post(`/messages/conversations/${id}`, { content }),
  markRead:             (id)           => api.patch(`/messages/conversations/${id}/read`),
};
