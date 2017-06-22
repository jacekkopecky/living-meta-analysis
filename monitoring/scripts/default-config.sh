#!/bin/bash
# default-config.sh: default configuration for monitor.sh and config-to-json.sh
# DON'T CHANGE THIS FILE

# custom config should be in the following file:
config_path="$dir/../../statsd-server-conf.sh"

# configure the statsd server in living-meta-analysis/statsd-server-conf.sh
# provide STATSD_HOST, STATSD_PORT, and STATSD_PREFIX
if [ -f "$config_path" ]
then
  . "$config_path"
else
  echo "using default configuration, missing $config_path"
fi

host=${STATSD_HOST:-localhost}
port=${STATSD_PORT:-8125}
prefix=${STATSD_PREFIX:-test.}
