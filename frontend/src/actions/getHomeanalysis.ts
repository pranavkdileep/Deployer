import Cookie  from 'js-cookie';
import axios, { AxiosError } from 'axios';
import logout from '@/lib/logout';

export const getSystemanalysis = async () => {
    const token = Cookie.get('token');
    if(!token){
        window.location.href = '/login';
    }

    try{
        const response = await axios.get(
            '/api/system/systemstats',
            {
                headers:{
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        )
        //console.log(response.data)
        return response.data;
    }catch(e){
        console.log(e)
        const error = e as AxiosError;
        if(error.response?.status === 500){
            logout();
        }
    }
}