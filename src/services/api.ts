import axios from "axios";

export const api = axios.create({
  baseURL: "https://eventapp-ju5c.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});