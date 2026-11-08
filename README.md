<div align="center">
  <h1>Masdoor</h1>
  <p><strong>A personal / family self-hosted identity and access management system</strong></p>
  <p>Started as a trimmed fork of <a href="https://github.com/casdoor/casdoor">Casdoor</a>; the code has since diverged and no longer tracks upstream.</p>
</div>

## What is Masdoor

Masdoor is a self-hosted identity provider (IdP): it stores your users, issues tokens, and gives you a small admin console. Your applications delegate login to it over **OAuth 2.0 / OIDC**, so they never handle passwords themselves.

This fork exists because the upstream Casdoor is a full enterprise IAM platform, while a personal or family deployment only needs a fraction of it. Masdoor keeps what a small self-hosted setup actually uses and removes the rest — smaller binary, smaller attack surface, fewer moving parts.

## Feature scope

| Area | Kept | Removed |
|------|------|---------|
| Protocols | OAuth 2.0, OIDC | SAML 2.0, CAS, LDAP, RADIUS, SCIM, Kerberos |
| Users | Registration, password / email code login, WebAuthn / Passkey, TOTP & MFA, account linking | SMS code login, Face ID login |
| Applications | Multi-app OAuth/OIDC clients, PKCE, device flow | — |
| Login page | Full theming: logo, colors, CSS/HTML slots, sign-in method layout (应用设置 → UI Customization) | — |
| Providers | Social login: Google, GitHub, GitLab, Gitea (+ custom OIDC); email: SMTP, Resend; storage: local disk, MinIO/S3; notifications: Bark, Telegram, WeCom, custom HTTP webhook | SMS, Face ID, ID verification, WeChat login, SAML providers, 50+ other goth adapters, cloud OSS (Aliyun/Tencent/Azure/GCS/七牛), SendGrid/Azure ACS |
| Ops | Webhooks, audit records, resource storage | Sites / reverse proxy + ACME certs + WAF rules, tickets, forms, xlsx bulk import, AI Agent / MCP gateway, marketplace, integrations, syncers, LDAP admin |
| Business | — | Products, plans, pricing, orders, payments, subscriptions, coupons, transactions |

Everything above is configured in the web console — no config-file edits or redeploys to change branding, providers or sign-in methods.

## Quick start

### One-command local environment

[`dev.sh`](dev.sh) wraps the common flows:

```bash
./dev.sh dev         # local development: SQLite backend (go run) + Vite hot reload, zero deps
./dev.sh test        # Docker test env: STANDARD image + SQLite, smoke-verified
./dev.sh smoke       # quick smoke test: ALLINONE image (SQLite) in a single container
./dev.sh down        # stop test/smoke
./dev.sh clean       # remove containers, volumes, images and local build artifacts
```

`./dev.sh dev` serves the frontend at <http://localhost:7001> (API proxied to the backend on `:8000`)
and signs in as `built-in` / `admin` with the password `123` (`MASDOOR_DEV_PASSWORD` overrides it for
fresh databases). `./dev.sh test` and `./dev.sh smoke` verify `/api/health` and the login page before
printing the URL. Ports are overridable via `BACKEND_PORT` / `SMOKE_PORT` / `FRONTEND_PORT`.

### All-in-one (evaluation)

Build and run the `ALLINONE` image — it bundles SQLite and starts with zero configuration:

```bash
docker build --target ALLINONE -t masdoor-all-in-one .
docker run -p 8000:8000 masdoor-all-in-one
```

Open <http://localhost:8000> — the first visit lands on a welcome page where you set the `built-in` / `admin` password. Data lives inside the container — fine for a look, not for real use.

### Docker Compose (recommended)

[`docker-compose.yml`](docker-compose.yml) starts Masdoor with SQLite — no database server needed.
The SQLite file lives in the `masdoor-data` volume (mounted at `/data`):

```bash
docker compose up --build
```

