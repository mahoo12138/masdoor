// Copyright 2026 The Masdoor Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package routers

import (
	"testing"

	"github.com/beego/beego/v2/server/web"
)

// registeredRoutes snapshots the patterns InitAPI registers. It is consulted
// without dispatching a request, so the test needs no database or session setup.
func registeredRoutes(t *testing.T) map[string]bool {
	t.Helper()
	set := make(map[string]bool)
	for _, info := range web.BeeApp.Handlers.GetAllControllerInfo() {
		set[info.GetPattern()] = true
	}
	return set
}

func init() {
	InitAPI()
}

// removedRoutes lists the endpoints of the modules pruned from Masdoor. The PLAN's
// regression matrix requires them to stay unregistered, so callers get a plain 404
// instead of a half-working controller. The list is the API surface of the upstream
// router at the last commit before pruning, minus what the lightweight build still serves.
var removedRoutes = []string{
	// Casbin permission platform
	"/api/get-permissions", "/api/get-permission",
	"/api/add-permission", "/api/update-permission",
	"/api/update-permissions", "/api/delete-permission",
	"/api/upload-permissions", "/api/get-permissions-by-role",
	"/api/get-permissions-by-submitter", "/api/enforce",
	"/api/batch-enforce", "/api/get-all-objects",
	"/api/get-all-actions", "/api/get-all-roles",
	"/api/get-models", "/api/get-model",
	"/api/add-model", "/api/update-model",
	"/api/delete-model", "/api/get-adapters",
	"/api/get-adapter", "/api/add-adapter",
	"/api/update-adapter", "/api/delete-adapter",
	"/api/get-policies", "/api/get-filtered-policies",
	"/api/add-policy", "/api/update-policy",
	"/api/remove-policy", "/api/get-enforcers",
	"/api/get-enforcer", "/api/add-enforcer",
	"/api/update-enforcer", "/api/delete-enforcer",

	// commercial subscription and billing
	"/api/get-product", "/api/get-products",
	"/api/add-product", "/api/update-product",
	"/api/delete-product", "/api/buy-product",
	"/api/get-order", "/api/get-orders",
	"/api/get-user-orders", "/api/add-order",
	"/api/update-order", "/api/delete-order",
	"/api/place-order", "/api/cancel-order",
	"/api/pay-order", "/api/get-payment",
	"/api/get-payments", "/api/get-user-payments",
	"/api/add-payment", "/api/update-payment",
	"/api/delete-payment", "/api/invoice-payment",
	"/api/notify-payment/?:owner/?:payment", "/api/get-pricing",
	"/api/get-pricings", "/api/add-pricing",
	"/api/update-pricing", "/api/delete-pricing",
	"/api/get-plan", "/api/get-plans",
	"/api/add-plan", "/api/update-plan",
	"/api/delete-plan", "/api/get-subscription",
	"/api/get-subscriptions", "/api/add-subscription",
	"/api/update-subscription", "/api/delete-subscription",
	"/api/set-subscription-auto-renew", "/api/get-transaction",
	"/api/get-transactions", "/api/add-transaction",
	"/api/update-transaction", "/api/delete-transaction",
	"/api/get-coupon", "/api/get-coupons",
	"/api/add-coupon", "/api/update-coupon",
	"/api/delete-coupon", "/api/validate-coupon",

	// AI agent gateway (MCP/A2A)
	"/api/mcp", "/api/get-mcp-access-token",
	"/api/sync-mcp-tool", "/api/get-agent",
	"/api/get-agents", "/api/add-agent",
	"/api/update-agent", "/api/delete-agent",
	"/api/get-openclaw-session-graph", "/api/get-openclaw-session-transcript",

	// enterprise directories and protocols
	"/api/get-ldap", "/api/get-ldaps",
	"/api/add-ldap", "/api/update-ldap",
	"/api/delete-ldap", "/api/get-ldap-users",
	"/api/sync-ldap-users", "/api/get-saml-login",
	"/api/acs", "/api/saml/metadata",
	"/api/saml/redirect/:owner/:application", "/api/saml/logout/:owner/:application",
	"/api/kerberos-login", "/api/faceid-signin-begin",
	"/api/verify-identification",

	// syncers and external data
	"/api/get-syncer", "/api/get-syncers",
	"/api/add-syncer", "/api/update-syncer",
	"/api/delete-syncer", "/api/run-syncer",
	"/api/test-syncer-db", "/api/get-integration",
	"/api/get-integrations", "/api/install-integration",
	"/api/delete-integration",

	// site hosting, ACME and WAF
	"/api/get-site", "/api/get-sites",
	"/api/get-global-sites", "/api/add-site",
	"/api/update-site", "/api/delete-site",
	"/api/get-rule", "/api/get-rules",
	"/api/add-rule", "/api/update-rule",
	"/api/delete-rule", "/api/get-entry",
	"/api/get-entries", "/api/add-entry",
	"/api/update-entry", "/api/delete-entry",

	// servers and self-upgrade
	"/api/get-server", "/api/get-servers",
	"/api/get-online-servers", "/api/add-server",
	"/api/update-server", "/api/delete-server",
	"/api/server/:owner/:name", "/api/sync-intranet-servers",
	"/api/get-upgrade-info", "/api/upgrade-system",
	"/api/get-release",

	// custom forms and tickets
	"/api/get-form", "/api/get-forms",
	"/api/get-global-forms", "/api/add-form",
	"/api/update-form", "/api/delete-form",
	"/api/get-ticket", "/api/get-tickets",
	"/api/add-ticket", "/api/update-ticket",
	"/api/delete-ticket", "/api/add-ticket-message",

	// xlsx bulk import
	"/api/upload-users", "/api/upload-roles",
	"/api/upload-groups",

	// observability receiver and misc
	"/api/v1/logs", "/api/v1/metrics",
	"/api/v1/traces", "/api/webhook",
	"/api/send-sms", "/api/get-qrcode",

	// Marketplace
	"/api/get-marketplace-index", "/api/get-marketplace-bundle",

	// security scan
	"/api/scan",
}

// keptRoutes are the load-bearing endpoints of the lightweight build. A missing
// entry here means the pruning cut into the core.
var keptRoutes = []string{
	"/api/health",
	"/api/signup",
	"/api/login",
	"/api/logout",
	"/api/sso-logout",
	"/api/callback",
	"/api/userinfo",
	"/api/login/oauth/access_token",
	"/api/login/oauth/refresh_token",
	"/api/login/oauth/introspect",
	"/api/login/oauth/revoke",
	"/api/oauth/register",
	"/api/get-applications",
	"/api/get-application",
	"/api/get-users",
	"/api/get-global-users",
	"/api/get-providers",
	"/api/get-certs",
	"/api/get-roles",
	"/api/get-sessions",
	"/api/get-tokens",
	"/api/get-organizations",
	"/api/get-app-login",
	"/api/send-verification-code",
	"/api/verify-code",
	"/api/webauthn/signup/begin",
	"/api/webauthn/signin/begin",
	"/api/mfa/setup/initiate",
	"/api/get-prometheus-info",
}

func TestRemovedModuleRoutesAreUnregistered(t *testing.T) {
	registered := registeredRoutes(t)
	for _, route := range removedRoutes {
		if registered[route] {
			t.Errorf("route %q of a removed module is still registered", route)
		}
	}
}

func TestCoreRoutesAreRegistered(t *testing.T) {
	registered := registeredRoutes(t)
	for _, route := range keptRoutes {
		if !registered[route] {
			t.Errorf("core route %q is missing from the router", route)
		}
	}
}
