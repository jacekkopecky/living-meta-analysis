# living-meta-analysis
A tool for supporting living and collaborative meta-analysis.

## pre-requisites

 * node.js and npm (version TBS)

## installation and running

 1. clone the repo
 1. `npm install`
 1. fill in google-datastore-specific settings in `server/config.js`
   * the above needs an authentication key pointed at by `config.gcloudProject.keyFilename` – this is generated for you by the Google developer console
 1. change `webpages/js/auth.js` to include your own client ID also generated by Google
 1. fill in HTTPS settings, or comment out HTTPS-specific parts of `config.js` to run on HTTP only
 1. `npm start`

## production server updating

```
ssh lima
sudo login -f lima
cd living-meta-analysis
# do not forever stop server
git stash
git pull
git stash apply
git diff -u              # review everything
npm install              # if package.json has changed
forever restart server   # if server has changed
logout                   # so we don't have a hanging terminal to the server
```

## invite codes

For now with `./invites.txt` to generate an invite, append a line like this:

```
random-code-12345 # 2017-02-28 generated for Cochrane workshop attendees
```

use the script `geninvite` to generate invites, e.g.

```
for pom in `seq 1 100`; do geninvite "for Cochrane workshop attendees and other invitees"; done >> invites.txt
```

Then print them with [LiMA's print page](https://lima.soc.port.ac.uk/admin/print-invites).

Source of `geninvite`:

```
#!/bin/bash

code=''
while grep -q "$code" invites.txt
do
  code=`uuidgen`
  code=${code##*-}
done

echo $code '#' `date +"%Y-%m-%d %H:%M"` $1
```

## database dumps and restores

To dump the currently configured data store:

`npm run db-dump > dumpfile`

To restore from a dumpfile:

`npm run db-add < dumpfile`
