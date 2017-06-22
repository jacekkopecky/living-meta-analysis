#!/bin/bash
# config-to-json.sh: show the configuration as a JSON structure so it can be loaded easily by node

dir=`dirname $0`

# make sure nothing gets output by the config script, but keep the old stdout
exec 3>&1 >/dev/null

. $dir/default-config.sh

echo '{"host":"'$host'","port":"'$port'","prefix":"'$prefix'"}' >&3
