const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const db = require('./db')

app.get('/status', (req, res) => {
  const line = req.query.line || req.query.route
  if (!line) return res.status(400).json({ error: 'No route provided'})
  db.get().collection('routes').find({ name: line }).toArray().then(arr => {
    if (arr.length === 0) return res.json({ error: `No route ${line} found` })
    const route = arr[0]
    const status = route.isDelayed ? 'delayed' : 'on time'
    res.json({ 
      route: line, 
      status: status 
    })
  })
})

app.get('/uptime', (req, res) => {
  const line = req.query.line || req.query.route
  if (!line) return res.status(400).json({ message: 'No line provided'})
  db.get().collection('routes').find({ name: line }).toArray().then(arr => {
    if (arr.length === 0) return res.json({ error: `No route ${line} found` })
    const route = arr[0]
    let monitorStartTime = new Date(route.createdAt)
    let delayTotalTimeMs = 0
    if (route.pastDelays) {
      route.pastDelays.forEach(delay => {
        startTime = new Date(delay.startDate)
        endTime = new Date(delay.endDate)
        if (monitorStartTime > startTime) monitorStartTime = startTime
        delayTotalTimeMs += endTime - startTime
      })
    }
    if (route.isDelayed) {
      delayTotalTimeMs += Date.now() - new Date(route.delayStart)
    }
    const totalTimeMonitoredMs = Date.now() - monitorStartTime
    const uptimePercentage = (1 - (delayTotalTimeMs / totalTimeMonitoredMs)) * 100

    res.json({ 
      route: line,
      uptime: `${uptimePercentage.toFixed(2)}`, 
      unit: 'percent',  
      since: monitorStartTime.toString()
    })
  })
})

db.connect(err => {
  if (err) return console.log('Could not connect to database')
  console.log('Connected to database')
  app.listen(port, () => console.log(`Server is running at port ${port}`))
  require('./mta')
})