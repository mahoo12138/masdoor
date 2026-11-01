#!/bin/bash

# conf/app.conf already defaults to SQLite (file:data/masdoor.db), so no env
# defaults are needed here — database settings can still be overridden via
# environment variables (driverName / dataSourceName / dbName) or by mounting
# a custom conf/app.conf.

exec /server
