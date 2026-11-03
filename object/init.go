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
	"crypto/sha256"
	"encoding/gob"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"

	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/mahoo12138/masdoor/conf"
	"github.com/mahoo12138/masdoor/i18n"
	"github.com/mahoo12138/masdoor/util"
	"github.com/xorm-io/core"
)

func InitDb() {
	existed := initBuiltInOrganization()
	if !existed {
		initBuiltInProvider()
		initBuiltInUser()
		initBuiltInApplication()
		initBuiltInCert()
	}

	warnPublicBuiltInCert()
	initWebAuthn()
}

func GetDefaultAccountItems() []*AccountItem {
	return []*AccountItem{
		{Name: "Organization", Visible: true, ViewRule: "Public", ModifyRule: "Admin"},
		{Name: "ID", Visible: true, ViewRule: "Public", ModifyRule: "Immutable"},
		{Name: "Name", Visible: true, ViewRule: "Public", ModifyRule: "Admin"},
		{Name: "Display name", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "First name", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Last name", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Avatar", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "User type", Visible: true, ViewRule: "Public", ModifyRule: "Admin"},
		{Name: "Password", Visible: true, ViewRule: "Self", ModifyRule: "Self"},
		{Name: "Email", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Phone", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Country code", Visible: true, ViewRule: "Public", ModifyRule: "Admin"},
		{Name: "Country/Region", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Location", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Address", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Addresses", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Affiliation", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Title", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "ID card type", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "ID card", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "ID card info", Visible: true, ViewRule: "Self", ModifyRule: "Self"},
		{Name: "Real name", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Homepage", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Bio", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Tag", Visible: true, ViewRule: "Public", ModifyRule: "Admin"},
		{Name: "Language", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Gender", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Birthday", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "Education", Visible: true, ViewRule: "Public", ModifyRule: "Self"},
		{Name: "UID number", Visible: true, ViewRule: "Admin", ModifyRule: "Admin"},
		{Name: "Signup application", Visible: true, ViewRule: "Public", ModifyRule: "Admin"},
		{Name: "Register type", Visible: true, ViewRule: "Public", ModifyRule: "Admin"},
		{Name: "Register source", Visible: true, ViewRule: "Public", ModifyRule: "Admin"},
		{Name: "Roles", Visible: true, ViewRule: "Public", ModifyRule: "Immutable"},
		{Name: "Groups", Visible: true, ViewRule: "Public", ModifyRule: "Admin"},
		{Name: "Consents", Visible: true, ViewRule: "Self", ModifyRule: "Self"},
		{Name: "3rd-party logins", Visible: true, ViewRule: "Self", ModifyRule: "Self"},
		{Name: "Properties", Visible: true, ViewRule: "Admin", ModifyRule: "Admin"},
		{Name: "Is online", Visible: true, ViewRule: "Admin", ModifyRule: "Admin"},
		{Name: "Is admin", Visible: true, ViewRule: "Admin", ModifyRule: "Admin"},
		{Name: "Is forbidden", Visible: true, ViewRule: "Admin", ModifyRule: "Admin"},
		{Name: "Is deleted", Visible: true, ViewRule: "Admin", ModifyRule: "Admin"},
		{Name: "Multi-factor authentication", Visible: true, ViewRule: "Self", ModifyRule: "Self"},
		{Name: "MFA items", Visible: true, ViewRule: "Self", ModifyRule: "Self"},
		{Name: "WebAuthn credentials", Visible: true, ViewRule: "Self", ModifyRule: "Self"},
		{Name: "Last change password time", Visible: true, ViewRule: "Admin", ModifyRule: "Admin"},
		{Name: "Deleted time", Visible: true, ViewRule: "Admin", ModifyRule: "Admin"},
		{Name: "Last signin time", Visible: true, ViewRule: "Self", ModifyRule: "Admin"},
		{Name: "Last signin IP", Visible: true, ViewRule: "Self", ModifyRule: "Admin"},
		{Name: "Managed accounts", Visible: true, ViewRule: "Self", ModifyRule: "Self"},
		{Name: "MFA accounts", Visible: true, ViewRule: "Self", ModifyRule: "Self"},
		{Name: "Need update password", Visible: true, ViewRule: "Admin", ModifyRule: "Admin"},
		{Name: "IP whitelist", Visible: true, ViewRule: "Admin", ModifyRule: "Admin"},
	}
}

func initBuiltInOrganization() bool {
	organization, err := getOrganization("admin", "built-in")
	if err != nil {
		panic(err)
	}

	if organization != nil {
		return true
	}

	organization = &Organization{
		Owner:              "admin",
		Name:               "built-in",
		CreatedTime:        util.GetCurrentTime(),
		DisplayName:        "Built-in Organization",
		WebsiteUrl:         "https://example.com",
		Favicon:            "/img/favicon.png",
		PasswordType:       "bcrypt",
		PasswordOptions:    []string{"AtLeast6"},
		CountryCodes:       []string{"US", "ES", "FR", "DE", "GB", "CN", "JP", "KR", "VN", "ID", "SG", "IN"},
		DefaultAvatar:      "/img/avatar-default.svg",
		DefaultTokenFormat: "JWT",
		DefaultTokenFields: []string{},
		UserTypes:          []string{},
		Tags:               []string{},
		Languages:          []string{"en", "es", "fr", "de", "ja", "zh", "vi", "pt", "tr", "pl", "uk"},
		AccountItems:       GetDefaultAccountItems(),
		EnableSoftDeletion: false,
		IsProfilePublic:    false,
		UseEmailAsUsername: false,
		EnableTour:         true,
		DcrPolicy:          "disabled",
	}
	_, err = AddOrganization(organization)
	if err != nil {
		panic(err)
	}

	return false
}

func initBuiltInUser() {
	user, err := getUser("built-in", "admin")
	if err != nil {
		panic(err)
	}
	if user != nil {
		return
	}

	user = &User{
		Owner:             "built-in",
		Name:              "admin",
		CreatedTime:       util.GetCurrentTime(),
		Id:                util.GenerateId(),
		Type:              "normal-user",
		Password:          getInitAdminPassword(),
		DisplayName:       "Admin",
		Avatar:            "/img/avatar-default.svg",
		Email:             "admin@example.com",
		Phone:             "12345678910",
		CountryCode:       "US",
		Address:           []string{},
		Affiliation:       "Example Inc.",
		Tag:               "staff",
		IsAdmin:           true,
		IsForbidden:       false,
		IsDeleted:         false,
		SignupApplication: "app-built-in",
		RegisterType:      "Add User",
		RegisterSource:    "built-in/admin",
		CreatedIp:         "127.0.0.1",
		Properties:        make(map[string]string),
	}
	_, err = AddUser(user, "en")
	if err != nil {
		panic(err)
	}

	if user.Password == "" {
		fmt.Println("The password of built-in/admin is not set, open Masdoor in the browser to set it, or set initAdminPassword before the first start")
	}
}

// getInitAdminPassword is the password of built-in/admin when it is created. Without initAdminPassword the
// password is left empty and set on the welcome page, the demo site keeps the well-known "123".
func getInitAdminPassword() string {
	password := conf.GetConfigString("initAdminPassword")
	if password == "" && (conf.IsDemoMode() || conf.IsDemoDatabase()) {
		return "123"
	}
	return password
}

// IsInitAdminPending tells whether built-in/admin has never had a password and is waiting for one on the welcome page
func IsInitAdminPending() (bool, error) {
	user, err := getUser("built-in", "admin")
	if err != nil {
		return false, err
	}

	return user != nil && !user.IsDeleted && user.Password == "" && user.LastSigninTime == "", nil
}

// SetInitAdminPassword sets the first password of built-in/admin. It returns false if the password has been set
// in the meantime, only the first request wins.
func SetInitAdminPassword(password string, lang string) (bool, error) {
	isPending, err := IsInitAdminPending()
	if err != nil {
		return false, err
	}
	if !isPending {
		return false, nil
	}

	user, err := getUser("built-in", "admin")
	if err != nil {
		return false, err
	}

	organization, err := GetOrganizationByUser(user)
	if err != nil {
		return false, err
	}
	if organization == nil {
		return false, errors.New(i18n.Translate(lang, "check:Organization does not exist"))
	}

	if password == "" {
		return false, errors.New(i18n.Translate(lang, "check:Password cannot be empty"))
	}
	if strings.Contains(password, " ") {
		return false, errors.New(i18n.Translate(lang, "user:New password cannot contain blank space."))
	}
	msg := CheckPasswordComplexityByOrg(organization, password, lang)
	if msg != "" {
		return false, errors.New(msg)
	}

	user.Password = password
	user.UpdateUserPassword(organization)
	user.LastChangePasswordTime = util.GetCurrentTime()
	user.UpdatedTime = user.LastChangePasswordTime

	affected, err := ormer.Engine.ID(core.PK{user.Owner, user.Name}).Where("password = ?", "").
		Cols("password", "password_salt", "password_type", "last_change_password_time", "updated_time").Update(user)
	if err != nil {
		return false, err
	}
	return affected != 0, nil
}

func initBuiltInApplication() {
	application, err := getApplication("admin", "app-built-in")
	if err != nil {
		panic(err)
	}

	if application != nil {
		return
	}

	application = &Application{
		Owner:          "admin",
		Name:           "app-built-in",
		CreatedTime:    util.GetCurrentTime(),
		DisplayName:    "Masdoor",
		Category:       "Default",
		Type:           "All",
		Scopes:         []*ScopeItem{},
		Logo:           "/img/masdoor-logo.png",
		HomepageUrl:    "",
		Organization:   "built-in",
		Cert:           "cert-built-in",
		EnablePassword: true,
		EnableSignUp:   true,
		Providers: []*ProviderItem{
			{Name: "provider_captcha_default", CanSignUp: false, CanSignIn: false, CanUnlink: false, Prompted: false, SignupGroup: "", Rule: "None", Provider: nil},
		},
		SigninMethods: []*SigninMethod{
			{Name: "Password", DisplayName: "Password", Rule: "All"},
			{Name: "Verification code", DisplayName: "Verification code", Rule: "All"},
			{Name: "WebAuthn", DisplayName: "WebAuthn", Rule: "None"},
		},
		SignupItems: []*SignupItem{
			{Name: "ID", Visible: false, Required: true, Prompted: false, Rule: "Random"},
			{Name: "Logo", Visible: true, Required: false, Prompted: false, Rule: "None"},
			{Name: "Username", Visible: true, Required: true, Prompted: false, Rule: "None"},
			{Name: "Display name", Visible: true, Required: true, Prompted: false, Rule: "None"},
			{Name: "Password", Visible: true, Required: true, Prompted: false, Rule: "None"},
			{Name: "Confirm password", Visible: true, Required: true, Prompted: false, Rule: "None"},
			{Name: "Email", Visible: true, Required: true, Prompted: false, Rule: "Normal"},
			{Name: "Phone", Visible: true, Required: true, Prompted: false, Rule: "None"},
			{Name: "Agreement", Visible: true, Required: true, Prompted: false, Rule: "None"},
			{Name: "Languages", Visible: true, Required: false, Prompted: false, Rule: "None"},
		},
		Tags:          []string{},
		RedirectUris:  []string{},
		TokenFormat:   "JWT",
		TokenFields:   []string{},
		ExpireInHours: 168,
		FormOffset:    2,

		CookieExpireInHours: 720,
	}
	_, err = AddApplication(application, "en")
	if err != nil {
		panic(err)
	}
}

func initBuiltInCert() {
	cert, err := getCert("admin", "cert-built-in")
	if err != nil {
		panic(err)
	}

	if cert != nil {
		return
	}

	// the Certificate and PrivateKey are left empty for AddCert() to generate a new key pair,
	// the one used by the old versions is public in the repository
	cert = &Cert{
		Owner:           "admin",
		Name:            "cert-built-in",
		CreatedTime:     util.GetCurrentTime(),
		DisplayName:     "Built-in Cert",
		Scope:           "JWT",
		Type:            "x509",
		CryptoAlgorithm: "RS256",
		BitSize:         4096,
		ExpireInYears:   20,
	}
	_, err = AddCert(cert)
	if err != nil {
		panic(err)
	}
}

// the SHA-256 of the private key that the old versions created cert-built-in with, it was published in the repository
const publicBuiltInPrivateKeySha256 = "69cb4de40b4ffd09564cdad858a60f4666f0a9aa1d88331c97a5438ccef69012"

func warnPublicBuiltInCert() {
	cert, err := getCert("admin", "cert-built-in")
	if err != nil || cert == nil {
		return
	}

	privateKey := strings.TrimSpace(strings.ReplaceAll(cert.PrivateKey, "\r", ""))
	hash := sha256.Sum256([]byte(privateKey))
	if hex.EncodeToString(hash[:]) == publicBuiltInPrivateKeySha256 {
		fmt.Printf("WARNING: the cert: %s signs tokens with the private key published in the Masdoor repository, anyone can forge its tokens, please generate a new key pair for it\n", cert.GetId())
	}
}

func initBuiltInProvider() {
	providers := []*Provider{
		{
			Owner:       "admin",
			Name:        "provider_captcha_default",
			CreatedTime: util.GetCurrentTime(),
			DisplayName: "Captcha Default",
			Category:    "Captcha",
			Type:        "Default",
		},
	}

	for _, provider := range providers {
		existingProvider, err := GetProvider(util.GetId("admin", provider.Name))
		if err != nil {
			panic(err)
		}

		if existingProvider != nil {
			continue
		}

		_, err = AddProvider(provider)
		if err != nil {
			panic(err)
		}
	}
}

func initWebAuthn() {
	gob.Register(webauthn.SessionData{})
}
