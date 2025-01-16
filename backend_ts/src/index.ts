import express, { NextFunction, Request, Response } from 'express'
import loginRoute from './routes/auth'
import projectRoute from './routes/projects'
import systemRouts from './routes/system'
import dotenv from 'dotenv'
import { jwtMiddleware } from './utils/middleware'
dotenv.config()

const app = express()
const port = 3000

app.use('/', express.static('public'));
app.use(express.json());
app.use('/api/auth', loginRoute);
app.use('/api/projects', projectRoute);
app.use('/api/system',jwtMiddleware,systemRouts);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})