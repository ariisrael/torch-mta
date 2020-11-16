# Torch MTA 
The API has two endpoints, /status and /uptime. Both accept the query parameter 'line' (and alias 'route') which correspond to a bus, subway, or rail line. The uptime is calculated since monitoring via this API began, and the start time is provided in the uptime response.

http://torch-mta.herokuapp.com/status?line=1

http://torch-mta.herokuapp.com/uptime?line=1