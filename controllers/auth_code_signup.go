// Copyright 2026 The Casdoor Authors. All Rights Reserved.
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

package controllers

import (
	"fmt"
	"strings"

	"github.com/mahoo12138/masdoor/form"
	"github.com/mahoo12138/masdoor/object"
	"github.com/mahoo12138/masdoor/util"
)

// answerCodeSigninSignup answers a verification-code sign-in of an email or phone that has
// no account. When the application takes signups, the code is checked but not used up: the
// signup page posts it again with the rest of the signup items, and /api/signup checks it
// the same way as a code the signup page sent itself
func (c *ApiController) answerCodeSigninSignup(application *object.Application, authForm *form.AuthForm) {
	verifyType := object.GetVerifyType(authForm.Username)
	if !application.IsCodeSigninSignupEnabled(verifyType) || !application.IsSignupAllowedFor(authForm.Organization) {
		c.ResponseError(fmt.Sprintf(c.T("general:The user: %s doesn't exist"), util.GetId(authForm.Organization, authForm.Username)))
		return
	}

	dest := strings.TrimSpace(authForm.Username)
	checkDest := dest
	countryCode := authForm.CountryCode
	if verifyType != object.VerifyTypeEmail {
		c.ResponseError("signing in with a verification code is only supported by email")
		return
	}

	clientIp := util.GetClientIpFromRequest(c.Ctx.Request)
	err := object.CheckVerifyCodeWithLimitAndIp(nil, clientIp, checkDest, authForm.Code, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(fmt.Sprintf("%s - %s", verifyType, err.Error()))
		return
	}

	c.ResponseOk(object.NextSignup, map[string]string{
		"type":        verifyType,
		"dest":        dest,
		"countryCode": countryCode,
	})
}
