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

package main

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/beego/beego/v2/core/logs"
	"github.com/beego/beego/v2/server/web"
	_ "github.com/beego/beego/v2/server/web/session/redis"
	_ "github.com/beego/beego/v2/server/web/session/redis_cluster"
	"github.com/mahoo12138/masdoor/authz"
	"github.com/mahoo12138/masdoor/conf"
	"github.com/mahoo12138/masdoor/object"
	"github.com/mahoo12138/masdoor/proxy"
	"github.com/mahoo12138/masdoor/routers"
	"github.com/mahoo12138/masdoor/util"
)

func main() {
	if util.RunAsService(runServer) {
		return
	}

	runServer()
}

func runServer() {
	web.BConfig.WebConfig.Session.SessionOn = true
	web.BConfig.WebConfig.Session.SessionName = "masdoor_session_id"
	if redisConfig := conf.GetRedisConfig(); redisConfig == nil {
		web.BConfig.WebConfig.Session.SessionProvider = routers.FileSessionProvider
		web.BConfig.WebConfig.Session.SessionProviderConfig = "./tmp"
	} else {
		web.BConfig.WebConfig.Session.SessionProvider, web.BConfig.WebConfig.Session.SessionProviderConfig = redisConfig.GetSessionProvider()
	}
	sessionCookieLifeTime := 3600 * 24 * 30
	if val, err := conf.GetConfigInt64("sessionCookieLifeTime"); err == nil && val > 0 {
		sessionCookieLifeTime = int(val)
	}
	web.BConfig.WebConfig.Session.SessionCookieLifeTime = sessionCookieLifeTime
	web.BConfig.WebConfig.Session.SessionGCMaxLifetime = int64(sessionCookieLifeTime)
	// web.BConfig.WebConfig.Session.SessionCookieSameSite = http.SameSiteNoneMode

	routers.InitAPI()
	object.InitFlag()
	object.InitAdapter()
	object.CreateTables()

	object.InitDb()
	object.InitSetting()

	// Handle export command
	if object.ShouldExportData() {
		exportPath := object.GetExportFilePath()
		err := object.DumpToFile(exportPath)
		if err != nil {
			panic(fmt.Sprintf("Error exporting data to %s: %v", exportPath, err))
		}
		fmt.Printf("Data exported successfully to %s\n", exportPath)
		return
	}

	object.InitDefaultStorageProvider()
	proxy.InitHttpClient()
	authz.InitApi()
	object.InitFromFile()
	object.InitCleanupTokens()
	object.InitCleanupRecords()
	object.InitCleanupDeviceAuthMap()

	// web.DelStaticPath("/static")
	// web.SetStaticPath("/assets", "web/build/assets")

	web.BConfig.WebConfig.DirectoryIndex = true
	if web.BConfig.RunMode == "dev" {
		web.SetStaticPath("/swagger", routers.GetSwaggerFolder())
	}
	web.SetStaticPath("/files", "files")
	// https://studygolang.com/articles/2303
	web.InsertFilter("*", web.BeforeStatic, routers.RequestBodyFilter)
	web.InsertFilter("*", web.BeforeStatic, routers.ContentTypeFilter)
	web.InsertFilter("*", web.BeforeStatic, routers.UploadedFileFilter)
	web.InsertFilter("*", web.BeforeRouter, routers.StaticFilter)
	web.InsertFilter("*", web.BeforeRouter, routers.AutoSigninFilter)
	web.InsertFilter("*", web.BeforeRouter, routers.CorsFilter)
	web.InsertFilter("*", web.BeforeRouter, routers.TimeoutFilter)
	web.InsertFilter("*", web.BeforeRouter, routers.ApiFilter)
	web.InsertFilter("*", web.BeforeRouter, routers.PrometheusFilter)
	web.InsertFilter("*", web.BeforeRouter, routers.RecordMessage)
	web.InsertFilter("*", web.BeforeRouter, routers.FieldValidationFilter)
	web.InsertFilter("*", web.AfterExec, routers.AfterRecordMessage, web.WithReturnOnOutput(false))

	var logAdapter string
	logConfigMap := make(map[string]interface{})
	err := json.Unmarshal([]byte(conf.GetConfigString("logConfig")), &logConfigMap)
	if err != nil {
		panic(err)
	}
	_, ok := logConfigMap["adapter"]
	if !ok {
		logAdapter = "file"
	} else {
		logAdapter = logConfigMap["adapter"].(string)
	}
	if logAdapter == "console" {
		logs.Reset()
	}
	err = logs.SetLogger(logAdapter, conf.GetConfigString("logConfig"))
	if err != nil {
		panic(err)
	}

	port := 8000
	if v := conf.GetConfigString("httpport"); v != "" {
		if p, err := strconv.Atoi(v); err == nil && p > 0 {
			port = p
		}
	}
	// logs.SetLevel(logs.LevelInformational)
	logs.SetLogFuncCall(false)

	err = util.StopOldInstance(port)
	if err != nil {
		panic(err)
	}

	go object.ClearThroughputPerSecond()

	// Start webhook delivery worker
	object.StartWebhookDeliveryWorker()

	web.RunWithMiddleWares(fmt.Sprintf(":%v", port), routers.BasePathMiddleware)
}
