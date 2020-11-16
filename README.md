# Torch MTA 
The API has two endpoints, /status and /uptime. Both accept the query parameter 'line' (and alias 'route') which correspond to a bus, subway, or rail line. The uptime is calculated since monitoring via this API began, and the start time is provided in the uptime response.

## /status
### Request
http://torch-mta.herokuapp.com/status?line=Q
### Response
```json
{ 
  "route":"Q",
  "status":"on time"
}
```

## /uptime
### Request
http://torch-mta.herokuapp.com/uptime?line=Q

### Response
```json
{
  "route":"Q",
  "uptime":"100.00",
  "unit":"percent",
  "since":"Mon Nov 16 2020 01:30:13 GMT+0000 (Coordinated Universal Time)"
}
```