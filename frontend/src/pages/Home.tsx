import { Button } from "@/components/ui/button"
import Cookie from 'js-cookie';

export default function Home() {
  const token = Cookie.get('token');
  return (
    <div>
      <h1 className="text-2xl">Home</h1>
      <p>User Token : {token}</p>
      <Button onClick={() =>{
        console.log('Button clicked');
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure';
      }}>Log Out</Button>
    </div>
  )
}
