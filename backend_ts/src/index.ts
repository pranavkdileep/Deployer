import express, { NextFunction, Request, Response } from 'express'
import loginRoute from './routes/auth'
import projectRoute,{logWebsoket} from './routes/projects'
import systemRouts from './routes/system'
import dotenv from 'dotenv'
import { jwtMiddleware, verifyClient } from './utils/middleware'
import fileUpload from 'express-fileupload'
import http from 'http';
import { WebSocketServer } from 'ws';
import { terminalwss } from './handlers/terminalWss'
import './managers/trafficAnalyser'

dotenv.config()

const app = express()
const server = http.createServer(app);
const port = 3000




app.use('/', express.static('public'));
app.use(express.json());
app.use(fileUpload());
app.use('/api/auth', loginRoute);
app.use('/api/projects', projectRoute);
app.use('/api/system',jwtMiddleware,systemRouts);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});



const wss = new WebSocketServer({ noServer: true ,verifyClient:verifyClient});
logWebsoket(wss);
terminalwss(wss);

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});