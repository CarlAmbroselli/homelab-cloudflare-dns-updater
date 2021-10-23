# Cloudflare DNS Updater

Docker container that will update a cloudflare DNS record. Can i.e. be used to update a dynamic IP on a recurring schedule.

## Setup
- copy `secrets.env.template` to `secrets.env` and update the secrets (the non-template file is git ignored)
- `./run.sh` (this will build the docker image if the latest git tag doesnt exist yet and will then run it if the configured IP returned via dig is different than the response from ifconfig.co)