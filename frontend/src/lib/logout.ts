
export default function logout() {
    //clear cookie token
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    //redirect to login page
    window.location.href = "/";
}