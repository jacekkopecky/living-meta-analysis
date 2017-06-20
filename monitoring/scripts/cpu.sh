#!/bin/bash
# cpu.sh: Total CPU usage

# expects to be run with the `source` command:
# . cpu.sh

if [ -z "$running_with_source" ]
then
  echo "this script expects to be run from monitor.sh"
fi

# uses the following state:
# cpu_old_active = add everything except IDLE
# cpu_old_all = add everything
# if we have those old values, report cpu as percentage

cpu_line=$(grep 'cpu ' /proc/stat)
cpu_line=${cpu_line#cpu }   # drop the first word

cpu_sum_all=0
cpu_sum_active=0
cpu_tmp_cnt=1
for num in $cpu_line
do
  cpu_sum_all=$[cpu_sum_all+num]
  if [ $cpu_tmp_cnt != 4 ]
  then
    # skip idle, the fourth item in the line
    cpu_sum_active=$[cpu_sum_active+num]
  fi
  cpu_tmp_cnt=$[cpu_tmp_cnt+1]
done

if [ -n "$cpu_old_active" ]
then
  cpu=$[(cpu_sum_active-cpu_old_active)*100/(cpu_sum_all-cpu_old_all)]
else
  cpu=
fi

cpu_old_active=$cpu_sum_active
cpu_old_all=$cpu_sum_all
