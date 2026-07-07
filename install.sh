#!/bin/bash
set -e

make build-linux

mkdir -p ~/.local/bin ~/.local/share/icons ~/.local/share/applications

install -m 755 build/bin/FirePreview ~/.local/bin/FirePreview
install -m 644 build/appicon.png ~/.local/share/icons/firepreview.png

cat > ~/.local/share/applications/firepreview.desktop <<EOF
[Desktop Entry]
Name=FirePreview
Exec=$HOME/.local/bin/FirePreview
Icon=firepreview
Type=Application
Categories=Graphics;Utility;
Terminal=false
EOF

echo "FirePreview installed/updated"