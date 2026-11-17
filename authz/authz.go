// Copyright 2021 The Casdoor Authors. All Rights Reserved.
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

// Package authz guards the /api/* surface: routers/authz_filter.go builds a
// (subject, method, path, object) tuple for every request and this package
// decides whether the tuple is allowed.
//
// The rules used to live in a Casbin enforcer, but they were never editable at
// runtime: InitApi() wiped the policy and reloaded the same hard-coded table on
// every start, so the database rows were only a mirror. The table below is the
// whole policy, matched directly instead of through an enforcer, an adapter and
// two database tables.
package authz

import (
	"regexp"
	"strings"

	"github.com/mahoo12138/masdoor/conf"
	"github.com/mahoo12138/masdoor/object"
	"github.com/mahoo12138/masdoor/util"
)

// apiRule is one row of the API policy: the six fields a request is matched
// against, "*" meaning "any".
type apiRule struct {
	subOwner string
	subName  string
	method   string
	urlPath  string
	objOwner string
	objName  string
}

// apiPolicyText is the API policy, one rule per line, fields comma separated.
const apiPolicyText = `
p, built-in, *, *, *, *, *
p, app-dcr, *, *, /api/login/oauth/*, *, *
p, app-dcr, *, *, /api/get-oauth-token, *, *
p, app-dcr, *, *, /api/userinfo, *, *
p, app-dcr, *, *, /api/get-application, *, *
p, *, *, POST, /api/signup, *, *
p, *, *, GET, /api/get-email-and-phone, *, *
p, *, *, POST, /api/login, *, *
p, *, *, GET, /api/get-app-login, *, *
p, *, *, POST, /api/logout, *, *
p, *, *, GET, /api/logout, *, *
p, *, *, POST, /api/sso-logout, *, *
p, *, *, GET, /api/sso-logout, *, *
p, *, *, POST, /api/callback, *, *
p, *, *, POST, /api/device-auth, *, *
p, *, *, POST, /api/cancel-device-auth, *, *
p, *, *, POST, /api/device-auth-complete, *, *
p, *, *, GET, /api/get-account, *, *
p, *, *, GET, /api/userinfo, *, *
p, *, *, POST, /api/userinfo, *, *
p, *, *, GET, /api/user, *, *
p, *, *, GET, /api/health, *, *
p, *, *, GET, /api/get-captcha-status, *, *
p, *, *, *, /api/login/oauth, *, *
p, *, *, *, /api/oauth/register, *, *
p, *, *, GET, /api/get-application, *, *
p, *, *, GET, /api/get-organization-applications, *, *
p, *, *, GET, /api/get-user, *, *
p, *, *, GET, /api/get-user-application, *, *
p, *, *, GET, /api/get-resources, *, *
p, *, *, GET, /api/get-records, *, *
p, *, *, POST, /api/unlink, *, *
p, *, *, POST, /api/set-password, *, *
p, *, *, GET, /api/get-init-admin-status, *, *
p, *, *, POST, /api/init-admin-password, *, *
p, *, *, POST, /api/send-verification-code, *, *
p, *, *, GET, /api/get-captcha, *, *
p, *, *, POST, /api/verify-captcha, *, *
p, *, *, POST, /api/verify-code, *, *
p, *, *, POST, /api/reset-email-or-phone, *, *
p, *, *, POST, /api/upload-resource, *, *
p, *, *, GET, /.well-known/openid-configuration, *, *
p, *, *, GET, /.well-known/oauth-authorization-server, *, *
p, *, *, GET, /.well-known/oauth-protected-resource, *, *
p, *, *, GET, /.well-known/webfinger, *, *
p, *, *, *, /.well-known/jwks, *, *
p, *, *, GET, /.well-known/:application/openid-configuration, *, *
p, *, *, GET, /.well-known/:application/oauth-authorization-server, *, *
p, *, *, GET, /.well-known/:application/oauth-protected-resource, *, *
p, *, *, GET, /.well-known/:application/webfinger, *, *
p, *, *, *, /.well-known/:application/jwks, *, *
p, *, *, *, /api/webauthn, *, *
p, *, *, GET, /api/get-default-application, *, *
p, *, *, GET, /api/get-prometheus-info, *, *
p, *, *, *, /api/metrics, *, *
p, *, *, GET, /api/get-provider, *, *
p, *, *, GET, /api/get-organization-names, *, *
p, *, *, GET, /api/get-organizations, *, *
p, *, *, GET, /api/get-invitation-info, *, *
p, *, *, POST, /api/grant-consent, *, *
p, *, *, POST, /api/revoke-consent, *, *
`

var (
	apiRules []apiRule
	paramRe  = regexp.MustCompile(`:[^/]+`)
)

// InitApi parses the policy table. The rules travel with the binary, so there is
// no database, no file and no runtime state to load: the only failure mode is a
// malformed line, which panics on start instead of silently widening access.
func InitApi() {
	rules := []apiRule{}
	for _, line := range strings.Split(apiPolicyText, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		fields := strings.Split(line, ",")
		if len(fields) != 7 {
			panic("authz: invalid API policy line: " + line)
		}

		rule := apiRule{
			subOwner: strings.TrimSpace(fields[1]),
			subName:  strings.TrimSpace(fields[2]),
			method:   strings.TrimSpace(fields[3]),
			urlPath:  strings.TrimSpace(fields[4]),
			objOwner: strings.TrimSpace(fields[5]),
			objName:  strings.TrimSpace(fields[6]),
		}
		rules = append(rules, rule)
	}

	apiRules = rules
}

