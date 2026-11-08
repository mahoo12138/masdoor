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

//go:build !skipCi

package object

import (
	"path/filepath"
	"testing"

	"github.com/xorm-io/xorm"
)

func TestRepairLegacyUpstreamUrlsOn(t *testing.T) {
	engine, err := xorm.NewEngine("sqlite", filepath.Join(t.TempDir(), "repair.db"))
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	defer engine.Close()

	for _, ddl := range []string{
		"CREATE TABLE organization (owner VARCHAR(100), name VARCHAR(100), website_url VARCHAR(200), favicon VARCHAR(200), default_avatar VARCHAR(200))",
		"CREATE TABLE application (owner VARCHAR(100), name VARCHAR(100), homepage_url VARCHAR(100), logo VARCHAR(200), logo_dark VARCHAR(200), favicon VARCHAR(200))",
		"CREATE TABLE user (owner VARCHAR(100), name VARCHAR(100), avatar VARCHAR(200))",
	} {
		if _, err := engine.Exec(ddl); err != nil {
			t.Fatalf("create table: %v", err)
		}
	}

	legacyOrg := "https://cdn.casbin.org/img/casbin"
	seed := []string{
		"INSERT INTO organization VALUES ('admin', 'built-in', 'https://casdoor.org', '" + legacyOrg + ".svg', '" + legacyOrg + ".svg')",
		"INSERT INTO organization VALUES ('admin', 'kept', 'https://mysite.example', '/img/favicon.png', '/img/avatar-default.svg')",
		"INSERT INTO application VALUES ('admin', 'app-built-in', 'https://casdoor.org', 'https://cdn.casdoor.com/img/casdoor.png', '', '')",
		"INSERT INTO application VALUES ('admin', 'kept', 'https://myapp.example', '/img/masdoor-logo.png', '/img/masdoor-logo-dark.png', '/img/favicon.png')",
		"INSERT INTO user VALUES ('built-in', 'admin', 'https://cdn.casbin.org/img/casbin.svg')",
		"INSERT INTO user VALUES ('built-in', 'kept', '/img/avatar-default.svg')",
	}
	for _, stmt := range seed {
		if _, err := engine.Exec(stmt); err != nil {
			t.Fatalf("seed: %v (%s)", err, stmt)
		}
	}

	repairLegacyUpstreamUrlsOn(engine, "")

	scalar := func(query string) string {
		rows, err := engine.QueryString(query)
		if err != nil || len(rows) != 1 {
			t.Fatalf("query %q: %v rows=%d", query, err, len(rows))
		}
		for _, v := range rows[0] {
			return v
		}
		return ""
	}

	cases := []struct{ query, want string }{
		{"SELECT website_url FROM organization WHERE name = 'built-in'", "https://example.com"},
		{"SELECT favicon FROM organization WHERE name = 'built-in'", "/img/favicon.png"},
		{"SELECT default_avatar FROM organization WHERE name = 'built-in'", "/img/avatar-default.svg"},
		{"SELECT website_url FROM organization WHERE name = 'kept'", "https://mysite.example"},
		{"SELECT homepage_url FROM application WHERE name = 'app-built-in'", ""},
		{"SELECT logo FROM application WHERE name = 'app-built-in'", "/img/masdoor-logo.png"},
		{"SELECT homepage_url FROM application WHERE name = 'kept'", "https://myapp.example"},
		{"SELECT avatar FROM user WHERE name = 'admin'", "/img/avatar-default.svg"},
		{"SELECT avatar FROM user WHERE name = 'kept'", "/img/avatar-default.svg"},
	}
	for _, c := range cases {
		if got := scalar(c.query); got != c.want {
			t.Errorf("%s = %q, want %q", c.query, got, c.want)
		}
	}
}
