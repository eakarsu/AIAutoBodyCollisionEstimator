#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; set -a; source "$root/.env"; set +a
case "${CONFIRM_DEMO_SEED:-}" in yes|YES) ;; *) echo 'Set CONFIRM_DEMO_SEED=yes to load synthetic records.'; exit 2 ;; esac
cd "$root/backend"; node db/seed.js
