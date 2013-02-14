#!/bin/sh

pushd .

cd install-localhost-providers
./deploy.sh

cd ../addon
./deploy.sh

popd
