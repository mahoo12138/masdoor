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
// instead of a half-working controller.
var removedRoutes = []string{
	// Casbin permission platform
	"/api/get-permissions", "/api/get-permission", "/api/add-permission",
	"/api/update-permission", "/api/update-permissions", "/api/delete-permission",
	"/api/upload-permissions", "/api/enforce", "/api/batch-enforce",
	"/api/get-all-objects", "/api/get-all-actions", "/api/get-all-roles",
	"/api/get-models", "/api/get-model", "/api/add-model", "/api/update-model", "/api/delete-model",
	"/api/get-adapters", "/api/get-adapter", "/api/add-adapter", "/api/update-adapter", "/api/delete-adapter",
	"/api/get-policies", "/api/get-filtered-policies", "/api/add-policy", "/api/update-policy", "/api/remove-policy",
	"/api/get-enforcers", "/api/get-enforcer", "/api/add-enforcer", "/api/update-enforcer", "/api/delete-enforcer",
	// site hosting and WAF rules
	"/api/get-sites", "/api/get-site", "/api/add-site", "/api/update-site", "/api/delete-site", "/api/get-global-sites",
	"/api/get-rules", "/api/get-rule", "/api/add-rule", "/api/update-rule", "/api/delete-rule",
	// custom forms and tickets
	"/api/get-forms", "/api/get-form", "/api/add-form", "/api/update-form", "/api/delete-form", "/api/get-global-forms",
	"/api/get-tickets", "/api/get-ticket", "/api/add-ticket", "/api/update-ticket", "/api/delete-ticket",
	// xlsx bulk import
	"/api/upload-users", "/api/upload-roles", "/api/upload-groups",
	// FaceID / IDV
	"/api/verify-identification",
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
