# cpu.sh: Total CPU usage
# Author: Raphael Ragoomundun
# email: raphael.ragoomundun@openmailbox.org

cpu=$(grep 'cpu ' /proc/stat | awk '{usage=($2 + $4) * 100/ ($2 + $4 + $5)} END {print usage}')
