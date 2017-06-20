# network.sh: get total network up and down activity in kibibytes.
# Author: Raphael Ragoomundun
# email: raphael.ragoomundun@openmailbox.org

network=$(netstat -N -i | awk '{if ($1 > 0 && $4 > 0) print $1,$4,$8}' | grep -i -v name | uniq)

# @nbFields: number of fields in previous command output
# @network: list of used inferfaces; Format : interface up down interface2 up2 down2 ...
# @nbIf: number of interfaces

nbFields=$(($(echo $network | grep -o ' ' | wc -l) + 1))
network=$(echo $network | cut -d ' ' -f 4-${nbFields})
nbIf=$((($(echo $network | grep -o ' ' | wc -l) + 1) / 3))

networkUp=0
networkDown=0

for i in $(seq 1 $nbIf); do
    # Up is in first position afer interface name, down is in second position

    up=$(echo $network | cut -d ' ' -f $((2 * i + (i - 1))))
    down=$(echo $network | cut -d ' ' -f $((3 * i)))

    # Total up and down calculation

    networkUp=$((totalUp + up))
    networkDown=$((totalDown + down))
done

# Convert bytes to kibibytes

networkUp=$(echo "scale=2;($networkUp / 1024)" | bc -l)
networkDown=$(echo "scale=2;($networkDown / 1024)" | bc -l)

# In case if there is no any digit before decimal separation ( . )

if [ ${networkUp:0:1} = "." ]; then
    networkUp="0${networkUp}"
fi

if [ ${networkDown:0:1} = "." ]; then
    networkDown="0${networkDown}"
fi
