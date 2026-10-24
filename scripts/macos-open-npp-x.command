#!/bin/bash
# Clear Gatekeeper quarantine and open npp-x (ad-hoc / non-notarized builds).
set -euo pipefail

APP=""
for candidate in \
  "/Applications/npp-x.app" \
  "$HOME/Applications/npp-x.app" \
  "$(dirname "$0")/../npp-x.app" \
  "$HOME/Downloads/npp-x.app"
do
  if [[ -d "$candidate" ]]; then
    APP="$candidate"
    break
  fi
done

if [[ -z "$APP" ]]; then
  osascript -e 'display alert "npp-x not found" message "Move npp-x.app into Applications, then run this script again."'
  exit 1
fi

xattr -cr "$APP"
open "$APP"
echo "Opened: $APP"
