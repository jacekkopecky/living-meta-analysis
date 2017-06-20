# ncSend.sh: Send data to graphite using nc
# Author: Raphael Ragoomundun
# email: raphael.ragoomundun@openmailbox.org

usage () {
    echo -e "Usage: $0 \e[4mdataName\e[0m \e[4mdata\e[0m \e[4mmetricType\e[0m \e[4mhost\e[0m \e[4mport\e[0m"
    echo
    echo " dataName: graphite's metric path"
    echo " data: graphite's metric value"
    echo " metricType: graphite's metric type (c=counter,g=gauge,t=timer)"
    echo " host: host to send the data"
    echo " post: host's port to send the data"
    exit 1
}

# Check if the metric type in parameter is equal to c, g, or t

metricTypeTest() {
    if [ $# -eq 0 ] || [ $1 != "c" -a $1 != "g" -a $1 != "t" ]; then
        echo false
    else
        echo true
    fi
}

# Need exactly five parameters and a valid metric type

if [ $# -ne 5 ] || [ $(metricTypeTest $3) = "false" ]; then
    usage
fi

dataName=$1
data=$2
metricType=$3
host=$4
port=$5

# Display the selected data on stdout and then send it to @host on port @port

echo -n "$dataName:$data|$metricType" | nc -w 1 -u $host $port
echo "Sending: $dataName:$data|$metricType to $host on port $port"
