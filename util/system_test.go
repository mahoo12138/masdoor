// Copyright 2022 The Casdoor Authors. All Rights Reserved.
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

package util

import (
	"errors"
	"fmt"
	"os"
	"path"
	"regexp"
	"runtime"
	"strings"
	"testing"

	"github.com/go-git/go-git/v5"
	"github.com/stretchr/testify/assert"
)

func TestGetCpuUsage(t *testing.T) {
	usage, err := getCpuUsage()
	assert.Nil(t, err)
	t.Log(usage)
}

func TestGetMemoryUsage(t *testing.T) {
	used, total, err := getMemoryUsage()
	assert.Nil(t, err)
	t.Log(used, total)
}

func TestGetDiskUsage(t *testing.T) {
	used, total, err := getDiskUsage()
	assert.Nil(t, err)
	t.Log(used, total)
}

func TestGetNetworkUsage(t *testing.T) {
	sent, recv, total, err := getNetworkUsage()
	if err != nil && strings.Contains(err.Error(), "not implemented") {
		// gopsutil's proc.IOCounters() is unsupported on this platform (e.g. macOS)
		t.Skip("network I/O counters not implemented on this platform")
	}
	assert.Nil(t, err)
	t.Log(sent, recv, total)
}

func TestGetVersionInfo(t *testing.T) {
	versionInfo, err := GetVersionInfo()
	if errors.Is(err, git.ErrRepositoryNotExists) {
		t.Skip("no git repository, keeping the version info in variable.go")
	}
	assert.NoError(t, err)
	assert.NotNil(t, versionInfo)

	_, filename, _, _ := runtime.Caller(0)
	variablePath := path.Join(path.Dir(filename), "variable.go")

	content, err := os.ReadFile(variablePath)
	assert.NoError(t, err)

	replacements := map[*regexp.Regexp]string{
		regexp.MustCompile(`Version\s*=\s*".*"`):       fmt.Sprintf(`Version      = "%s"`, versionInfo.Version),
		regexp.MustCompile(`CommitId\s*=\s*".*"`):      fmt.Sprintf(`CommitId     = "%s"`, versionInfo.CommitId),
		regexp.MustCompile(`CommitOffset\s*=\s*-?\d+`): fmt.Sprintf(`CommitOffset = %d`, versionInfo.CommitOffset),
	}
	updated := string(content)
	for re, val := range replacements {
		updated = re.ReplaceAllString(updated, val)
	}

	err = os.WriteFile(variablePath, []byte(updated), 0o644)
	assert.NoError(t, err)
}

