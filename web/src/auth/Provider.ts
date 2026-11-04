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

// Social/OAuth provider endpoints and the PKCE-aware authorize-URL builder,
// ported from web/src/auth/Provider.js (the antd logo widget lives in the UI now).

import CryptoJS from "crypto-js";
import i18next from "i18next";
import * as Util from "@/auth/Util";
import * as Setting from "@/lib/setting";

// PKCE helper functions
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

function base64UrlEncode(buffer) {
  const base64 = btoa(String.fromCharCode.apply(null, buffer));
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function generateCodeChallenge(verifier) {
  // Convert verifier to UTF-8 bytes and compute SHA-256 hash
  const hash = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(verifier));
  const base64Hash = CryptoJS.enc.Base64.stringify(hash);
  return base64Hash
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function storeCodeVerifier(state, verifier) {
  localStorage.setItem(`pkce_verifier_${state}`, verifier);
}

export function getCodeVerifier(state) {
  return localStorage.getItem(`pkce_verifier_${state}`);
}

export function clearCodeVerifier(state) {
  localStorage.removeItem(`pkce_verifier_${state}`);
}

const authInfo = {
  Google: {
    scope: "profile+email",
    endpoint: "https://accounts.google.com/signin/oauth",
  },
  GitHub: {
    scope: "user:email+read:user",
    endpoint: "https://github.com/login/oauth/authorize",
  },
  Custom: {
    endpoint: "https://example.com/",
  },
  GitLab: {
    scope: "read_user",
    endpoint: "https://gitlab.com/oauth/authorize",
  },
  Gitea: {
    scope: "user:email",
    endpoint: "https://gitea.com/login/oauth/authorize",
  },
};

export function getProviderUrl(provider) {
  if (provider.category === "OAuth") {
    const type = Setting.isCustomOAuthType(provider.type) ? "Custom" : provider.type;
    const endpoint = authInfo[type].endpoint;
    const urlObj = new URL(endpoint);

    let host = urlObj.host;
    let tokens = host.split(".");
    if (tokens.length > 2) {
      tokens = tokens.slice(1);
    }
    host = tokens.join(".");

    return `${urlObj.protocol}//${host}`;
  } else {
    const info = Setting.OtherProviderInfo[provider.category]?.[provider.type];
    // avoid crash when provider is not found
    if (info) {
      return info.url;
    }
    return "";
  }
}

export function getAuthUrl(application: any, provider: any, method: string, code?: string) {
  if (application === null || provider === null) {
    return "";
  }
  const type = Setting.isCustomOAuthType(provider.type) ? "Custom" : provider.type;
  let endpoint = authInfo[type].endpoint;
  const redirectOrigin = application.forcedRedirectOrigin ? application.forcedRedirectOrigin : Setting.getOriginUrl();
  let redirectUri = `${redirectOrigin}/callback`;
  let scope = authInfo[type].scope;
  // Allow provider.scopes to override default scope if specified
  if (provider.scopes && provider.scopes.trim() !== "") {
    scope = provider.scopes;
  }
  let applicationName = application.name;
  if (application?.isShared) {
    applicationName = `${application.name}-org-${application.organization}`;
  }
  const state = Util.getStateFromQueryParams(applicationName, provider.name, method, false);

  // Generate PKCE code verifier and challenge dynamically
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  storeCodeVerifier(state, codeVerifier);

  if (provider.type === "Google" && provider.disableSsl) {
    scope += "+https://www.googleapis.com/auth/user.phonenumbers.read";
  }

  if (type === "Custom") {
    if (/\{[a-zA-Z_][a-zA-Z0-9_]*\}/.test(provider.customAuthUrl ?? "")) {
      const values: Record<string, string> = {clientId: provider.clientId, redirectUri, scope: provider.scopes ?? "", state, codeChallenge};
      return provider.customAuthUrl.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_: string, name: string) => encodeURIComponent(values[name] ?? ""));
    }
    let authUrl = `${provider.customAuthUrl}?client_id=${provider.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(provider.scopes)}&response_type=code&state=${encodeURIComponent(state)}`;
    if (provider.enablePkce) {
      authUrl += `&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    }
    return authUrl;
  }

  return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
}

