#!/bin/bash
# config-to-json.sh: show the configuration as a JSON structure so it can be loaded easily by node

dir=`dirname $0`

# make sure nothing gets output by the config script, but keep the old stdout
exec 3>&1 >/dev/null

# configure the statsd server in living-meta-analysis/statsd-server-conf.sh
# provide STATSD_HOST, STATSD_PORT, and STATSD_PREFIX
if [ -f "$dir/../../statsd-server-conf.sh" ]
then
  . "$dir/../../statsd-server-conf.sh"
fi

# this needs to be kept in sync with monitor.sh
host=${STATSD_HOST:-localhost}
port=${STATSD_PORT:-8125}
prefix=${STATSD_PREFIX:-test.}

echo '{"host":"'$host'","port":"'$port'","prefix":"'$prefix'"}' >&3
