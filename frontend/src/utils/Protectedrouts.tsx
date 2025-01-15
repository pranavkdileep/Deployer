import {Outlet,Navigate} from 'react-router-dom'

export const Protectedroutes = () =>{
    const user = document.cookie.includes('token');
    return user ? <Outlet /> : <Navigate to="/login" />;
}