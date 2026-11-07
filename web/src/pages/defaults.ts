// Default objects for newly created records, ported from the `newXxx()` methods
// of the antd list pages so that a record created from the new UI is identical
// to one created from the old one.

import dayjs from "dayjs";
import * as Conf from "@/Conf";
import * as Setting from "@/lib/setting";
import {SignupTableDefaultCssMap} from "@/lib/signup-css";
import type {Account} from "@/hooks/use-account";

const now = () => dayjs().format();

export const rbacModel = `[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act`;

export function newAdapter(account: Account) {
  const randomName = Setting.getRandomName();
  const owner = Setting.getRequestOrganization(account);
  return {
    owner,
    name: `adapter_${randomName}`,
    createdTime: now(),
    table: "table_name",
    useSameDb: true,
  };
}

export function newApplication(account: Account) {
  const randomName = Setting.getRandomName();
  const organizationName = Setting.getRequestOrganization(account);
  return {
    owner: "admin",
    name: `application_${randomName}`,
    organization: organizationName,
    createdTime: now(),
    displayName: `New Application - ${randomName}`,
    category: "Default",
    type: "All",
    scopes: [],
    logo: `${Setting.StaticBaseUrl}/img/masdoor-logo.png`,
    enablePassword: true,
    enableSignUp: true,
    disableSignin: false,
    enableSigninSession: false,
    enableCodeSignin: false,
    providers: [
      {name: "provider_captcha_default", canSignUp: false, canSignIn: false, canUnlink: false, prompted: false, signupGroup: "", rule: ""},
    ],
    signinMethods: [
      {name: "Password", displayName: "Password", rule: "All"},
      {name: "Verification code", displayName: "Verification code", rule: "All"},
      {name: "WebAuthn", displayName: "WebAuthn", rule: "None"},
    ],
    signupItems: [
      {name: "ID", visible: false, required: true, rule: "Random"},
      {name: "Logo", visible: true, required: false, rule: "None", customCss: SignupTableDefaultCssMap["Logo"]},
      {name: "Username", visible: true, required: true, rule: "None"},
      {name: "Display name", visible: true, required: true, rule: "None"},
      {name: "Password", visible: true, required: true, rule: "None"},
      {name: "Confirm password", visible: true, required: true, rule: "None"},
      {name: "Email", visible: true, required: true, rule: "Normal"},
      {name: "Phone", visible: true, required: true, rule: "None"},
      {name: "Agreement", visible: true, required: true, rule: "None"},
      {name: "Signup button", visible: true, required: true, rule: "None"},
      {name: "Providers", visible: true, required: true, rule: "None", customCss: SignupTableDefaultCssMap["Providers"]},
    ],
    grantTypes: ["authorization_code", "password", "client_credentials", "token", "id_token", "refresh_token"],
    cert: "cert-built-in",
    redirectUris: ["http://localhost:9000/callback"],
    // the empty tokenFormat and tokenFields will be filled with the organization's
    // "defaultTokenFormat" and "defaultTokenFields" by the backend
    tokenFormat: "",
    tokenFields: [],
    expireInHours: 24 * 7,
    refreshExpireInHours: 24 * 7,
    cookieExpireInHours: 24 * 30,
    formOffset: 2,
  };
}

export function newCert(account: Account, ownerOverride?: string) {
  const randomName = Setting.getRandomName();
  const owner = Setting.isDefaultOrganizationSelected(account) ? ownerOverride ?? "admin" : Setting.getRequestOrganization(account);
  return {
    owner,
    name: `cert_${randomName}`,
    createdTime: now(),
    displayName: `New Cert - ${randomName}`,
    scope: "JWT",
    type: "x509",
    cryptoAlgorithm: "RS256",
    bitSize: 4096,
    expireInYears: 20,
    certificate: "",
    privateKey: "",
  };
}

export function newForm(account: Account) {
  const randomName = Setting.getRandomName();
  return {
    owner: account.owner,
    name: `form_${randomName}`,
    createdTime: now(),
    displayName: `New Form - ${randomName}`,
    formItems: [],
  };
}

export function newGroup(account: Account) {
  const randomName = Setting.getRandomName();
  const owner = Setting.getRequestOrganization(account);
  return {
    owner,
    name: `group_${randomName}`,
    createdTime: now(),
    updatedTime: now(),
    displayName: `New Group - ${randomName}`,
    type: "Virtual",
    parentId: account.owner,
    isTopGroup: true,
    isEnabled: true,
  };
}

