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

// Package routers
// @APIVersion 1.503.0
// @Title Masdoor RESTful API
// @Description Swagger Docs of Masdoor Backend API
// @Contact casbin@googlegroups.com
// @SecurityDefinition AccessToken apiKey Authorization header
// @Schemes https,http
// @ExternalDocs Find out more about Masdoor
// @ExternalDocsUrl https://github.com/mahoo12138/masdoor
package routers

import (
	"github.com/beego/beego/v2/server/web"
	"github.com/mahoo12138/masdoor/controllers"
)

func InitAPI() {
	ns := web.NewNamespace("/",
		web.NSNamespace("/api",
			web.NSInclude(
				&controllers.ApiController{},
			),
		),
		web.NSNamespace("",
			web.NSInclude(
				&controllers.RootController{},
			),
		),
	)
	web.AddNamespace(ns)

	web.Router("/api/signup", &controllers.ApiController{}, "POST:Signup")
	web.Router("/api/login", &controllers.ApiController{}, "POST:Login")
	web.Router("/api/get-app-login", &controllers.ApiController{}, "GET:GetApplicationLogin")
	web.Router("/api/get-dashboard", &controllers.ApiController{}, "GET:GetDashboard")
	web.Router("/api/get-dashboard-providers", &controllers.ApiController{}, "GET:GetDashboardProviderDistribution")
	web.Router("/api/get-dashboard-mfa", &controllers.ApiController{}, "GET:GetDashboardMfaCoverage")
	web.Router("/api/get-dashboard-heatmap", &controllers.ApiController{}, "GET:GetDashboardLoginHeatmap")
	web.Router("/api/logout", &controllers.ApiController{}, "GET,POST:Logout")
	web.Router("/api/sso-logout", &controllers.ApiController{}, "GET,POST:SsoLogout")
	web.Router("/api/get-account", &controllers.ApiController{}, "GET:GetAccount")
	web.Router("/api/userinfo", &controllers.ApiController{}, "GET,POST:GetUserinfo")
	web.Router("/api/user", &controllers.ApiController{}, "GET:GetUserinfo2")
	web.Router("/api/unlink", &controllers.ApiController{}, "POST:Unlink")
	web.Router("/api/get-captcha-status", &controllers.ApiController{}, "GET:GetCaptchaStatus")
	web.Router("/api/callback", &controllers.ApiController{}, "POST:Callback")
	web.Router("/api/device-auth", &controllers.ApiController{}, "POST:DeviceAuth")
	web.Router("/api/cancel-device-auth", &controllers.ApiController{}, "POST:CancelDeviceAuth")
	web.Router("/api/device-auth-complete", &controllers.ApiController{}, "POST:DeviceAuthComplete")

	web.Router("/api/get-organizations", &controllers.ApiController{}, "GET:GetOrganizations")
	web.Router("/api/get-organization", &controllers.ApiController{}, "GET:GetOrganization")
	web.Router("/api/update-organization", &controllers.ApiController{}, "POST:UpdateOrganization")
	web.Router("/api/add-organization", &controllers.ApiController{}, "POST:AddOrganization")
	web.Router("/api/delete-organization", &controllers.ApiController{}, "POST:DeleteOrganization")
	web.Router("/api/get-default-application", &controllers.ApiController{}, "GET:GetDefaultApplication")
	web.Router("/api/get-organization-names", &controllers.ApiController{}, "GET:GetOrganizationNames")

	web.Router("/api/get-groups", &controllers.ApiController{}, "GET:GetGroups")
	web.Router("/api/get-group", &controllers.ApiController{}, "GET:GetGroup")
	web.Router("/api/update-group", &controllers.ApiController{}, "POST:UpdateGroup")
	web.Router("/api/add-group", &controllers.ApiController{}, "POST:AddGroup")
	web.Router("/api/delete-group", &controllers.ApiController{}, "POST:DeleteGroup")

	web.Router("/api/get-global-users", &controllers.ApiController{}, "GET:GetGlobalUsers")
	web.Router("/api/get-users", &controllers.ApiController{}, "GET:GetUsers")
	web.Router("/api/get-sorted-users", &controllers.ApiController{}, "GET:GetSortedUsers")
	web.Router("/api/get-user-count", &controllers.ApiController{}, "GET:GetUserCount")
	web.Router("/api/get-user", &controllers.ApiController{}, "GET:GetUser")
	web.Router("/api/update-user", &controllers.ApiController{}, "POST:UpdateUser")
	web.Router("/api/add-user", &controllers.ApiController{}, "POST:AddUser")
	web.Router("/api/delete-user", &controllers.ApiController{}, "POST:DeleteUser")
	web.Router("/api/remove-user-from-group", &controllers.ApiController{}, "POST:RemoveUserFromGroup")
	web.Router("/api/impersonate-user", &controllers.ApiController{}, "POST:ImpersonateUser")
	web.Router("/api/exit-impersonate-user", &controllers.ApiController{}, "POST:ExitImpersonateUser")

	web.Router("/api/get-invitations", &controllers.ApiController{}, "GET:GetInvitations")
	web.Router("/api/get-invitation", &controllers.ApiController{}, "GET:GetInvitation")
	web.Router("/api/get-invitation-info", &controllers.ApiController{}, "GET:GetInvitationCodeInfo")
	web.Router("/api/update-invitation", &controllers.ApiController{}, "POST:UpdateInvitation")
	web.Router("/api/add-invitation", &controllers.ApiController{}, "POST:AddInvitation")
	web.Router("/api/delete-invitation", &controllers.ApiController{}, "POST:DeleteInvitation")
	web.Router("/api/verify-invitation", &controllers.ApiController{}, "GET:VerifyInvitation")
	web.Router("/api/send-invitation", &controllers.ApiController{}, "POST:SendInvitation")

	web.Router("/api/get-applications", &controllers.ApiController{}, "GET:GetApplications")
	web.Router("/api/get-application", &controllers.ApiController{}, "GET:GetApplication")
	web.Router("/api/get-user-application", &controllers.ApiController{}, "GET:GetUserApplication")
	web.Router("/api/get-organization-applications", &controllers.ApiController{}, "GET:GetOrganizationApplications")
	web.Router("/api/update-application", &controllers.ApiController{}, "POST:UpdateApplication")
	web.Router("/api/add-application", &controllers.ApiController{}, "POST:AddApplication")
	web.Router("/api/delete-application", &controllers.ApiController{}, "POST:DeleteApplication")

	web.Router("/api/get-providers", &controllers.ApiController{}, "GET:GetProviders")
	web.Router("/api/get-provider", &controllers.ApiController{}, "GET:GetProvider")
	web.Router("/api/get-global-providers", &controllers.ApiController{}, "GET:GetGlobalProviders")
	web.Router("/api/get-idp-discovery", &controllers.ApiController{}, "GET:GetIdpDiscovery")
	web.Router("/api/update-provider", &controllers.ApiController{}, "POST:UpdateProvider")
	web.Router("/api/add-provider", &controllers.ApiController{}, "POST:AddProvider")
	web.Router("/api/delete-provider", &controllers.ApiController{}, "POST:DeleteProvider")

	web.Router("/api/get-resources", &controllers.ApiController{}, "GET:GetResources")
	web.Router("/api/get-resource", &controllers.ApiController{}, "GET:GetResource")
	web.Router("/api/update-resource", &controllers.ApiController{}, "POST:UpdateResource")
	web.Router("/api/add-resource", &controllers.ApiController{}, "POST:AddResource")
	web.Router("/api/delete-resource", &controllers.ApiController{}, "POST:DeleteResource")
	web.Router("/api/upload-resource", &controllers.ApiController{}, "POST:UploadResource")



	web.Router("/api/get-certs", &controllers.ApiController{}, "GET:GetCerts")
	web.Router("/api/get-global-certs", &controllers.ApiController{}, "GET:GetGlobalCerts")
	web.Router("/api/get-cert", &controllers.ApiController{}, "GET:GetCert")
	web.Router("/api/update-cert", &controllers.ApiController{}, "POST:UpdateCert")
	web.Router("/api/add-cert", &controllers.ApiController{}, "POST:AddCert")
	web.Router("/api/delete-cert", &controllers.ApiController{}, "POST:DeleteCert")
	web.Router("/api/update-cert-domain-expire", &controllers.ApiController{}, "POST:UpdateCertDomainExpire")

	web.Router("/api/get-keys", &controllers.ApiController{}, "GET:GetKeys")
	web.Router("/api/get-global-keys", &controllers.ApiController{}, "GET:GetGlobalKeys")
	web.Router("/api/get-key", &controllers.ApiController{}, "GET:GetKey")
	web.Router("/api/update-key", &controllers.ApiController{}, "POST:UpdateKey")
	web.Router("/api/add-key", &controllers.ApiController{}, "POST:AddKey")
	web.Router("/api/delete-key", &controllers.ApiController{}, "POST:DeleteKey")

	web.Router("/api/get-roles", &controllers.ApiController{}, "GET:GetRoles")
	web.Router("/api/get-role", &controllers.ApiController{}, "GET:GetRole")
	web.Router("/api/update-role", &controllers.ApiController{}, "POST:UpdateRole")
	web.Router("/api/add-role", &controllers.ApiController{}, "POST:AddRole")
	web.Router("/api/delete-role", &controllers.ApiController{}, "POST:DeleteRole")

	web.Router("/api/get-sessions", &controllers.ApiController{}, "GET:GetSessions")
	web.Router("/api/get-session", &controllers.ApiController{}, "GET:GetSingleSession")
	web.Router("/api/update-session", &controllers.ApiController{}, "POST:UpdateSession")
	web.Router("/api/add-session", &controllers.ApiController{}, "POST:AddSession")
	web.Router("/api/delete-session", &controllers.ApiController{}, "POST:DeleteSession")
	web.Router("/api/is-session-duplicated", &controllers.ApiController{}, "GET:IsSessionDuplicated")

	web.Router("/api/get-tokens", &controllers.ApiController{}, "GET:GetTokens")
	web.Router("/api/get-token", &controllers.ApiController{}, "GET:GetToken")
	web.Router("/api/update-token", &controllers.ApiController{}, "POST:UpdateToken")
	web.Router("/api/add-token", &controllers.ApiController{}, "POST:AddToken")
	web.Router("/api/delete-token", &controllers.ApiController{}, "POST:DeleteToken")

	web.Router("/api/get-system-info", &controllers.ApiController{}, "GET:GetSystemInfo")
	web.Router("/api/get-version-info", &controllers.ApiController{}, "GET:GetVersionInfo")
	web.Router("/api/get-setting", &controllers.ApiController{}, "GET:GetSetting")
	web.Router("/api/update-setting", &controllers.ApiController{}, "POST:UpdateSetting")
	web.Router("/api/health", &controllers.ApiController{}, "GET:Health")
	web.Router("/api/get-prometheus-info", &controllers.ApiController{}, "GET:GetPrometheusInfo")
	web.Router("/api/metrics", &controllers.ApiController{}, "GET:GetMetrics")


	web.Router("/api/get-webhooks", &controllers.ApiController{}, "GET:GetWebhooks")
	web.Router("/api/get-webhook", &controllers.ApiController{}, "GET:GetWebhook")
	web.Router("/api/update-webhook", &controllers.ApiController{}, "POST:UpdateWebhook")
	web.Router("/api/add-webhook", &controllers.ApiController{}, "POST:AddWebhook")
	web.Router("/api/delete-webhook", &controllers.ApiController{}, "POST:DeleteWebhook")

	// Webhook event routes
	web.Router("/api/get-webhook-events", &controllers.ApiController{}, "GET:GetWebhookEvents")
	web.Router("/api/get-webhook-event-detail", &controllers.ApiController{}, "GET:GetWebhookEvent")
	web.Router("/api/replay-webhook-event", &controllers.ApiController{}, "POST:ReplayWebhookEvent")
	web.Router("/api/delete-webhook-event", &controllers.ApiController{}, "POST:DeleteWebhookEvent")


	web.Router("/api/set-password", &controllers.ApiController{}, "POST:SetPassword")
	web.Router("/api/get-init-admin-status", &controllers.ApiController{}, "GET:GetInitAdminStatus")
	web.Router("/api/init-admin-password", &controllers.ApiController{}, "POST:InitAdminPassword")
	web.Router("/api/check-user-password", &controllers.ApiController{}, "POST:CheckUserPassword")
	web.Router("/api/get-email-and-phone", &controllers.ApiController{}, "GET:GetEmailAndPhone")
	web.Router("/api/send-verification-code", &controllers.ApiController{}, "POST:SendVerificationCode")
	web.Router("/api/verify-code", &controllers.ApiController{}, "POST:VerifyCode")
	web.Router("/api/verify-captcha", &controllers.ApiController{}, "POST:VerifyCaptcha")
	web.Router("/api/reset-email-or-phone", &controllers.ApiController{}, "POST:ResetEmailOrPhone")
	web.Router("/api/get-captcha", &controllers.ApiController{}, "GET:GetCaptcha")
	web.Router("/api/get-verifications", &controllers.ApiController{}, "GET:GetVerifications")

	web.Router("/api/login/oauth/access_token", &controllers.ApiController{}, "POST:GetOAuthToken")
	web.Router("/api/login/oauth/refresh_token", &controllers.ApiController{}, "POST:RefreshToken")
	web.Router("/api/login/oauth/introspect", &controllers.ApiController{}, "POST:IntrospectToken")
	web.Router("/api/login/oauth/revoke", &controllers.ApiController{}, "POST:RevokeToken")
	web.Router("/api/oauth/register", &controllers.ApiController{}, "POST:DynamicClientRegister")
	web.Router("/api/oauth/register/:clientId", &controllers.ApiController{}, "GET:DynamicClientRead;PUT:DynamicClientUpdate;DELETE:DynamicClientDelete")

	web.Router("/api/get-records", &controllers.ApiController{}, "GET:GetRecords")
	web.Router("/api/get-records-filter", &controllers.ApiController{}, "POST:GetRecordsByFilter")
	web.Router("/api/add-record", &controllers.ApiController{}, "POST:AddRecord")

	web.Router("/api/send-email", &controllers.ApiController{}, "POST:SendEmail")
	web.Router("/api/send-notification", &controllers.ApiController{}, "POST:SendNotification")

	web.Router("/api/webauthn/signup/begin", &controllers.ApiController{}, "GET:WebAuthnSignupBegin")
	web.Router("/api/webauthn/signup/finish", &controllers.ApiController{}, "POST:WebAuthnSignupFinish")
	web.Router("/api/webauthn/signin/begin", &controllers.ApiController{}, "GET:WebAuthnSigninBegin")
	web.Router("/api/webauthn/signin/finish", &controllers.ApiController{}, "POST:WebAuthnSigninFinish")

	web.Router("/api/mfa/setup/initiate", &controllers.ApiController{}, "POST:MfaSetupInitiate")
	web.Router("/api/mfa/setup/verify", &controllers.ApiController{}, "POST:MfaSetupVerify")
	web.Router("/api/mfa/setup/enable", &controllers.ApiController{}, "POST:MfaSetupEnable")
	web.Router("/api/delete-mfa", &controllers.ApiController{}, "POST:DeleteMfa")
	web.Router("/api/set-preferred-mfa", &controllers.ApiController{}, "POST:SetPreferredMfa")

	web.Router("/api/grant-consent", &controllers.ApiController{}, "POST:GrantConsent")
	web.Router("/api/revoke-consent", &controllers.ApiController{}, "POST:RevokeConsent")

	web.Router("/.well-known/openid-configuration", &controllers.RootController{}, "GET:GetOidcDiscovery")
	web.Router("/.well-known/:application/openid-configuration", &controllers.RootController{}, "GET:GetOidcDiscoveryByApplication")
	web.Router("/.well-known/oauth-authorization-server", &controllers.RootController{}, "GET:GetOAuthServerMetadata")
	web.Router("/.well-known/:application/oauth-authorization-server", &controllers.RootController{}, "GET:GetOAuthServerMetadataByApplication")
	web.Router("/.well-known/jwks", &controllers.RootController{}, "*:GetJwks")
	web.Router("/.well-known/:application/jwks", &controllers.RootController{}, "*:GetJwksByApplication")
	web.Router("/.well-known/webfinger", &controllers.RootController{}, "GET:GetWebFinger")
	web.Router("/.well-known/:application/webfinger", &controllers.RootController{}, "GET:GetWebFingerByApplication")
	web.Router("/.well-known/oauth-protected-resource", &controllers.RootController{}, "GET:GetOauthProtectedResourceMetadata")
	web.Router("/.well-known/:application/oauth-protected-resource", &controllers.RootController{}, "GET:GetOauthProtectedResourceMetadataByApplication")

}
