#!/bin/bash
# monitor.sh: monitor various OS-level statistics and send the data to a graphite server

dir=`dirname $0`

. $dir/default-config.sh

echo "using statsd server $host:$port with prefix '$prefix'"

# Need exactly three parameters and a valid metric type
sendStatsDPacket() {
  # if we have no value, send no packet (we initially don't have values for CPU and NET)
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

  packet="$prefix$dataName:$data|$metricType"
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
  sendStatsDPacket "os.net.tx" "$net_tx" "c"
  sendStatsDPacket "os.net.rx" "$net_rx" "c"

  # Send a counter event if n < 10

  sendStatsDPacket "statsSent" "1" "c"

  # wait 9 seconds so that every 10s flush by statsD has an up-to-date measure
  sleep 9
done
