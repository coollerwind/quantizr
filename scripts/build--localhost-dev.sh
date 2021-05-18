#!/bin/bash
# Script for doing a dev build for localhost testing of a single instance (no ActivityPub support)

if [ -f ./vscode-cwd.sh ]; then
  source ./vscode-cwd.sh
fi

###############################################################################
# This script is for normal localhost development. After running this script 
# you should have an instance running at http://localhost:8182, for testing/debugging
#
# In this deploy no docker TAR image containing the deployment is ever
# generated, because everything's run 'in place' rather than generating a 
# deployment that can be moved to some other machine.
###############################################################################

clear
# show commands as they are run.
# set -x

source ./setenv--localhost-dev.sh

# sudo chown 999:999 ${SECRETS}/mongod--localhost-dev.conf

mkdir -p ${QUANTA_BASE}/log
mkdir -p ${QUANTA_BASE}/tmp
mkdir -p ${QUANTA_BASE}/config
mkdir -p ${QUANTA_BASE}/lucene

rm -f ${QUANTA_BASE}/log/*
mkdir -p ${ipfs_data}
mkdir -p ${ipfs_staging}

cd ${PRJROOT}
. ${SCRIPTS}/_build.sh

# IMPORTANT: Use this to troubeshoot the variable substitutions in the yaml file
# docker-compose -f ${docker_compose_yaml} config 
# read -p "Config look ok?"

# I was seeing docker fail to deploy new code EVEN after I'm sure i built new code, and ended up finding
# this stackoverflow saying how to work around this (i.e. first 'build' then 'up') 
# https://stackoverflow.com/questions/35231362/dockerfile-and-docker-compose-not-updating-with-new-instructions
cd ${PRJROOT}
docker-compose -f ${docker_compose_yaml} build --no-cache
verifySuccess "Docker Compose: build"

docker-compose -f ${docker_compose_yaml} up -d quanta-dev
verifySuccess "Docker Compose (Quanta-dev): up"

# sleep 10
# echo "Sleeping 10 seconds before checking logs"
# docker-compose -f ${docker_compose_yaml} logs ipfs-dev
# verifySuccess "Docker Compose: logs"

dockerCheck "quanta-dev"

# read -p "Build and Start Complete. press a key"
