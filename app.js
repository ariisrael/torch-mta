const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

app.get('/status', (req, res) => {
  const line = req.query.line
  if (!line) return res.status(400).send({ message: 'No line provided'})
  res.send(`status for line ${line}`)
})

app.get('/uptime', (req, res) => {
  const line = req.query.line
  if (!line) return res.status(400).send({ message: 'No line provided'})
  res.send(`uptime for line ${line}`)
})

app.listen(port, () => console.log(`Server is running at port ${port}`));