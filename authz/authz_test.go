// Copyright 2026 The Masdoor Authors. All Rights Reserved.
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

package authz

import "testing"

func TestApiPolicyParses(t *testing.T) {
	InitApi()

	if len(apiRules) == 0 {
		t.Fatal("the API policy table parsed to zero rules")
	}

	for _, rule := range apiRules {
		if rule.method == "" || rule.urlPath == "" {
			t.Fatalf("incomplete rule parsed: %+v", rule)
		}
	}
}

func TestKeyMatch2(t *testing.T) {
	cases := []struct {
		path    string
		pattern string
		want    bool
	}{
		{"/api/login/oauth/authorize", "/api/login/oauth/*", true},
		{"/api/login/oauth", "/api/login/oauth/*", false},
		{"/.well-known/myapp/jwks", "/.well-known/:application/jwks", true},
		{"/.well-known/myapp/jwks/extra", "/.well-known/:application/jwks", false},
		{"/api/get-user", "/api/get-user", true},
		{"/api/get-users", "/api/get-user", false},
	}

	for _, c := range cases {
		if got := keyMatch2(c.path, c.pattern); got != c.want {
			t.Errorf("keyMatch2(%q, %q) = %v, want %v", c.path, c.pattern, got, c.want)
		}
	}
}

func TestEnforce(t *testing.T) {
	InitApi()

	cases := []struct {
		name                               string
		subOwner, subName, method, urlPath string
		objOwner, objName                  string
		want                               bool
	}{
		{"anonymous can sign in", "anonymous", "anonymous", "POST", "/api/login", "", "", true},
		{"anonymous can read the login page state", "anonymous", "anonymous", "GET", "/api/get-account", "", "", true},
		{"anonymous cannot write users", "anonymous", "anonymous", "POST", "/api/update-user", "", "", false},
		{"anonymous cannot list users", "anonymous", "anonymous", "GET", "/api/get-users", "", "", false},
		{"anonymous can read discovery", "anonymous", "anonymous", "GET", "/.well-known/openid-configuration", "", "", true},
		{"built-in admin rules cover everything", "built-in", "admin", "POST", "/api/delete-application", "", "", true},
		{"built-in members are all admins", "built-in", "member", "POST", "/api/delete-application", "", "", true},
		{"global method wildcard", "built-in", "admin", "PATCH", "/api/webhook", "", "", true},
		{"subject may act on itself", "team", "alice", "POST", "/api/some-new-api", "team", "alice", true},
		{"subject may not act on a stranger", "team", "alice", "POST", "/api/some-new-api", "team", "bob", false},
		{"other organization", "team", "alice", "GET", "/api/get-users", "team", "", false},
	}

	for _, c := range cases {
		if got := enforce(c.subOwner, c.subName, c.method, c.urlPath, c.objOwner, c.objName); got != c.want {
			t.Errorf("%s: enforce(%q, %q, %q, %q, %q, %q) = %v, want %v",
				c.name, c.subOwner, c.subName, c.method, c.urlPath, c.objOwner, c.objName, got, c.want)
		}
	}
}

func TestDropNonUserSelfObject(t *testing.T) {
	// a user acting on itself keeps the self-match only for APIs whose object is a user
	if got := dropNonUserSelfObject("built-in", "alice", "/api/get-user", "built-in", "alice"); got != "alice" {
		t.Errorf("the object of a user API should stay, got %q", got)
	}

	// anywhere else the object is dropped, so the self-match cannot authorize
	// running the request against the caller's own row
	if got := dropNonUserSelfObject("built-in", "alice", "/api/mcp", "built-in", "alice"); got != "" {
		t.Errorf("the object of a non-user API should be dropped, got %q", got)
	}
}
