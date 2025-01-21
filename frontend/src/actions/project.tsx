import { DeploymentMethod } from "@/interfaces/types";
import logout from "@/lib/logout";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
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
            url: '/api/projects/restartcontainer',
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

export const uploadZip = async (formData:FormData , setProgress : (progress : number) => void,oncomplite :(success : boolean) => void) => {
    try{
        let config : AxiosRequestConfig = {
            method: 'post',
            maxBodyLength: Infinity,
            url: '/api/projects/uploadZip',
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${Cookie.get('token')}`
            },
            data: formData,
            onUploadProgress : (e)=>{
                setProgress(e.progress! * 100);
            }
        };

        await axios.request(config);
        oncomplite(true);
    }catch(e){
        console.log(e);
        oncomplite(false);
    }
}

export const saveDeploymentSettings = async (configm: DeploymentMethod,oncomplite :(success : boolean) => void) => {
    try {
        let data = JSON.stringify(configm);

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: '/api/projects/setdeploymentmethod',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Cookie.get('token')}`
            },
            data: data
        };
        const response = await axios.request(config);
        console.log(response.data);
        oncomplite(true);
    } catch (e) {
        oncomplite(false);
        console.log(e)
        const error = e as AxiosError;
        if (error.response?.status === 500) {
            logout();
        }
    }
}

export const deployProject = async (name: string,oncomplite :(success : boolean) => void) => {
    try {
        let data = JSON.stringify({
            "name": name
        });
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: '/api/projects/deploy',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Cookie.get('token')}`
            },
            data: data
        };
        const response = await axios.request(config);
        console.log(response.data);
        oncomplite(true);
    } catch (e) {
        oncomplite(false);  
        console.log(e)
        const error = e as AxiosError;
        if (error.response?.status === 500) {
            logout();
        }
    }
}

export const createProject = async (name: string, description: string) => {
    try {
        let data = JSON.stringify({
            "name": name,
            "description": description
        });
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: '/api/projects/craeteProject',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Cookie.get('token')}`
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
        if(error.response?.data){
            return error.response.data;
        }
    }
}

export const setupgit = async (name: string, giturl: string, branch: string,onsuccess : (success : boolean) => void) => {
    let data = JSON.stringify({
        "name": name,
        "sourceType": "git",
        "gitUrl": giturl,
        "branch": branch
      });
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: '/api/projects/setupProjectSource',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${Cookie.get('token')}`
        },
        data : data
      };
      try{
        const response = await axios.request(config);
        console.log(response.data);
        onsuccess(true);
      }catch(e){
          console.log("Error in setupgit", e);  
        onsuccess(false);
      }
}