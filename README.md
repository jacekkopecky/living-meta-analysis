# living-meta-analysis
A tool for supporting living and collaborative meta-analysis.

Todo this README should be about 'how to use this tool', 'what the benefits are', 'getting started guides/examples'. Possibly a small note about 'Developing LiMA' which can contain - datastore emulation, db dumps/restores and more; or those might be described in the deployment readme.

## installation and maintenance

See `deployment/README.md`.

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

We have server-side datastore dump and restore scripts. They communicate directly with the datastore as configured in `config.js`; the LiMA server should be down while the restore script is running.

To dump the currently configured data store:

`npm run db-dump > dumpfile`

To restore from a dumpfile, first stop LiMA server, then run the following:

`npm run db-add < dumpfile`

After restoring data, start LiMA server again and it should see the new data.
