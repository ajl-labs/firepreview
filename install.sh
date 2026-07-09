#!/bin/bash
set -e

APP_NAME="FirePreview"
OS="$(uname -s)"

case "$OS" in
  Linux)
    echo "Detected Linux — building and installing..."
    make build-linux

    mkdir -p ~/.local/bin ~/.local/share/icons ~/.local/share/applications

    install -m 755 build/bin/"$APP_NAME" ~/.local/bin/"$APP_NAME"
    install -m 644 build/appicon.png ~/.local/share/icons/firepreview.png

    cat > ~/.local/share/applications/firepreview.desktop <<EOF
[Desktop Entry]
Name=$APP_NAME
Exec=$HOME/.local/bin/$APP_NAME
Icon=firepreview
Type=Application
Categories=Graphics;Utility;
Terminal=false
EOF

    echo "$APP_NAME installed/updated at ~/.local/bin/$APP_NAME"
    ;;

  Darwin)
    echo "Detected macOS — building and installing..."
    make build-mac

    BUNDLE="$APP_NAME.app"
    BUILD_PATH="build/bin/$BUNDLE"
    INSTALL_PATH="/Applications/$BUNDLE"

    if [ -d "$INSTALL_PATH" ]; then
      rm -rf "$INSTALL_PATH"
    fi

    cp -R "$BUILD_PATH" "$INSTALL_PATH"
    xattr -cr "$INSTALL_PATH"
    touch "$INSTALL_PATH"
    killall Finder 2>/dev/null || true

    echo "$APP_NAME installed/updated at $INSTALL_PATH"
    ;;

  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac