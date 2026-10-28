#!/bin/bash
# Double-click this file (Mac) to run the Iberia relay on your computer and make it reachable from the internet.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Get it from https://nodejs.org (the LTS version), then double-click this file again."; read -p "Press Return to close."; exit 1
fi
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "The tunnel tool 'cloudflared' is not installed."
  echo "Install it with Homebrew:   brew install cloudflared"
  echo "(No Homebrew? See https://brew.sh first.) Then double-click this file again."; read -p "Press Return to close."; exit 1
fi
node relay.js &
RELAY_PID=$!
trap "kill $RELAY_PID 2>/dev/null" EXIT
sleep 1
echo
echo "Starting the tunnel. In a moment a web address ending in .trycloudflare.com appears below."
echo "Copy it, open the game, go to Online > Relay server, paste it, and Save. The invite link will carry it to your friends."
echo "Keep this window open while you play. Closing it stops the relay."
echo
cloudflared tunnel --url http://localhost:8787
