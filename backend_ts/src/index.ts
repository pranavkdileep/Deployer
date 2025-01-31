import express, { NextFunction, Request, Response } from 'express'
import loginRoute from './routes/auth'
import projectRoute,{logWebsoket} from './routes/projects'
import systemRouts from './routes/system'
import dotenv from 'dotenv'
import { jwtMiddleware, verifyClient } from './utils/middleware'
import fileUpload from 'express-fileupload'
import http from 'http';
import { WebSocketServer } from 'ws';

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



const wss = new WebSocketServer({ server,path:'/logs',verifyClient:verifyClient });
logWebsoket(wss);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});