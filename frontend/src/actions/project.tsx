import logout from "@/lib/logout";
import axios, { AxiosError } from "axios";
import Cookie from "js-cookie";

export const stopProject = async (name: string) => {
    const token = Cookie.get('token');
    if (!token) {
        window.location.href = '/';
    }

    try {
        let data = JSON.stringify({
            "name": name
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: '/api/projects/stopcontainer',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: data
        };
        const response = await axios.request(config);
        console.log(response.data);
        return response.data;
    } catch (e) {
        console.log(e)
        const error = e as AxiosError;
        if (error.response?.status === 500) {
            logout();
        }
    }
}

export const restartProject = async (name: string) => {
    const token = Cookie.get('token');
    if (!token) {
        window.location.href = '/';
    }

    try {
        let data = JSON.stringify({
            "name": name
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: '/api/projects/startcontainer',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: data
        };
        const response = await axios.request(config);
        console.log(response.data);
        return response.data;
    } catch (e) {
        console.log(e)
        const error = e as AxiosError;
        if (error.response?.status === 500) {
            logout();
        }
    }
}

export const startProject = async (name: string) => {
    const token = Cookie.get('token');
    if (!token) {
        window.location.href = '/';
    }

    try {
        let data = JSON.stringify({
            "name": name
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: '/api/projects/startcontainer',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: data
        };
        const response = await axios.request(config);
        console.log(response.data);
        return response.data;
    } catch (e) {
        console.log(e)
        const error = e as AxiosError;
        if (error.response?.status === 500) {
            logout();
        }
    }
}