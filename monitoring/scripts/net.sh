#!/bin/bash
# net.sh: get network up and down activity in bytes since last check, totaled across all network interfaces including loopback

# expects to be run with the `source` command:
# . net.sh

if [ -z "$running_with_source" ]
then
  echo "this script expects to be run from monitor.sh"
fi

# uses `ifconfig` (might use `ip`) to get bytes received/transmitted

# uses the following state:
# net_old_rx_total - total bytes received last time
# net_old_tx_total - total bytes transmitted last time
# if we have those old values, report net_rx and net_tx as bytes per second

net_rx_total=0
net_tx_total=0

eval `/sbin/ifconfig |
      grep 'RX bytes' |
      sed -e 's/.*RX bytes:\([0-9]\+\) .*TX bytes:\([0-9]\+\) .*/net_rx_total=$[net_rx_total+\1] ; net_tx_total=$[net_tx_total+\2]/g'`


if [ -n "$net_old_rx_total" ]
then
  net_rx=$[net_rx_total - net_old_rx_total]
  net_tx=$[net_tx_total - net_old_tx_total]
else
  net_rx=
  net_tx=
fi

net_old_rx_total=$net_rx_total
net_old_tx_total=$net_tx_total
