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

import * as React from "react";
import {Navigate, Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {ConsoleDisabledPage} from "@/components/common/ConsoleDisabledPage";
import {Loading} from "@/components/common/Loading";
import {AppLayout} from "@/components/layout/AppLayout";
import {useAccount} from "@/hooks/use-account";
import {useAccountHelmet} from "@/hooks/use-application-chrome";
import * as Auth from "@/auth/Auth";
import * as Conf from "@/Conf";
import * as Setting from "@/lib/setting";

// ---- console pages -----------------------------------------------------------
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const NotFoundPage = React.lazy(() => import("@/pages/NotFoundPage"));
const AccountPage = React.lazy(() => import("@/pages/AccountPage"));
const MfaSetupPage = React.lazy(() => import("@/pages/auth/MfaSetupPage"));
const SystemInfoPage = React.lazy(() => import("@/pages/SystemInfoPage"));
const SettingEditPage = React.lazy(() => import("@/pages/SettingEditPage"));

const OrganizationListPage = React.lazy(() => import("@/pages/OrganizationListPage"));
const OrganizationEditPage = React.lazy(() => import("@/pages/OrganizationEditPage"));
const UserListPage = React.lazy(() => import("@/pages/UserListPage"));
const UserEditPage = React.lazy(() => import("@/pages/UserEditPage"));
const GroupListPage = React.lazy(() => import("@/pages/GroupListPage"));
const GroupEditPage = React.lazy(() => import("@/pages/GroupEditPage"));
const GroupTreePage = React.lazy(() => import("@/pages/GroupTreePage"));
const InvitationListPage = React.lazy(() => import("@/pages/InvitationListPage"));
const InvitationEditPage = React.lazy(() => import("@/pages/InvitationEditPage"));

const ApplicationListPage = React.lazy(() => import("@/pages/ApplicationListPage"));
const ApplicationEditPage = React.lazy(() => import("@/pages/ApplicationEditPage"));
const ProviderListPage = React.lazy(() => import("@/pages/ProviderListPage"));
const ProviderEditPage = React.lazy(() => import("@/pages/ProviderEditPage"));
const ResourceListPage = React.lazy(() => import("@/pages/ResourceListPage"));
const CertListPage = React.lazy(() => import("@/pages/CertListPage"));
const CertEditPage = React.lazy(() => import("@/pages/CertEditPage"));
const KeyListPage = React.lazy(() => import("@/pages/KeyListPage"));
const KeyEditPage = React.lazy(() => import("@/pages/KeyEditPage"));

const RoleListPage = React.lazy(() => import("@/pages/RoleListPage"));
const RoleEditPage = React.lazy(() => import("@/pages/RoleEditPage"));


const SessionListPage = React.lazy(() => import("@/pages/SessionListPage"));
const RecordListPage = React.lazy(() => import("@/pages/RecordListPage"));
const TokenListPage = React.lazy(() => import("@/pages/TokenListPage"));
const TokenEditPage = React.lazy(() => import("@/pages/TokenEditPage"));
const VerificationListPage = React.lazy(() => import("@/pages/VerificationListPage"));


const WebhookListPage = React.lazy(() => import("@/pages/WebhookListPage"));
const WebhookEditPage = React.lazy(() => import("@/pages/WebhookEditPage"));
const WebhookEventListPage = React.lazy(() => import("@/pages/WebhookEventListPage"));

// ---- public pages ------------------------------------------------------------
const LoginPage = React.lazy(() => import("@/pages/auth/LoginPage"));
const SignupPage = React.lazy(() => import("@/pages/auth/SignupPage"));
const ForgetPage = React.lazy(() => import("@/pages/auth/ForgetPage"));
const UpdatePasswordPage = React.lazy(() => import("@/pages/auth/UpdatePasswordPage"));
const InitAdminPage = React.lazy(() => import("@/pages/auth/InitAdminPage"));
const AuthCallback = React.lazy(() => import("@/pages/auth/AuthCallback"));
const ResultPage = React.lazy(() => import("@/pages/auth/ResultPage"));
const ConsentPage = React.lazy(() => import("@/pages/auth/ConsentPage"));
const PromptPage = React.lazy(() => import("@/pages/auth/PromptPage"));
const CaptchaPage = React.lazy(() => import("@/pages/auth/CaptchaPage"));
const OidcDiscoveryPage = React.lazy(() => import("@/pages/auth/OidcDiscoveryPage"));

Setting.initServerUrl();
Setting.initWebConfig();
Auth.initAuthWithConfig({
  serverUrl: Setting.ServerUrl,
  appName: Conf.DefaultApplication,
});

/**
 * When the organization marks an MFA item as "Required" and the user has not set
 * it up yet, Masdoor parks them on the setup wizard right after sign-in.
 */
function useRequiredMfaRedirect() {
  const {account} = useAccount();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!account || location.pathname.startsWith("/mfa/setup")) {
      return;
    }
    if (!Setting.isRequiredEnableMfa(account, account.organization)) {
      return;
    }
    const mfaType = Setting.getMfaItemsByRules(account, account.organization, [Setting.MfaRuleRequired]).find(
      (item: any) => item.rule === Setting.MfaRuleRequired,
    )?.name;
    if (mfaType !== undefined) {
      navigate(`/mfa/setup?mfaType=${mfaType}`, {state: {from: "/login"}});
    }
  }, [account, navigate, location.pathname]);
}

