<div align="center">
  <h1>Masdoor</h1>
  <p><strong>A personal / family self-hosted identity and access management system</strong></p>
  <p>Forked from <a href="https://github.com/casdoor/casdoor">Casdoor</a>, trimmed to the core: OIDC / OAuth 2.0, user management and login-page theming.</p>
</div>

## What is Masdoor

Masdoor is a self-hosted identity provider (IdP): it stores your users, issues tokens, and gives you a small admin console. Your applications delegate login to it over **OAuth 2.0 / OIDC**, so they never handle passwords themselves.

This fork exists because the upstream Casdoor is a full enterprise IAM platform, while a personal or family deployment only needs a fraction of it. Masdoor keeps what a small self-hosted setup actually uses and removes the rest — smaller binary, smaller attack surface, fewer moving parts.

## Feature scope

| Area | Kept | Removed |
|------|------|---------|
| Protocols | OAuth 2.0, OIDC | SAML 2.0, CAS, LDAP, RADIUS, SCIM, Kerberos |
| Users | Registration, password / email & SMS code login, WebAuthn / Passkey, TOTP & MFA, account linking | — |
| Applications | Multi-app OAuth/OIDC clients, PKCE, device flow | — |
| Login page | Full theming: logo, colors, CSS/HTML slots, sign-in method layout (应用设置 → UI Customization) | — |
| Providers | Google, GitHub and the standard OAuth/OIDC adapters, custom OIDC | WeChat / WeCom / Telegram login, SAML providers |
| Ops | Webhooks, audit records, resource storage | AI Agent / MCP gateway, marketplace, integrations, syncers, LDAP admin |
| Business | — | Products, plans, pricing, orders, payments, subscriptions, coupons, transactions |

Everything above is configured in the web console — no config-file edits or redeploys to change branding, providers or sign-in methods.

## Quick start

### One-command local environment

[`dev.sh`](dev.sh) wraps the common flows:

```bash
./dev.sh dev      # local development: SQLite backend (go run) + Vite hot reload, zero deps
./dev.sh test     # Docker test env: STANDARD image + MySQL 8, smoke-verified
./dev.sh smoke    # quick smoke test: ALLINONE image (SQLite) in a single container
./dev.sh down     # stop test/smoke
./dev.sh clean    # remove containers, volumes, images and local build artifacts
```

`./dev.sh dev` serves the frontend at <http://localhost:7001> (API proxied to the backend on `:8000`).
`./dev.sh test` and `./dev.sh smoke` verify `/api/health` and the login page before printing the URL.
Ports are overridable via `BACKEND_PORT` / `SMOKE_PORT` / `FRONTEND_PORT` / `DB_PORT` environment variables.

### All-in-one (evaluation)

Build and run the `ALLINONE` image — it bundles SQLite and starts with zero configuration:

```bash
docker build --target ALLINONE -t masdoor-all-in-one .
docker run -p 8000:8000 masdoor-all-in-one
```

Open <http://localhost:8000> and sign in with organization `built-in`, username `admin`, password `123`. **Change this password immediately.** Data lives inside the container — fine for a look, not for real use.

### Docker Compose (recommended)

[`docker-compose.yml`](docker-compose.yml) starts Masdoor next to MySQL 8. The compose file overrides
the database settings through environment variables (`dataSourceName: root:123456@tcp(db:3306)/`), so no
config edits are needed — `./dev.sh test` or:

```bash
docker compose up --build
```

The compose entrypoint passes `--createDatabase=true`, so the database is created for you.
The MySQL data lives in the `mysql-data` volume. For a single-machine deployment SQLite also works:

```ini
driverName = sqlite
dataSourceName = file:masdoor.db?cache=shared&_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)
```

### Kubernetes — Helm

The chart in [`manifests/masdoor/`](manifests/masdoor) deploys to a cluster (Helm v3):

```bash
helm install masdoor ./manifests/masdoor
```

Expose it through an Ingress (or `kubectl port-forward svc/<service> 8000:8000` for a quick test) and point it at an external database via the chart values. [`k8s.yaml`](k8s.yaml) is a minimal plain-manifest alternative.

### From source

Prerequisites: **Go 1.26+**, **Node.js 20+**, **Yarn 1.x**.

```bash
git clone https://github.com/mahoo12138/masdoor.git
cd masdoor
cd web && yarn install && yarn build && cd ..
go run main.go
```

For frontend development run `yarn dev` in [`web/`](web) for hot reload (port 7001) while `go run main.go` serves the API.

## Configuration

All keys live in [`conf/app.conf`](conf/app.conf). The ones you are most likely to touch:

| Key | Meaning |
|-----|---------|
| `driverName` / `dataSourceName` / `dbName` | Database connection (MySQL, PostgreSQL, SQLite, …) |
| `origin` / `originFrontend` | Public URLs of the server and the console |
| `staticBaseUrl` | Base URL for static assets (logos, CSS) |
| `initDataFile` | Optional JSON applied at startup (declarative org/app/user setup) |
| `redisEndpoint` | Optional Redis for the OAuth device-authorization flow |

Kubernetes deployments can mount `app.conf` from a Secret instead of the values file (see the chart README).

## Staying in sync with upstream

Masdoor tracks [Casdoor](https://github.com/casdoor/casdoor). To pull upstream improvements without re-applying the trim by hand:

```bash
git remote add upstream https://github.com/casdoor/casdoor.git
git fetch upstream
git rebase upstream/master   # or: git merge upstream/master
```

Expect conflicts in the usual hotspots — that is the trim meeting upstream's additions:

- `go.mod` / imports: upstream keeps adding packages this fork deleted (`ldap`, `scim`, `pp`, `mcp`, …); drop the import lines again.
- `routers/router.go`: upstream registers routes for removed controllers; delete those `web.Router` lines.
- `object/`: upstream models (Product, Plan, Subscription, …) and fields (Balance, Hash, …) were removed; discard theirs.
- `web/src/`: removed pages, backends and menu entries reappear in merges; re-delete them.
- `conf/app.conf`, `manifests/`: upstream config keys for removed servers reappear; drop them.

After each sync, run the regression checks below before deploying.

## Regression checklist

After an upgrade or an upstream merge, verify at minimum:

1. `go build ./...` and `cd web && yarn build` pass.
2. Username/password login, email/SMS code login and registration work.
3. An OAuth 2.0 / OIDC client can complete the code flow and receive a valid ID token (`state`, `nonce` and PKCE intact).
4. WebAuthn / Passkey and TOTP MFA enrollment + login work.
5. Application → UI Customization still changes the login page (logo, colors, custom CSS) and the custom HTML/CSS sanitising still rejects script injection.
6. Removed endpoints answer 404 (e.g. `/api/get-products`, `/api/saml/metadata`, `/api/get-ldap-users`).

## Security notes

- CSRF protection for cookie-authenticated API calls, PKCE for public clients and `nonce` verification in the OIDC flow are all preserved — they were part of the kept core, not the trim.
- Custom login-page HTML/CSS goes through the upstream sanitising logic; do not weaken it, it is the XSS boundary for the theming feature.
- The admin account created by `init_data` ships with a well-known password — change it on first sign-in.

## License

Apache 2.0, same as upstream Casdoor. See [LICENSE](LICENSE).