// match reports whether the rule covers the request.
func (rule *apiRule) match(subOwner, subName, method, urlPath, objOwner, objName string) bool {
	if !fieldMatch(rule.subOwner, subOwner) || !fieldMatch(rule.subName, subName) {
		return false
	}
	if rule.subName == "!anonymous" && subName == "anonymous" {
		return false
	}
	if !fieldMatch(rule.method, method) {
		return false
	}
	if rule.urlPath != "*" && !keyMatch2(urlPath, rule.urlPath) {
		return false
	}
	if !fieldMatch(rule.objOwner, objOwner) || !fieldMatch(rule.objName, objName) {
		return false
	}
	return true
}

func fieldMatch(pattern string, value string) bool {
	return pattern == "*" || pattern == value
}

// keyMatch2 matches a concrete path against a pattern that may hold ":param"
// segments (each standing for one path segment) and a trailing "/*".
func keyMatch2(path string, pattern string) bool {
	pattern = strings.ReplaceAll(pattern, "/*", "/.*")
	pattern = paramRe.ReplaceAllString(pattern, "[^/]+")

	matched, err := regexp.MatchString("^"+pattern+"$", path)
	if err != nil {
		return false
	}
	return matched
}

// enforce is the former Casbin matcher: a rule covers the request, or the
// subject is the object it wants to act on.
func enforce(subOwner, subName, method, urlPath, objOwner, objName string) bool {
	if subOwner == objOwner && subName == objName {
		return true
	}

	for i := range apiRules {
		if apiRules[i].match(subOwner, subName, method, urlPath, objOwner, objName) {
			return true
		}
	}
	return false
}

func IsAllowed(subOwner string, subName string, method string, urlPath string, objOwner string, objName string, extraInfo map[string]interface{}) (bool, error) {
	if conf.IsDemoMode() {
		if !isAllowedInDemoMode(subOwner, subName, method, urlPath, objOwner, objName) {
			return false, nil
		}
	}

	if subOwner == "app" {
		// An application credential is an admin of its own organization only, and a
		// global admin only when the application belongs to the built-in organization.
		appUser, err := object.GetAppUser(util.GetId(subOwner, subName))
		if err != nil {
			return false, err
		}
		if appUser == nil {
			return false, nil
		}

		if appUser.IsGlobalAdmin() || appUser.Owner == objOwner {
			return true, nil
		}
	}

	user, err := object.GetUser(util.GetId(subOwner, subName))
	if err != nil {
		return false, err
	}

	if user != nil {
		if user.IsDeleted {
			return false, nil
		}

		if user.IsGlobalAdmin() {
			return true, nil
		}

		if user.IsAdmin && subOwner == objOwner {
			return true, nil
		}
	}

	objOwner, objName = dropAnonymousSelfObject(subOwner, subName, objOwner, objName)
	objName = dropNonUserSelfObject(subOwner, subName, urlPath, objOwner, objName)

	return enforce(subOwner, subName, method, urlPath, objOwner, objName), nil
}

func dropAnonymousSelfObject(subOwner string, subName string, objOwner string, objName string) (string, string) {
	if subOwner == "anonymous" && subName == "anonymous" && objOwner == "anonymous" && objName == "anonymous" {
		return "", ""
	}
	return objOwner, objName
}

// userObjectApis lists the APIs whose object is a user (or a row keyed by the user), the
// only ones the self-match of the API model may authorize. Any other API only reads the
// owner and name of the request to authorize it, so a client could put its own ones there
// and have the request run on another object, e.g. a sent email.
var userObjectApis = []string{
	"/api/get-user",
	"/api/update-user",
	"/api/delete-user",
	"/api/check-user-password",
	"/api/remove-user-from-group",
	"/api/mfa/setup/initiate",
	"/api/mfa/setup/verify",
	"/api/mfa/setup/enable",
	"/api/delete-mfa",
	"/api/set-preferred-mfa",
	"/api/get-session",
	"/api/is-session-duplicated",
	"/api/add-session",
	"/api/update-session",
	"/api/delete-session",
	"/api/delete-resource",
}

func dropNonUserSelfObject(subOwner string, subName string, urlPath string, objOwner string, objName string) string {
	if subOwner == objOwner && subName == objName && !util.InSlice(userObjectApis, urlPath) {
		return ""
	}
	return objName
}

func isAllowedInDemoMode(subOwner string, subName string, method string, urlPath string, objOwner string, objName string) bool {
	if method == "POST" {
		if strings.HasPrefix(urlPath, "/api/login") || urlPath == "/api/logout" || urlPath == "/api/sso-logout" || urlPath == "/api/signup" || urlPath == "/api/callback" || urlPath == "/api/send-verification-code" || urlPath == "/api/send-email" || urlPath == "/api/verify-captcha" || urlPath == "/api/verify-code" || urlPath == "/api/check-user-password" || strings.HasPrefix(urlPath, "/api/mfa/") {
			return true
		} else if urlPath == "/api/update-user" {
			// Allow ordinary users to update their own information
			if (subOwner == objOwner && subName == objName || subOwner == "app") && !(subOwner == "built-in" && subName == "admin") {
				return true
			}
			return false
		} else if urlPath == "/api/upload-resource" {
			return false
		} else {
			return false
		}
	}

	// If method equals GET
	return true
}
