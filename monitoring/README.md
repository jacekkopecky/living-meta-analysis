# LiMA monitoring

we monitor LiMA with StatsD and Graphite, presumed installed on a different VM.

## Files

 - `scripts` has OS-level monitoring scripts (CPU, HDD, NET) that should run on the LiMA server
 - `statsd` has a docker configuration for an image of StatsD and Graphite

## Deployment of StatsD and Graphite

The monitoring system should run on a different VM (so your stats are available even if LiMA server were to die):

The VM expects to use port 8080 for the graphite frontend. (Change the commands below to tweak this.) This port gives access to all the data without authorization; graphs and dashboards can only be stored after logging in through the Web interface as the user `root` (whose password needs to be set as part of setup below). Consider firewalling this StatsD VM so only trusted networks have access to it.

### Requirements:

 - Ubuntu/Debian VM
 - Install Docker

### Setup:

First, copy the `statsd` directory onto the VM. Then, on the target VM, run as root:

```
cd statsd
docker build -t graphiteimg .
docker run -d \
           --name graphite \
           --restart=always \
           -p 8080:80 \
           -p 8125:8125/udp \
           -v `pwd`/data:/opt/graphite/storage \
           graphiteimg
```

**Then change the root password (default `root`) at `/admin/password_change/`.**

This should be all that's needed, verify it is running correctly by browsing to the IP address of the VM (port 8080) or running `docker ps`.

Docker will automatically start the image when docker itself starts, including on VM boot.

### Persistent Files:

The `run` command sets up the following persistent data volume:

- `data`: the storage for Graphite – this contains all of your saved graphs and dashboards, the admin password, and all the historic data

This data directory will persist between boots; you will probably want to back it up.

### Useful Docker Commands

command | comment
--------|--------
`docker restart graphite` | stop and start the instance `graphite` (e.g. if some bit of it breaks)
`docker stop graphite` | stop the running instance
`docker rm graphite` | remove the instance
`docker rmi graphiteimg` | clear the built container image `graphiteimg`
`docker logs graphite` | shows the runtime logs of the container
`docker exec -it graphite /bin/bash` | open a `bash` inside the container (e.g. for inspection)


## Deployment of OS-level monitoring scripts

- On LiMA server, create `living-meta-analysis/statsd-server-conf.sh` that specifies the location of the StatsD VM as `STATSD_HOST` and `STATSD_PORT`
- Make sure that `living-meta-analysis/monitoring/scripts/monitor.sh` gets run at boot
- Example init files for Debian are provided in `deployment/`  TODO
