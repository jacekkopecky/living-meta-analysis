# mogStart.sh: Start several script for sending data to graphite for monitoring purpose
# Author: Raphael Ragoomundun
# email: raphael.ragoomundun@openmailbox.org

# Change according to your settings

host="localhost"
port="8125"

# Sending loop: send the data to graphite using ncSend.sh
# Comment lines that are not needed

while true; do
    # Sourcing informations

    . ./mem.sh
    . ./cpu.sh
    . ./hdd.sh
    . ./network.sh

    # Sending informations

    ./ncSend.sh "memory" $mem "g" $host $port
    ./ncSend.sh "cpu" $cpu "g" $host $port
    ./ncSend.sh "hdd-free-space" $hdd "g" $host $port
    ./ncSend.sh "network-up" $networkUp "g" $host $port
    ./ncSend.sh "network-down" $networkDown "g" $host $port

    # Send a counter event if n < 10

    n=$((RANDOM % 100))

    if [ $n -lt 10 ]; then
        ./ncSend.sh "fake-counter" "0.$((RANDOM % 100))" "c" $host $port
    fi

    # Send a random * random * 1000 timer request

    ./ncSend.sh "fake-timer" $(((RANDOM % 100) * (RANDOM % 100) * 1000)) "t" $host $port

    echo
    sleep 1
done
