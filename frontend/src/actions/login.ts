import { logingResponse } from "@/interfaces/types";
import axios from "axios";
import Cookies from "js-cookie";

export const loginAction = async (email: string, password: string) => {
    const payload = {
        email: email,
        password: password,
        timestamp: new Date().getTime(),
      };
  
      const response = await axios.post('/api/auth/login', payload);
      console.log(response.data);
      const data:logingResponse = response.data;
      if(data.success){
        //document.cookie = `token=${data.token}; expires=3600; path=/; SameSite=None; `;
        Cookies.set('token', data.token, { expires: 1,secure: false });
        return data.success;
      }
      else{
        throw new Error(data.message);
      }
}