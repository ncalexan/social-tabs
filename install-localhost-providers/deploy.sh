#!/bin/sh

zip install-localhost-providers.xpi -u bootstrap.js install.rdf
wget --post-file=install-localhost-providers.xpi http://localhost:8888/ &
