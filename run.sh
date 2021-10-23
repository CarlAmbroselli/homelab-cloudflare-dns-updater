VERSION=$(git rev-list --count main)
TAG=$(basename $(pwd))

if [[ "$(docker images -q $TAG:$VERSION 2> /dev/null)" == "" ]]; then
  echo "DNE"
fi