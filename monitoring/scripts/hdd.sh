# hdd.sh: Compute the total free disk space in mb
# Author: Raphael Ragoomundun
# email: raphael.ragoomundun@openmailbox.org

getFreeSpace() {
    lineCount=$(($(df | wc -l) - 1))

    df | tail -n ${lineCount} | {
        totalMemory=0
        totalAvailable=0

        while IFS= read -r line; do
            totalMemory=$((totalMemory + $(echo $line | cut -d ' ' -f 2)))
            totalAvailable=$((totalAvailable + $(echo $line | cut -d ' ' -f 4)))
        done

        echo "scale=2;$totalAvailable / (1024 ^ 2)" | bc -l
    }
}

hdd=$(getFreeSpace)
