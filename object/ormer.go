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

package object

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/beego/beego/v2/server/web"
	"github.com/mahoo12138/masdoor/conf"
	"github.com/mahoo12138/masdoor/util"
	"github.com/xorm-io/xorm"
	"github.com/xorm-io/xorm/names"
	_ "modernc.org/sqlite" // db = sqlite
)

const (
	defaultConfigPath     = "conf/app.conf"
	defaultExportFilePath = "init_data_dump.json"
)

var (
	ormer          *Ormer = nil
	configPath            = defaultConfigPath
	exportData            = false
	exportFilePath        = defaultExportFilePath
)

func InitFlag() {
	configPathPtr := flag.String("config", defaultConfigPath, "set it to \"/your/path/app.conf\" if your config file is not in: \"/conf/app.conf\"")
	exportDataPtr := flag.Bool("export", false, "export database to JSON file and exit (use -exportPath to specify custom location)")
	exportFilePathPtr := flag.String("exportPath", defaultExportFilePath, "path to the exported data file (used with -export)")
	flag.Parse()

	configPath = *configPathPtr
	exportData = *exportDataPtr
	exportFilePath = *exportFilePathPtr

	// Load beego config from the specified config path
	err := web.LoadAppConfig("ini", configPath)
	if err != nil {
		panic(fmt.Sprintf("failed to load config from %s: %v", configPath, err))
	}
}

func ShouldExportData() bool {
	return exportData
}

func GetExportFilePath() string {
	return exportFilePath
}

func InitConfig() {
	err := web.LoadAppConfig("ini", "../conf/app.conf")
	if err != nil {
		panic(err)
	}

	web.BConfig.WebConfig.Session.SessionOn = true

	InitAdapter()
	CreateTables()
}

func InitAdapter() {
	// a missing config file yields an empty DSN; sqlite cannot open without one
	if conf.GetConfigDataSourceName() == "" && !util.FileExist(configPath) {
		dir, err := os.Getwd()
		if err != nil {
			panic(err)
		}
		dir = strings.ReplaceAll(dir, "\\", "/")
		panic(fmt.Sprintf("The Masdoor config file: \"app.conf\" was not found, it should be placed at: \"%s/conf/app.conf\"", dir))
	}

	var err error
	ormer, err = NewAdapter(conf.GetConfigDataSourceName())
	if err != nil {
		panic(err)
	}

	tableNamePrefix := conf.GetConfigString("tableNamePrefix")
	tbMapper := names.NewPrefixMapper(names.SnakeMapper{}, tableNamePrefix)
	ormer.Engine.SetTableMapper(tbMapper)
}

func CreateTables() {
	ormer.createTable()
}

// Ormer is the sqlite-backed storage handle around the xorm engine.
type Ormer struct {
	Engine *xorm.Engine
}

// finalizer is the destructor for Ormer.
func finalizer(a *Ormer) {
	if a.Engine != nil {
		err := a.Engine.Close()
		if err != nil {
			panic(err)
		}
		a.Engine = nil
	}
}

// NewAdapter is the constructor for Ormer.
func NewAdapter(dataSourceName string) (*Ormer, error) {
	a := &Ormer{}

	// Open the DB, create it if not existed.
	err := a.open(dataSourceName)
	if err != nil {
		return nil, err
	}

	// Call the destructor when the object is released.
	runtime.SetFinalizer(a, finalizer)

	return a, nil
}

func (a *Ormer) open(dataSourceName string) error {
	if err := ensureSqliteParentDir(dataSourceName); err != nil {
		return err
	}
	engine, err := xorm.NewEngine("sqlite", dataSourceName)
	if err != nil {
		return err
	}

	a.Engine = engine
	return nil
}

// ensureSqliteParentDir creates the parent directory of a sqlite database file
// so the driver can create the database file itself (e.g. the "data/" directory
// for "file:data/masdoor.db"). In-memory databases are skipped.
func ensureSqliteParentDir(dataSourceName string) error {
	path, _ := strings.CutPrefix(dataSourceName, "file:")
	path, _, _ = strings.Cut(path, "?")
	if path == "" || path == ":memory:" {
		return nil
	}

	dir := filepath.Dir(path)
	if dir == "" || dir == "." {
		return nil
	}
	return os.MkdirAll(dir, 0o755)
}

func (a *Ormer) close() {
	runtime.SetFinalizer(a, nil)
	finalizer(a)
}

func (a *Ormer) createTable() {
	showSql := conf.GetConfigBool("showSql")
	a.Engine.ShowSQL(showSql)

	err := a.Engine.Sync2(new(Organization))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(Group))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(User))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(Invitation))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(Application))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(Provider))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(Resource))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(Cert))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(Key))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(Role))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(Session))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(Token))
	if err != nil {
		panic(err)
	}

	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(Record))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(Webhook))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(WebhookEvent))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(VerificationRecord))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(MagicLink))
	if err != nil {
		panic(err)
	}

	if err != nil {
		panic(err)
	}

	if err != nil {
		panic(err)
	}

	if err != nil {
		panic(err)
	}

	if err != nil {
		panic(err)
	}

	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(ThirdPartyLink))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(PasswordHistory))
	if err != nil {
		panic(err)
	}

	err = a.Engine.Sync2(new(Setting))
	if err != nil {
		panic(err)
	}
}
