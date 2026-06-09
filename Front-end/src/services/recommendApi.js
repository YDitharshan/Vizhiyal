// services/recommendApi.js
import api from "../lib/axios.js";

export const recommendApi = {
  // params: { category, location, lat, lng, budget, limit,
  //           w_distance, w_rating, w_experience, w_price }
  vendors: (params) => api.get("/recommend/vendors", { params }),
};
