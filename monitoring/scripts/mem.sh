# mem.sh: Get memory available in percentage
# Author: Raphael Ragoomundun
# email: raphael.ragoomundun@openmailbox.org

# @memLn: get the line which contains informations on ram usage
#         convert spaces to tab as field separator
# @totalMem: total memory on the computer, field 2 of @memLn
# @used: total used memory, field 3 of @memLn
# @mem: available memory in percentage

memLn=$(free | grep 'Mem' | awk -v OFS="\t" '$1=$1')
totalMem=$(echo $memLn | cut -d ' ' -f 2)
used=$(echo $memLn | cut -d ' ' -f 3)
mem=$(echo "scale=2;($used / $totalMem) * 100" | bc -l)
