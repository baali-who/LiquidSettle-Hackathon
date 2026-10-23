#!/usr/bin/env bash
# Publish hackathon/ as its own repository without opening the platform.
#
#   hackathon/scripts/publish.sh                 prints the freeze hash and the files that would be published
#   hackathon/scripts/publish.sh split <branch>  git subtree split of hackathon/ into <branch> (history of that folder only)
#   hackathon/scripts/publish.sh push <remote>   split + push the branch to <remote> as main (asks before pushing)
#
# The split carries only hackathon/'s history: no platform code, no templates, no secrets ever touched
# this folder (the test tests/test_iteration49_liquidgate.py::test_hackathon_package_has_no_secret_or_platform_import
# checks every file for keys, seeds, node URLs and platform imports before you get here).
set -euo pipefail
cd "$(dirname "$0")/../.."
ROOT=$(pwd)
FREEZE=$(git -c core.fsmonitor=false rev-parse HEAD)
BRANCH=${2:-hackathon-public}

case "${1:-show}" in
  show)
    echo "freeze hash (HEAD): $FREEZE"
    echo "first line of hackathon/PROVENANCE.md should read: $FREEZE"
    echo
    echo "files that would be published:"
    git -c core.fsmonitor=false ls-files hackathon | sed 's/^/  /'
    echo
    echo "set the freeze hash on the desk (Platform Studio → Operations → LiquidGate → Provenance) and in PROVENANCE.md, then:"
    echo "  $0 split $BRANCH"
    ;;
  split)
    echo "splitting hackathon/ → branch $BRANCH"
    git -c core.fsmonitor=false subtree split --prefix=hackathon -b "$BRANCH"
    echo "done: git log --oneline $BRANCH | head"
    ;;
  push)
    REMOTE=${2:?remote url}
    git -c core.fsmonitor=false subtree split --prefix=hackathon -b hackathon-public
    echo "about to push branch hackathon-public → $REMOTE main"
    read -r -p "continue? [y/N] " yn
    [ "$yn" = "y" ] || exit 1
    git -c core.fsmonitor=false push "$REMOTE" hackathon-public:main
    ;;
  *)
    echo "usage: $0 [show|split <branch>|push <remote>]" >&2; exit 2;;
esac
