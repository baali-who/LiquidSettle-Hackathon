#!/usr/bin/env bash
# Publish hackathon/ as its own repository — LiquidSettle-Hackathon — without opening the platform.
#
#   hackathon/scripts/publish.sh                 prints the freeze hash and the files that would be published
#   hackathon/scripts/publish.sh check           runs the platform's hygiene test on the folder (secrets, imports, CSP)
#   hackathon/scripts/publish.sh split <branch>  git subtree split of hackathon/ into <branch> (history of that folder only)
#   hackathon/scripts/publish.sh push <remote>   split + push the branch to <remote> as main (asks before pushing)
#
# The split carries only hackathon/'s history: no platform code, no templates, no secrets ever touched this folder
# (tests/test_iteration49_liquidgate.py::test_hackathon_package_has_no_secret_or_platform_import_and_is_csp_clean checks
# every file for keys, seeds, node URLs and platform imports before you get here; scripts/check.py is its public twin).
#
# The first push (24 Oct 2026): create the EMPTY repository on github.com first — name LiquidSettle-Hackathon, private
# until the freeze, no README, no .gitignore, no licence added by GitHub (this folder carries them) — then:
#   hackathon/scripts/publish.sh push https://github.com/<your-user>/LiquidSettle-Hackathon.git
# Later pushes: the same command; the split is rebuilt from the platform branch and fast-forwards main.
set -euo pipefail
cd "$(dirname "$0")/../.."
ROOT=$(pwd)
FREEZE=$(git -c core.fsmonitor=false rev-parse HEAD)
BRANCH=${2:-hackathon-public}

case "${1:-show}" in
  show)
    echo "freeze hash (HEAD): $FREEZE"
    echo "first line of hackathon/PROVENANCE.md should read: FREEZE_HASH: $FREEZE"
    echo
    echo "files that would be published:"
    git -c core.fsmonitor=false ls-files hackathon | sed 's/^/  /'
    echo
    echo "set the freeze hash on the desk (Platform Studio → Operations → LiquidGate → Provenance) and in PROVENANCE.md, then:"
    echo "  $0 check && $0 split $BRANCH"
    ;;
  check)
    python3 hackathon/scripts/check.py
    python3 -m pytest -q -p no:cacheprovider -W ignore tests/test_iteration49_liquidgate.py -k "hackathon_package or derived_hackathon"
    ;;
  split)
    echo "splitting hackathon/ → branch $BRANCH"
    git -c core.fsmonitor=false subtree split --prefix=hackathon -b "$BRANCH"
    echo "done: git log --oneline $BRANCH | head"
    ;;
  push)
    REMOTE=${2:?remote url, e.g. https://github.com/<your-user>/LiquidSettle-Hackathon.git}
    git -c core.fsmonitor=false subtree split --prefix=hackathon -b hackathon-public
    echo "about to push branch hackathon-public → $REMOTE main"
    read -r -p "continue? [y/N] " yn
    [ "$yn" = "y" ] || exit 1
    git -c core.fsmonitor=false push "$REMOTE" hackathon-public:main
    ;;
  *)
    echo "usage: $0 [show|check|split <branch>|push <remote>]" >&2; exit 2;;
esac
