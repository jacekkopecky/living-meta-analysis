#!/bin/bash
# monitor.sh: monitor various OS-level statistics and send the data to a graphite server

dir=`dirname $0`

# configure the statsd server in living-meta-analysis/statsd-server-conf.sh
# provide STATSD_HOST and STATSD_PORT
if [ -f "$dir/../../statsd-server-conf.sh" ]
then
  . "$dir/../../statsd-server-conf.sh"
fi

# please provide STATSD_HOST and STATSD_PORT environment variables

host=${STATSD_HOST:-localhost}
port=${STATSD_PORT:-8125}

echo "using statsd server $host:$port"

# Need exactly five parameters and a valid metric type
sendStatsDPacket() {
  if [ -z "$2" ]
  then
    return
  fi

  dataName=$1
  data=$2
  metricType=$3

  if [ $# -ne 3 ] || [ "$metricType" != "c" -a "$metricType" != "g" -a "$metricType" != "ms" ]
  then
    echo "invalid packet - there's a bug - exiting"
    exit -1
  fi

  # Display the selected data on stdout and then send it to @host on port @port

  packet="$dataName:$data|$metricType"
  echo -n "$packet" | nc -q 0 -u $host $port
  echo "Sent: $packet to $host on port $port"
}



# tell the sub-scripts that it's us running them
running_with_source=1

while true; do
  # gather the stats

  . $dir/mem.sh
  . $dir/cpu.sh
  . $dir/hdd.sh
  . $dir/net.sh

  # Sending informations

  sendStatsDPacket "os.mem" "$mem" "g"
  sendStatsDPacket "os.cpu" "$cpu" "g"
  sendStatsDPacket "os.hdd" "$hdd" "g"
  sendStatsDPacket "os.net.tx" "$net_tx_bps" "g"
  sendStatsDPacket "os.net.rx" "$net_rx_bps" "g"

  # Send a counter event if n < 10

  sendStatsDPacket "statsSent" "1" "c"

  # wait 9 seconds so that every 10s flush by statsD has an up-to-date measure
  sleep 9
done
