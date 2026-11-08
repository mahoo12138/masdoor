#!/bin/bash

# conf/app.conf defaults to SQLite (file:data/masdoor.db), so no env defaults
# are needed here — the DSN can still be overridden via the dataSourceName
# environment variable or by mounting a custom conf/app.conf.

exec /server
