#!/bin/bash
# mem.sh: Get memory used as percentage

# expects to be run with the `source` command:
# . mem.sh

if [ -z "$running_with_source" ]
then
  echo "this script expects to be run from monitor.sh"
fi

# @mem_line: get the line which contains informations on ram usage
#         convert spaces to tab as field separator
# @mem_free: total memory on the computer, field 2 of @mem_line
# @mem_used: total used memory, field 3 of @mem_line
# @mem: available memory in percentage

mem_line=$(free | grep 'buffers/cache')

mem_used=$(echo $mem_line | cut -d ' ' -f 3)
mem_free=$(echo $mem_line | cut -d ' ' -f 4)

mem=$[mem_used*100/(mem_used+mem_free)]
