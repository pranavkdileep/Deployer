import { parse } from "url";
import { WebSocket, WebSocketServer } from "ws";
import { URL } from 'url';
import {spawn} from 'node-pty';


export const terminalwss =  (server: WebSocketServer) => {
    server.on('connection', (ws: WebSocket, req) => {
        const { pathname } = new URL(req.url || '', 'http://' + req.headers.host);
        if (pathname !== '/terminal') return;
    
        const projectName = parse(req.url!, true).query.projectName;
        console.log('connected to:', projectName as string);
        try{
        const term = spawn('docker', ['exec', '-it', projectName as string, 'bash'], {
          name: 'xterm-color',
          cols: 80,
          rows: 30,
          cwd: process.env.HOME,
          env: process.env as any,
        })

        term.onData(data => {
          console.log('data:', data);
          ws.send(JSON.stringify({ type: 'terminal-output', data }));
        });
    
        ws.on('message', (message) => {
          const msg = JSON.parse(message.toString());
          if (msg.type === 'terminal-input') {
            term.write(msg.data);
          } else if (msg.type === 'resize') {
            term.resize(msg.cols, msg.rows);
          }
        });

        ws.on('close', () => {
          console.log('disconnected');
          term.kill();
        });
      }catch(err){
        console.log(err);
        ws.send('error');
      }
      });
    
      server.on('error', (err) => {
        console.log(err);
      });
}