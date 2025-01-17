#!/bin/bash

# ===================================================================
# Starts the Quanta server at: http://${quanta_domain}:${PORT}
# The only prerequisite for the machine is: docker & docker-compose
#
# Docker References: https://docs.docker.com/compose/install/
#
# To deploy a completely new release you can just put a new springboot
# fat jar right in this folder, and then change the line below 
# in this file from 'dockerUp' to 'dockerBuildUp'. In other words, all the 
# scripting exists in these files to be able to either run the executables 
# from the fat JAR if it's in this folder and you call dockerBuildUp, or else
# if you leave this script file as the default and run 'dockerUp' then the script
# will either pull the docker image from the public repository or else use the
# one it finds locally if it does fine it. 
# ===================================================================

# force current dir to be this script
script_file=$(realpath $0)
script_folder="$(dirname "${script_file}")"
cd ${script_folder}

source ./setenv-distro-runner.sh

./stop-distro.sh

echo "removing logs"
rm -rf ./log/*

# Uncomment this to troubeshoot the variable substitutions in the yaml file, and will
# display a copy of the yaml file after all environment variables have been substituted/evaluated
# docker-compose -f ${docker_compose_yaml} config
# read -p "Config look ok?"

./gen-mongod-conf-file.sh 

docker-compose -version
if [ -f "${JAR_FILE}" ]; then
    echo "Installing JAR file: ${JAR_FILE}"
    dockerBuildUp
else
    dockerUp
fi

dockerCheck quanta-distro
dockerCheck mongo-distro

# docker-compose -f ${docker_compose_yaml} logs --tail="all" quanta-distro

echo ================================================
echo Quanta Distro Started OK!
echo http://${quanta_domain}:${PORT}
echo ================================================
read -p "Press any key."

if [ -f "${JAR_FILE}" ]; then
    mv ${JAR_FILE} ${JAR_FILE}.bak
fi
