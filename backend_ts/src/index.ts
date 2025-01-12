import express from 'express'

const app = express()
const port = 3000

let counter = 0;

app.get('/', (req, res) => {
  res.send(`Hello World!${counter++}`)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})