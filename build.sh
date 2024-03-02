#!/bin/bash
env=$1
flag=$2

# Build the project
yarn build

# Push the scripts
./push.sh $env $flag

# Echo time ran
now=$(date)
echo "$now"
echo ""

