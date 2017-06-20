#!/bin/bash
# hdd.sh: Compute the total used disk space in %

# expects to be run with the `source` command:
# . hdd.sh

if [ -z "$running_with_source" ]
then
  echo "this script expects to be run from monitor.sh"
fi


hdd=`df -k | tail -n +2 |
     awk '    {totalMem += $2; usedMem += $3}
          END {printf "%1.0f", (usedMem*100/totalMem)}'`