export function newInvitation(account: Account) {
  const randomName = Setting.getRandomName();
  const owner = Setting.getRequestOrganization(account);
  const code = Math.random().toString(36).slice(-10);
  return {
    owner,
    name: `invitation_${randomName}`,
    createdTime: now(),
    updatedTime: now(),
    displayName: `New Invitation - ${randomName}`,
    code,
    defaultCode: code,
    quota: 1,
    usedCount: 0,
    application: "All",
    username: "",
    email: "",
    phone: "",
    signupGroup: "",
    expireTime: "",
    state: "Active",
  };
}

export function newKey(account: Account) {
  const randomName = Setting.getRandomName();
  const owner = Setting.getRequestOrganization(account);
  return {
    owner,
    name: `key_${randomName}`,
    createdTime: now(),
    updatedTime: now(),
    displayName: `New Key - ${randomName}`,
    type: "Organization",
    organization: owner,
    application: "",
    user: "",
    accessKey: "",
    accessSecret: "",
    expireTime: "",
    state: "Active",
  };
}

export function newModel(account: Account) {
  const randomName = Setting.getRandomName();
  const owner = Setting.getRequestOrganization(account);
  return {
    owner,
    name: `model_${randomName}`,
    createdTime: now(),
    displayName: `New Model - ${randomName}`,
    modelText: rbacModel,
  };
}

export function newProvider(account: Account, ownerOverride?: string) {
  const randomName = Setting.getRandomName();
  const owner = Setting.isDefaultOrganizationSelected(account) ? ownerOverride ?? "admin" : Setting.getRequestOrganization(account);
  return {
    owner,
    name: `provider_${randomName}`,
    createdTime: now(),
    displayName: `New Provider - ${randomName}`,
    category: "OAuth",
    type: "GitHub",
    method: "Normal",
    clientId: "",
    clientSecret: "",
    enableSignUp: true,
    host: "",
    port: 0,
    providerUrl: "",
  };
}

export function newRole(account: Account) {
  const randomName = Setting.getRandomName();
  const owner = Setting.getRequestOrganization(account);
  return {
    owner,
    name: `role_${randomName}`,
    createdTime: now(),
    displayName: `New Role - ${randomName}`,
    users: [],
    groups: [],
    roles: [],
    domains: [],
    isEnabled: true,
  };
}

export function newRule(account: Account) {
  const randomName = Setting.getRandomName();
  const owner = Setting.getRequestOrganization(account);
  return {
    owner,
    name: `rule_${randomName}`,
    createdTime: now(),
    type: "User-Agent",
    expressions: [],
    action: "Block",
    reason: "Your request is blocked.",
  };
}

export function newToken(account: Account) {
  const randomName = Setting.getRandomName();
  const organizationName = Setting.getRequestOrganization(account);
  return {
    owner: "admin",
    name: `token_${randomName}`,
    createdTime: now(),
    application: Conf.DefaultApplication,
    organization: organizationName,
    user: "admin",
    accessToken: "",
    expiresIn: 7200,
    scope: "read",
    tokenType: "Bearer",
  };
}

export function newUser(account: Account, organization: Record<string, any>, organizationName: string, groupName?: string) {
  const randomName = Setting.getRandomName();
  const owner =
    Setting.isDefaultOrganizationSelected(account) || groupName ? organizationName : Setting.getRequestOrganization(account);
  return {
    owner,
    name: `user_${randomName}`,
    createdTime: now(),
    type: "normal-user",
    password: "123",
    passwordSalt: "",
    displayName: `New User - ${randomName}`,
    avatar: organization?.defaultAvatar ?? `${Setting.StaticBaseUrl}/img/avatar-default.svg`,
    email: `${randomName}@example.com`,
    phone: "",
    countryCode: organization?.countryCodes?.length > 0 ? organization.countryCodes[0] : "",
    address: [],
    addresses: [],
    groups: groupName ? [`${owner}/${groupName}`] : [],
    roles: [],
    permissions: [],
    managedAccounts: [],
    mfaAccounts: [],
    affiliation: "Example Inc.",
    tag: "staff",
    region: "",
    realName: "",
    isVerified: false,
    isAdmin: owner === "built-in",
    isForbidden: false,
    isDeleted: false,
    properties: {},
    signupApplication: organization?.defaultApplication,
    registerType: "Add User",
    registerSource: `${account.owner}/${account.name}`,
  };
}

export function newWebhook(account: Account) {
  const randomName = Setting.getRandomName();
  const organizationName = Setting.getRequestOrganization(account);
  return {
    owner: "admin",
    name: `webhook_${randomName}`,
    createdTime: now(),
    organization: organizationName,
    url: "https://example.com/callback",
    method: "POST",
    contentType: "application/json",
    headers: [],
    events: ["signup", "login", "logout", "update-user"],
    isEnabled: true,
  };
}
