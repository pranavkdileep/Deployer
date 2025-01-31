import WebSocket from 'isomorphic-ws';
import Cookie from "js-cookie";


export async function generateLog(name:string,logstreamer:(log:string)=>void) {
  const token = await Cookie.get('token');
  logstreamer(`Connecting to ${name} websocket...`);
  const ws = new WebSocket(`ws://localhost:3000/logs?token=${token}&projectName=${name}`);
  ws.onopen =  function open() {
    logstreamer(`Connected to ${name} websocket!`);
  }
  ws.onmessage = function incoming(data: any) {
    logstreamer(`Received: ${data.data}`);
  }
}

