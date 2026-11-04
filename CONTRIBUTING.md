# Contributing to Masdoor

Masdoor is a deliberately small project: a personal / family self-hosted IdP.
Contributions are welcome as long as they keep it that way — the bar for adding
a feature is that a one-instance family deployment actually needs it.

## Development setup

Prerequisites: **Go 1.26+**, **Node.js 20+**, **Yarn 1.x**.

```bash
./dev.sh dev          # SQLite + go run + Vite hot reload, no external services
./dev.sh test         # Dockerized test env, smoke-verified
./dev.sh down / clean # tear down
```

`./dev.sh dev` serves the frontend on <http://localhost:7001> with the API proxied to `:8000`.

## Ground rules

- **Scope discipline:** do not reintroduce the removed modules (enterprise
  directories, billing, Casbin policies, site hosting, SAML/CAS, xlsx import,
  cloud storage/email/SMS adapters). If a PR needs one of them, open an issue
  first and make the case.
- **Security invariants are non-negotiable:** the OAuth/OIDC token flow
  (PKCE, `state`, `nonce`, revocation), the session-cookie posture, and the
  login-page HTML/CSS sanitising in `object/application_html.go` /
  `object/application_util.go` must not be weakened.
- **Database:** SQLite is the default target. Any schema change must keep
  working under XORM's add-only `Sync2` (never rely on dropped columns).
- **Frontend:** keep the dependency list lean; a new runtime dependency needs a
  justification in the PR description.

## Commits

Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`,
`test:`, `build:`). The release changelog is generated from these prefixes, and
`.goreleaser.yaml` groups them by type. One logical module per commit — the
history of this repository is the reference style.

## Tests and CI

CI (`.github/workflows/ci.yml`) runs on every push/PR:

1. `go build ./...`, `go vet ./...`, `go test ./...`
2. `yarn typecheck` and `yarn build` in `web/`

Before pushing, run at least:

```bash
go vet ./... && go test ./...
cd web && yarn typecheck && yarn build
```

`routers/route_matrix_test.go` asserts that removed module endpoints stay
unregistered and core endpoints stay wired — update both lists when adding or
removing routes. Manual regression checks after a bigger change are listed in
the README's *Regression checklist*.

## Releasing

Releases are cut with GoReleaser (`.goreleaser.yaml`): it builds the frontend,
runs the version test, and archives binaries with `web/build` + `conf/app.conf`
embedded. Docker images are built from the `STANDARD` target of the
`Dockerfile`. See the README's *Upgrading* section for what release notes
should cover for operators.
