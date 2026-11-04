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

package idp

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"reflect"
	"time"

	"github.com/mahoo12138/masdoor/util"
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/gitea"
	"github.com/markbates/goth/providers/gitlab"
	"golang.org/x/oauth2"
)

type GothIdProvider struct {
	Provider goth.Provider
	Session  goth.Session
}

func NewGothIdProvider(providerType string, clientId string, clientSecret string, clientId2 string, clientSecret2 string, redirectUrl string, hostUrl string) (*GothIdProvider, error) {
	var idp GothIdProvider
	switch providerType {
	case "Gitea":
		idp = GothIdProvider{
			Provider: gitea.New(clientId, clientSecret, redirectUrl),
			Session:  &gitea.Session{},
		}
	case "GitLab":
		idp = GothIdProvider{
			Provider: gitlab.New(clientId, clientSecret, redirectUrl),
			Session:  &gitlab.Session{},
		}
	default:
		return nil, fmt.Errorf("OAuth Goth provider type: %s is not supported", providerType)
	}

	return &idp, nil
}

// SetHttpClient
// Goth's idp all implement the Client method, but since the goth.Provider interface does not provide to modify idp's client method, reflection is required
func (idp *GothIdProvider) SetHttpClient(client *http.Client) {
	idpClient := reflect.ValueOf(idp.Provider).Elem().FieldByName("HTTPClient")
	if idpClient.IsValid() {
		idpClient.Set(reflect.ValueOf(client))
	}
}

func (idp *GothIdProvider) GetToken(code string) (*oauth2.Token, error) {
	var expireAt time.Time
	var err error
	// Need to construct variables supported by goth
	// to call the function to obtain accessToken
	value := url.Values{}
	value.Add("code", code)
	accessToken, err := idp.Session.Authorize(idp.Provider, value)
	if err != nil {
		return nil, err
	}

	// Get ExpiresAt's value
	valueOfExpire := reflect.ValueOf(idp.Session).Elem().FieldByName("ExpiresAt")
	if valueOfExpire.IsValid() {
		expireAt = valueOfExpire.Interface().(time.Time)
	}
	token := oauth2.Token{
		AccessToken: accessToken,
		Expiry:      expireAt,
	}

	return &token, nil
}

func (idp *GothIdProvider) GetUserInfo(token *oauth2.Token) (*UserInfo, error) {
	gothUser, err := idp.Provider.FetchUser(idp.Session)
	if err != nil {
		return nil, err
	}
	return getUser(gothUser, idp.Provider.Name()), nil
}

func getUser(gothUser goth.User, provider string) *UserInfo {
	user := UserInfo{
		Id:          gothUser.UserID,
		Username:    gothUser.Name,
		DisplayName: gothUser.NickName,
		Email:       gothUser.Email,
		AvatarUrl:   gothUser.AvatarURL,
	}

	// Capture additional fields in Extra
	extra := make(map[string]string)
	if gothUser.FirstName != "" {
		extra["firstName"] = gothUser.FirstName
	}
	if gothUser.LastName != "" {
		extra["lastName"] = gothUser.LastName
	}
	if gothUser.Location != "" {
		extra["location"] = gothUser.Location
	}
	if gothUser.Description != "" {
		extra["description"] = gothUser.Description
	}
	// Add all raw data from the provider
	for k, v := range gothUser.RawData {
		if v != nil {
			switch val := v.(type) {
			case string:
				extra[k] = val
			case float64:
				extra[k] = fmt.Sprintf("%v", val)
			case bool:
				extra[k] = fmt.Sprintf("%v", val)
			default:
				// For complex types, marshal to JSON string
				if jsonVal, err := json.Marshal(val); err == nil {
					extra[k] = string(jsonVal)
				}
			}
		}
	}
	user.Extra = extra
	user.EmailVerified = isGothEmailVerified(gothUser, provider)

	// Some idp return an empty Name
	// so construct the Name with firstname and lastname or nickname
	if user.Username == "" {
		if gothUser.FirstName != "" && gothUser.LastName != "" {
			user.Username = getName(gothUser.FirstName, gothUser.LastName)
		} else {
			user.Username = gothUser.NickName
		}
	}
	if user.DisplayName == "" {
		if gothUser.FirstName != "" && gothUser.LastName != "" {
			user.DisplayName = getName(gothUser.FirstName, gothUser.LastName)
		} else {
			user.DisplayName = user.Username
		}
	}
	return &user
}

// gothEmailVerifiedProviders only ever return an email the account has confirmed.
var gothEmailVerifiedProviders = map[string]bool{
	"gitlab": true,
}

// isGothEmailVerified reports whether the provider vouches for gothUser.Email, from the
// email_verified / verified claim it returned or because it never returns unverified ones.
func isGothEmailVerified(gothUser goth.User, provider string) bool {
	if gothUser.Email == "" {
		return false
	}
	for _, key := range []string{"email_verified", "verified_email", "verified"} {
		switch v := gothUser.RawData[key].(type) {
		case bool:
			return v
		case string:
			return v == "true"
		}
	}
	return gothEmailVerifiedProviders[provider]
}

func getName(firstName, lastName string) string {
	if util.IsChinese(firstName) || util.IsChinese(lastName) {
		return fmt.Sprintf("%s%s", lastName, firstName)
	} else {
		return fmt.Sprintf("%s %s", firstName, lastName)
	}
}
