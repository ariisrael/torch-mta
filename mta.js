const axios = require('axios')
const url = 'https://collector-otp-prod.camsys-apps.com/realtime/serviceStatus?apikey=qeqy84JE7hUKfaI0Lxm2Ttcm6ZA0bYrP'
const db = require('./db').get()

async function updateRoutes() {
  console.log('Checking MTA for updates')
  let bulkUpdateOps = []
  const res = await axios.get(url)
  const lastUpdated = res.data.lastUpdated
  res.data.routeDetails.forEach(r => {
    let updateOp = {
      'updateOne': {
        'filter': { 'name': r.route },
        'upsert': true
      }
    }
    let updates = {
      '$set': {
        'mtaLastUpdated': lastUpdated,
        'mode': r.mode
      },
      '$setOnInsert': {
        'createdAt': new Date().toString()
      }
    }
    let delays = [];
    let delayed = false;
    let delayStart;
    if (r.statusDetails && r.statusDetails.length > 0) {
      let delayIds = new Set()
      r.statusDetails.forEach(rsd => {
        if (rsd.statusSummary === 'Delays' && !delayIds.has(rsd.id)) {
          delayIds.add(rsd.id)
          if (!rsd.endDate || new Date(rsd.endDate) > Date.now()) delayed = true;
          delays.push({
            creationDate: rsd.creationDate,
            startDate: rsd.startDate,
            endDate: rsd.endDate,
          })
        }
      })
      if (delays.length > 1) {
        // Use the delay with the earliest start time because both are ongoing
        delays.forEach(delay => {
          if (!delayStart || new Date(delay.startDate) < new Date(delayStart)) {
            delayStart = delay.startDate;
          }
        })
      }
      if (delays.length === 1) delayStart = delays[0].startDate
    }
    updates['$set']['delayStart'] = delayStart
    updates['$set']['isDelayed'] = delayed
    if (!delayed) updates['$set']['wasOnTime'] = true
    updateOp['updateOne']['update'] = updates
    bulkUpdateOps.push(updateOp)
  });

  db.collection('routes').bulkWrite(bulkUpdateOps, (err, res) => {
    if (err) return console.log('err', err)
    const nowOnTimeQuery = {
      'isDelayed': false,
      'delayStart': {
        '$ne': null
      }
    }
    const nowDelayedQuery = {
      'isDelayed': true,
      'wasOnTime': {
        '$exists': true,
        '$ne': false
      }
    }

    db.collection('routes').find(nowDelayedQuery).forEach(route => {
      console.log(`Line ${route.name} (${route.mode}) is experiencing delays`);
      db.collection('routes').updateOne({ 'name': route.name }, {
        '$set': {
          'wasOnTime': false,
        },
      })
    })

    db.collection('routes').find(nowOnTimeQuery).forEach(route => {
      const pastDelay = {
        startDate: route.delayStart,
        endDate: route.mtaLastUpdated,
      }
      if (route.pastDelays) {
        const lastSavedDelay = route.pastDelays.pop()
        if (lastSavedDelay.startDate === pastDelay.startDate && lastSavedDelay.endDate === pastDelay.endDate) {
          // If we've already saved this delay, than we've already alerted on time (this is a hack around a weird bug)
          return;
        }
      }
      console.log(`Line ${route.name} (${route.mode}) is now recovered`)
      db.collection('routes').updateOne({ 'name': route.name }, {
        '$set': {
          'delayStart': null,
          'wasOnTime': true,
        },
        '$push': {
          'pastDelays': pastDelay
        }
      })
    })
  })
}

updateRoutes()
setInterval(updateRoutes, 30000)