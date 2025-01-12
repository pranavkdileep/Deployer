import express, { NextFunction, Request, Response } from 'express'
import loginRoute from './routes/auth'
import projectRoute from './routes/projects'
import dotenv from 'dotenv'
dotenv.config()


const app = express()
const port = 3000
let counter = 0;

app.use(express.json());
app.use('/api/auth',loginRoute);
app.use('/api/projects',projectRoute);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    message: err.message || 'Internal Server Error',
  });
});

app.get('/', (req :Request, res:Response) => {
  res.send(`Hello World!${counter++}`)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})