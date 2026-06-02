// services/offerApi.js
import api from "../lib/axios.js";

export const offerApi = {
  create:            (data)    => api.post("/offers", data),
  getByConversation: (convId)  => api.get(`/offers/conversation/${convId}`),
  withdraw:          (id)      => api.patch(`/offers/${id}/withdraw`),
  accept:            (id)      => api.patch(`/offers/${id}/accept`),
  reject:            (id)      => api.patch(`/offers/${id}/reject`),
};
