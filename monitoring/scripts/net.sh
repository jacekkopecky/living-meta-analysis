#!/bin/bash
# net.sh: get network up and down activity in bytes per second, totaled across all network interfaces including loopback

# expects to be run with the `source` command:
# . net.sh

if [ -z "$running_with_source" ]
then
  echo "this script expects to be run from monitor.sh"
fi

# uses `ifconfig` (might use `ip`) to get bytes received/transmitted

# uses the following state:
# net_old_rx - total bytes received last time
# net_old_tx - total bytes transmitted last time
# net_old_time - seconds since epoch when the above values were measured
# if we have those old values, report net_rx and net_tx as bytes per second

net_time=`date +%s`
if [ "$net_time" != "$net_old_time" ]
then

  net_rx=0
  net_tx=0

  eval `/sbin/ifconfig |
        grep 'RX bytes' |
        sed -e 's/.*RX bytes:\([0-9]\+\) .*TX bytes:\([0-9]\+\) .*/net_rx=$[net_rx+\1] ; net_tx=$[net_tx+\2]/g'`


  if [ -n "$net_old_rx" ]
  then
    net_rx_bps=$[(net_rx - net_old_rx)/(net_time - net_old_time)]
    net_tx_bps=$[(net_tx - net_old_tx)/(net_time - net_old_time)]
  else
    net_rx_bps=
    net_tx_bps=
  fi

  net_old_rx=$net_rx
  net_old_tx=$net_tx
  net_old_time=$net_time

fi