The first visit lands on a welcome page where you set the `built-in` / `admin` password. To run
without Docker, [`conf/app.conf`](conf/app.conf) already defaults to SQLite at `data/masdoor.db`:

```ini
dataSourceName = file:data/masdoor.db?cache=shared&_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)
```

### Kubernetes — Helm

The chart in [`manifests/masdoor/`](manifests/masdoor) deploys to a cluster (Helm v3):

```bash
helm install masdoor ./manifests/masdoor
```

Expose it through an Ingress (or `kubectl port-forward svc/<service> 8000:8000` for a quick test) and mount a volume for the SQLite file via the chart values. [`k8s.yaml`](k8s.yaml) is a minimal plain-manifest alternative.

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
| `dataSourceName` | SQLite connection (the only database; file DSN by default) |
| `origin` / `originFrontend` | Public URLs of the server and the console |
| `initDataFile` | Optional JSON applied at startup (declarative org/app/user setup) |
| `redisEndpoint` | Optional Redis for the OAuth device-authorization flow |

Kubernetes deployments can mount `app.conf` from a Secret instead of the values file (see the chart README).

## Regression checklist

After an upgrade or an upstream merge, verify at minimum:

1. `go build ./...` and `cd web && yarn build` pass.
2. Username/password login, email code login and registration work.
3. An OAuth 2.0 / OIDC client can complete the code flow and receive a valid ID token (`state`, `nonce` and PKCE intact).
4. WebAuthn / Passkey and TOTP MFA enrollment + login work.
5. Application → UI Customization still changes the login page (logo, colors, custom CSS) and the custom HTML/CSS sanitising still rejects script injection.
6. Removed endpoints stay unreachable (e.g. `/api/get-permissions`, `/api/upload-users`, `/api/get-sites`) — `go test ./routers/` asserts this automatically.
7. `go test ./...` passes (`go vet ./...` too; CI runs both).

## Footprint

Measured on the STANDARD image after the trim (arm64, SQLite, idle):

- **Image size: ~105 MB** (static binary + embedded frontend build, no Node in the runtime).
- **Resident memory: ~19 MB** at idle; runs comfortably under a `--memory=256m` container limit with health checks, the login page and the OAuth token endpoints all responding.
- The shipped image runs with `runmode = prod` (dev-only swagger UI is compiled out of the routing); local `./dev.sh dev` stays in `dev` mode.

## Upgrading

- **Data first:** the database is a single SQLite file (`data/masdoor.db` by default, or the `masdoor-data` volume in compose). Stop the container and copy that file before upgrading.
- **Schema:** XORM's `Sync2` only adds missing columns/tables on startup; it never drops anything. Tables and columns left behind by removed modules are inert — drop them manually if you want a tidy schema.
- **Stale seed rows:** an instance created by an older build can keep values that no release writes any more — `application.homepage_url = 'https://casdoor.org'`, a `Face ID` / `LDAP` entry in `application.signin_items`, and user avatars pointing at `https://cdn.casbin.org/...`. The legacy upstream URLs (organization website/favicon/default avatar, application homepage/logo, user avatar) are rewritten to the current defaults on startup; a stale `signin_items` entry only needs a manual update.
- **No upstream merges:** Masdoor no longer tracks Casdoor. Security fixes are backported manually; run the regression checklist and `go test ./...` after every pull.
- **Config drift:** new releases may add `app.conf` keys; existing keys keep their values. Check the release notes for renamed or removed keys.

## Security notes

- CSRF protection for cookie-authenticated API calls, PKCE for public clients and `nonce` verification in the OIDC flow are all preserved — they were part of the kept core, not the trim.
- Custom login-page HTML/CSS is validated on save and sanitized again at render, for every author including global admins. That is the XSS boundary of the theming feature: layout markup, images, links and styles are kept, executable script is not. Do not weaken either side.
- The admin account created by `init_data` ships with a well-known password — change it on first sign-in.

## License

Apache 2.0, same as upstream Casdoor. See [LICENSE](LICENSE).
