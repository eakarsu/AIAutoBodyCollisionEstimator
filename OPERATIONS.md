# Operations

Configure `.env` from `.env.example`, then explicitly run `scripts/bootstrap.sh` and `scripts/migrate.sh`. `start.sh` only launches its own backend and frontend children. Demo records require `CONFIRM_DEMO_SEED=yes scripts/seed-demo.sh`.

The governed estimate contract is `/api/estimate-cases`. It records photo hashes, VIN, damage observations, OEM procedure references, parts/labor, deterministic totals, supplements, version conflicts, independent approval, and immutable events. Generated `gap-*` routes are not mounted. VIN, OEM, supplier, insurer, shop-management, storage, payment, and messaging integrations are not operational until real provider credentials and contracts are supplied.

