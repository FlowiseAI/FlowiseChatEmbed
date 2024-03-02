#!/bin/bash
flag=$1
env=$2
mt=""
# Acceptable flags
js="js"
css="css"

if [ "$flag" != "$mt" ]; then
  echo "Push: $1"
  echo ""
else
  echo ""
  echo "     Usage push.sh [ js or css ] [ www or editor ]"
  echo ""
  exit
fi

# Build the project
yarn build

if [ "$flag" == "$js" ]; then

  # Push the JS source to S3 and update the filename based on the environment

  echo ""
  echo "Publish JS changes to " $env
  echo ""

  # Build the JS source
  yarn build
  
  if [ "$env" != "prd" ]; then
    aws s3 cp dist/web.js s3://trelles-assets-$env/js/web.js
  else
    aws s3 cp dist/web.js s3://trelles-assets/js/web_dev.js
  fi

  echo ""
  echo "Push JS source - Done"
  echo ""

fi

if [ "$flag" == "$css" ]; then

  # **** NOT USED **** Push the CSS source to S3 and update the filename based on the environment
  
  echo ""
  echo " *** NOT USED *** Publish CSS changes to " $env
  echo ""
  exit
  
  if [ "$env" == "prd" ]; then
    aws s3 cp not_used.css s3://trelles-assets/css/.css
  else
    aws s3 cp not_used.css s3://trelles-assets/css/.css
  fi

  echo ""
  echo "Push CSS source - Done"
  echo ""

fi

# Echo time ran
now=$(date)
echo "$now"
echo ""

