#!/bin/bash
# Double-click this AFTER installing npp-x.app (drag from DMG → Applications).
# Clears Gatekeeper quarantine so ad-hoc signed builds can launch.
set -euo pipefail

CANDIDATES=(
  "/Applications/npp-x.app"
  "$HOME/Applications/npp-x.app"
  "$HOME/Downloads/npp-x.app"
)

# Also search common download mounts / Desktop
shopt -s nullglob
for p in "$HOME/Desktop"/npp-x.app /Volumes/*/npp-x.app; do
  CANDIDATES+=("$p")
done

APP=""
for candidate in "${CANDIDATES[@]}"; do
  if [[ -d "$candidate" ]]; then
    APP="$candidate"
    break
  fi
done

if [[ -z "$APP" ]]; then
  osascript <<'EOF'
display dialog "npp-x.app not found.

1. Open the .dmg
2. Drag npp-x into Applications
3. Run this Open script again

Or in Terminal:
  xattr -cr /Applications/npp-x.app && open /Applications/npp-x.app" buttons {"OK"} default button 1 with title "npp-x"
EOF
  exit 1
fi

xattr -cr "$APP" || true
# Remove quarantine flag explicitly if present
xattr -d com.apple.quarantine "$APP" 2>/dev/null || true

open "$APP"
osascript -e "display notification \"Opened $APP\" with title \"npp-x\""
echo "Opened: $APP"
