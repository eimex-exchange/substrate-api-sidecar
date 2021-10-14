#!/bin/bash

# Jenkins is messed up

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
nvm list
nvm use "v15.7.0"
npm install --global yarn

yarn
yarn build
yarn build:docker
