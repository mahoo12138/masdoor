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
  Apple: {
    scope: "name%20email",
    endpoint: "https://appleid.apple.com/auth/authorize",
  },
  AzureAD: {
    scope: "user.read",
    endpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  },
  Slack: {
    scope: "users:read",
    endpoint: "https://slack.com/oauth/authorize",
  },
  Steam: {
    endpoint: "https://steamcommunity.com/openid/login",
  },
  Custom: {
    endpoint: "https://example.com/",
  },
  Line: {
    scope: "profile%20openid%20email",
    endpoint: "https://access.line.me/oauth2/v2.1/authorize",
  },
  Amazon: {
    scope: "profile",
    endpoint: "https://www.amazon.com/ap/oa",
  },
  Auth0: {
    scope: "openid%20profile%20email",
    endpoint: "http://auth0.com/authorize",
  },
  BattleNet: {
    scope: "openid",
    endpoint: "https://oauth.battlenet.com.cn/authorize",
  },
  Bitbucket: {
    scope: "account",
    endpoint: "https://bitbucket.org/site/oauth2/authorize",
  },
  Box: {
    scope: "root_readwrite",
    endpoint: "https://account.box.com/api/oauth2/authorize",
  },
  CloudFoundry: {
    scope: "cloud_controller.read",
    endpoint: "https://login.cloudfoundry.org/oauth/authorize",
  },
  Dailymotion: {
    scope: "userinfo",
    endpoint: "https://api.dailymotion.com/oauth/authorize",
  },
  Deezer: {
    scope: "basic_access",
    endpoint: "https://connect.deezer.com/oauth/auth.php",
  },
  DigitalOcean: {
    scope: "read",
    endpoint: "https://cloud.digitalocean.com/v1/oauth/authorize",
  },
  Discord: {
    scope: "identify%20email",
    endpoint: "https://discord.com/api/oauth2/authorize",
  },
  Dropbox: {
    scope: "account_info.read",
    endpoint: "https://www.dropbox.com/oauth2/authorize",
  },
  EveOnline: {
    scope: "publicData",
    endpoint: "https://login.eveonline.com/oauth/authorize",
  },
  Fitbit: {
    scope: "activity%20heartrate%20location%20nutrition%20profile%20settings%20sleep%20social%20weight",
    endpoint: "https://www.fitbit.com/oauth2/authorize",
  },
  Gitea: {
    scope: "user:email",
    endpoint: "https://gitea.com/login/oauth/authorize",
  },
  Heroku: {
    scope: "global",
    endpoint: "https://id.heroku.com/oauth/authorize",
  },
  InfluxCloud: {
    scope: "read:org",
    endpoint: "https://cloud2.influxdata.com/oauth/authorize",
  },
  Instagram: {
    scope: "user_profile",
    endpoint: "https://api.instagram.com/oauth/authorize",
  },
  Intercom: {
    scope: "user.read",
    endpoint: "https://app.intercom.com/oauth",
  },
  Kakao: {
    scope: "account_email",
    endpoint: "https://kauth.kakao.com/oauth/authorize",
  },
  Lastfm: {
    scope: "user_read",
    endpoint: "https://www.last.fm/api/auth",
  },
  Mailru: {
    scope: "userinfo",
    endpoint: "https://oauth.mail.ru/login",
  },
  Meetup: {
    scope: "basic",
    endpoint: "https://secure.meetup.com/oauth2/authorize",
  },
  MicrosoftOnline: {
    scope: "openid%20profile%20email",
    endpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  },
  Naver: {
    scope: "profile",
    endpoint: "https://nid.naver.com/oauth2.0/authorize",
  },
  Nextcloud: {
    scope: "openid%20profile%20email",
    endpoint: "https://cloud.example.org/apps/oauth2/authorize",
  },
  OneDrive: {
    scope: "offline_access%20onedrive.readonly",
    endpoint: "https://login.live.com/oauth20_authorize.srf",
  },
  Oura: {
    scope: "personal",
    endpoint: "https://cloud.ouraring.com/oauth/authorize",
  },
  Patreon: {
    scope: "identity",
    endpoint: "https://www.patreon.com/oauth2/authorize",
  },
  PayPal: {
    scope: "openid%20profile%20email",
    endpoint: "https://www.sandbox.paypal.com/connect",
  },
  SalesForce: {
    scope: "openid%20profile%20email",
    endpoint: "https://login.salesforce.com/services/oauth2/authorize",
  },
  Shopify: {
    scope: "read_products",
    endpoint: "https://myshopify.com/admin/oauth/authorize",
  },
  Soundcloud: {
    scope: "non-expiring",
    endpoint: "https://api.soundcloud.com/connect",
  },
  Spotify: {
    scope: "user-read-email",
    endpoint: "https://accounts.spotify.com/authorize",
  },
  Strava: {
    scope: "read",
    endpoint: "https://www.strava.com/oauth/authorize",
  },
  Stripe: {
    scope: "read_only",
    endpoint: "https://connect.stripe.com/oauth/authorize",
  },
  TikTok: {
    scope: "user.info.basic",
    endpoint: "https://www.tiktok.com/auth/authorize/",
  },
  Tumblr: {
    scope: "basic",
    endpoint: "https://www.tumblr.com/oauth2/authorize",
  },
  Twitch: {
    scope: "user_read",
    endpoint: "https://id.twitch.tv/oauth2/authorize",
  },
  Typetalk: {
    scope: "my",
    endpoint: "https://typetalk.com/oauth2/authorize",
  },
  Uber: {
    scope: "profile",
    endpoint: "https://login.uber.com/oauth/v2/authorize",
  },
  VK: {
    scope: "email",
    endpoint: "https://oauth.vk.com/authorize",
  },
  Wepay: {
    scope: "manage_accounts%20view_user",
    endpoint: "https://www.wepay.com/v2/oauth2/authorize",
  },
  Xero: {
    scope: "openid%20profile%20email",
    endpoint: "https://login.xero.com/identity/connect/authorize",
  },
  Yahoo: {
    scope: "openid%20profile%20email",
    endpoint: "https://api.login.yahoo.com/oauth2/request_auth",
  },
  Yammer: {
    scope: "user",
    endpoint: "https://www.yammer.com/oauth2/authorize",
  },
  Yandex: {
    scope: "login:email",
    endpoint: "https://oauth.yandex.com/authorize",
  },
  Zoom: {
    scope: "user:read",
    endpoint: "https://zoom.us/oauth/authorize",
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

  if (provider.type === "AzureAD") {
    if (provider.domain !== "") {
      endpoint = endpoint.replace("common", provider.domain);
    }
  } else if (provider.type === "Apple") {
    redirectUri = `${redirectOrigin}/api/callback`;
  } else if (provider.type === "Google" && provider.disableSsl) {
    scope += "+https://www.googleapis.com/auth/user.phonenumbers.read";
  } else if (provider.type === "Nextcloud") {
    if (provider.domain) {
      endpoint = `${provider.domain}/apps/oauth2/authorize`;
    }
  }

  if (provider.type === "Google" || provider.type === "GitHub"
    || provider.type === "AzureAD"
    || provider.type === "Slack" || provider.type === "Line" || provider.type === "Amazon" || provider.type === "Auth0" || provider.type === "BattleNet"
    || provider.type === "Bitbucket" || provider.type === "Box" || provider.type === "CloudFoundry" || provider.type === "Dailymotion"
    || provider.type === "DigitalOcean" || provider.type === "Discord" || provider.type === "Dropbox" || provider.type === "EveOnline" || provider.type === "Gitea"
    || provider.type === "Heroku" || provider.type === "InfluxCloud" || provider.type === "Instagram" || provider.type === "Intercom" || provider.type === "Kakao"
    || provider.type === "MailRu" || provider.type === "Meetup" || provider.type === "MicrosoftOnline" || provider.type === "Naver" || provider.type === "Nextcloud"
    || provider.type === "OneDrive" || provider.type === "Oura" || provider.type === "Patreon" || provider.type === "PayPal" || provider.type === "SalesForce"
    || provider.type === "SoundCloud" || provider.type === "Spotify" || provider.type === "Strava" || provider.type === "Stripe" || provider.type === "Tumblr"
    || provider.type === "Twitch" || provider.type === "Typetalk" || provider.type === "Uber" || provider.type === "VK" || provider.type === "Wepay"
    || provider.type === "Xero" || provider.type === "Yahoo" || provider.type === "Yammer" || provider.type === "Yandex" || provider.type === "Zoom") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
  } else if (provider.type === "Apple") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code%20id_token&scope=${scope}&response_mode=form_post`;
  } else if (provider.type === "Steam") {
    return `${endpoint}?openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.mode=checkid_setup&openid.ns=http://specs.openid.net/auth/2.0&openid.realm=${redirectOrigin}&openid.return_to=${redirectUri}?state=${state}`;
  } else if (provider.type === "TikTok") {
    return `${endpoint}?client_key=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code&scope=${scope}`;
  } else if (type === "Custom") {
    if (/\{[a-zA-Z_][a-zA-Z0-9_]*\}/.test(provider.customAuthUrl ?? "")) {
      const values: Record<string, string> = {clientId: provider.clientId, redirectUri, scope: provider.scopes ?? "", state, codeChallenge};
      return provider.customAuthUrl.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_: string, name: string) => encodeURIComponent(values[name] ?? ""));
    }
    let authUrl = `${provider.customAuthUrl}?client_id=${provider.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(provider.scopes)}&response_type=code&state=${encodeURIComponent(state)}`;
    if (provider.enablePkce) {
      authUrl += `&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    }
    return authUrl;
  } else if (provider.type === "Deezer") {
    return `${endpoint}?app_id=${provider.clientId}&redirect_uri=${redirectUri}&perms=${scope}`;
  } else if (provider.type === "Lastfm") {
    return `${endpoint}?api_key=${provider.clientId}&cb=${redirectUri}`;
  } else if (provider.type === "Shopify") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&grant_options[]=per-user`;
  } else if (provider.type === "Fitbit") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code&scope=${scope}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  }
}