/** Sends anonymous visitors to the sign-in page of their organization. */
function RequireAuth({children}: {children: React.ReactNode}) {
  const {account, loading} = useAccount();
  const location = useLocation();

  if (loading || account === undefined) {
    return <Loading className="min-h-screen" />;
  }
  if (account === null) {
    const lastOrg = localStorage.getItem("lastLoginOrg");
    const to = lastOrg && lastOrg !== "built-in" ? `/login/${lastOrg}` : "/login";
    return <Navigate to={to} replace state={{from: location.pathname + location.search}} />;
  }
  // the console stays closed until a flagged account has picked a new password
  if (account.needUpdatePassword) {
    return <Navigate to="/update-password" replace />;
  }
  return <>{children}</>;
}

/**
 * "IdP-only" mode: an organization can keep its regular users out of the console
 * entirely, leaving them the sign-in pages and nothing else. The MFA setup wizard
 * stays reachable because a required-MFA organization parks users there right
 * after sign-in.
 */
function RequireConsoleAccess({children}: {children: React.ReactNode}) {
  const {account} = useAccount();
  const location = useLocation();

  if (
    account?.organization?.disableConsole &&
    !Setting.isLocalAdminUser(account) &&
    !location.pathname.startsWith("/mfa/setup")
  ) {
    return <ConsoleDisabledPage />;
  }
  return <>{children}</>;
}

export default function App() {
  const {account} = useAccount();
  useAccountHelmet(account);
  useRequiredMfaRedirect();

  return (
    <React.Suspense fallback={<Loading className="min-h-screen" />}>
      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<LoginPage type="login" />} />
        <Route path="/login/:owner" element={<LoginPage type="login" />} />
        <Route path="/login/oauth/authorize" element={<LoginPage type="code" />} />
        <Route path="/login/oauth/device/:userCode" element={<LoginPage type="device" />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/:applicationName" element={<SignupPage />} />
        <Route path="/signup/oauth/authorize" element={<SignupPage />} />
        <Route path="/forget" element={<ForgetPage />} />
        <Route path="/forget/:applicationName" element={<ForgetPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/update-password/:applicationName" element={<UpdatePasswordPage />} />
        <Route path="/init-admin" element={<InitAdminPage />} />
        <Route path="/callback" element={<AuthCallback />} />
        <Route path="/captcha" element={<CaptchaPage />} />
        <Route path="/.well-known/openid-configuration" element={<OidcDiscoveryPage />} />
        <Route path="/consent/:applicationName" element={<ConsentPage />} />
        <Route path="/prompt" element={<PromptPage />} />
        <Route path="/prompt/:applicationName" element={<PromptPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/result/:applicationName" element={<ResultPage />} />

        {/* Console */}
        <Route
          element={
            <RequireAuth>
              <RequireConsoleAccess>
                <AppLayout />
              </RequireConsoleAccess>
            </RequireAuth>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/mfa/setup" element={<MfaSetupPage />} />
          <Route path="/sysinfo" element={<SystemInfoPage />} />
          <Route path="/settings" element={<SettingEditPage />} />

          <Route path="/organizations" element={<OrganizationListPage />} />
          <Route path="/organizations/:organizationName" element={<OrganizationEditPage />} />
          <Route path="/organizations/:organizationName/users" element={<UserListPage />} />
          <Route path="/users" element={<UserListPage />} />
          <Route path="/users/:organizationName/:userName" element={<UserEditPage />} />
          <Route path="/groups" element={<GroupListPage />} />
          <Route path="/groups/:organizationName/:groupName" element={<GroupEditPage />} />
          <Route path="/trees/:organizationName" element={<GroupTreePage />} />
          <Route path="/trees/:organizationName/:groupName" element={<GroupTreePage />} />
          <Route path="/invitations" element={<InvitationListPage />} />
          <Route path="/invitations/:organizationName/:invitationName" element={<InvitationEditPage />} />

          <Route path="/applications" element={<ApplicationListPage />} />
          <Route path="/applications/:organizationName/:applicationName" element={<ApplicationEditPage />} />
          <Route path="/providers" element={<ProviderListPage />} />
          <Route path="/providers/:organizationName/:providerName" element={<ProviderEditPage />} />
          <Route path="/resources" element={<ResourceListPage />} />
          <Route path="/certs" element={<CertListPage />} />
          <Route path="/certs/:organizationName/:certName" element={<CertEditPage />} />
          <Route path="/keys" element={<KeyListPage />} />
          <Route path="/keys/:organizationName/:keyName" element={<KeyEditPage />} />

          <Route path="/roles" element={<RoleListPage />} />
          <Route path="/roles/:organizationName/:roleName" element={<RoleEditPage />} />


          <Route path="/sessions" element={<SessionListPage />} />
          <Route path="/records" element={<RecordListPage />} />
          <Route path="/tokens" element={<TokenListPage />} />
          <Route path="/tokens/:tokenName" element={<TokenEditPage />} />
          <Route path="/verifications" element={<VerificationListPage />} />


          <Route path="/webhooks" element={<WebhookListPage />} />
          <Route path="/webhooks/:webhookName" element={<WebhookEditPage />} />
          <Route path="/webhook-events" element={<WebhookEventListPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </React.Suspense>
  );
}
