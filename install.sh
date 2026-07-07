#!/bin/bash
set -e  # stop on first error

make build-linux

mkdir -p ~/.local/bin ~/.local/share/icons

cp build/bin/FirePreview ~/.local/bin/
cp build/appicon.png ~/.local/share/icons/firepreview.png

echo "firepreview installed/updated"