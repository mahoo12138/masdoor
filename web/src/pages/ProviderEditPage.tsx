import * as React from "react";
import i18next from "i18next";
import {useNavigate, useParams} from "react-router-dom";
import {UnauthorizedPage} from "@/components/common/UnauthorizedPage";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {Textarea} from "@/components/ui/textarea";
import {Loading} from "@/components/common/Loading";
import {CountryCodeSelect} from "@/components/common/CountryCodeSelect";
import {CodeEditor} from "@/components/common/CodeEditor";
import {MultiSelect} from "@/components/common/MultiSelect";
import {SearchableSelect} from "@/components/common/SearchableSelect";
import {SelectField} from "@/components/common/SelectField";
import {MapTable} from "@/components/crud/MapTable";
import {EditPageShell} from "@/components/crud/EditPageShell";
import {FormRow} from "@/components/crud/FormRow";
import {CaptchaPreview} from "@/components/provider/CaptchaPreview";
import {useAccount} from "@/hooks/use-account";
import {useEditRecord} from "@/hooks/use-edit-record";
import {useOrganizationOptions} from "@/hooks/use-options";
import * as CertBackend from "@/backend/CertBackend";
import * as ProviderBackend from "@/backend/ProviderBackend";
import {submitEdit} from "@/lib/crud";
import * as ProviderTest from "@/lib/provider-test";
import * as Setting from "@/lib/setting";
import {authConfig} from "@/auth/Auth";
import copy from "copy-to-clipboard";

const defaultUserMapping: Record<string, string> = {
  id: "sub",
  username: "username",
  displayName: "displayName",
  email: "email",
  avatarUrl: "avatarUrl",
  phone: "phone",
  countryCode: "country_code",
  firstName: "given_name",
  lastName: "family_name",
  region: "region",
  location: "location",
  affiliation: "affiliation",
  title: "title",
};

const CATEGORIES = [
  "Audit", "Captcha", "Email", "Notification",
  "OAuth", "Storage",
].sort((a, b) => a.localeCompare(b));



const SYSLOG_PROTOCOLS = ["UDP", "TCP", "TLS"];
const SYSLOG_FACILITIES = [
  "auth", "authpriv", "user", "daemon", "security",
  "local0", "local1", "local2", "local3", "local4", "local5", "local6", "local7",
];
const SYSLOG_FORMATS = ["RFC 5424", "RFC 3164"];

function isDefaultProviderName(name: string) {
  return /^provider_[a-z0-9]+$/.test(name ?? "");
}

function isDefaultProviderDisplayName(displayName: string) {
  return /^New Provider - [a-z0-9]+$/.test(displayName ?? "");
}

function slug(value: string) {
  return value.toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function getAutoProviderName(category: string, type: string, subType: string) {
  if (subType) {
    return `provider_${slug(category)}_${slug(type)}_${slug(subType)}`;
  }
  return `provider_${slug(category)}_${slug(type)}`;
}

function getAutoProviderDisplayName(category: string, type: string, subType: string) {
  return subType ? `${category} ${type} ${subType}` : `${category} ${type}`;
}

/** the (label, tooltip) pair a row shows, the shadcn counterpart of Setting.getLabel() */
type Label = {label: string; tooltip?: string};

function label(text: string, tooltip?: string): Label {
  return {label: text, tooltip};
}

function toList(rawValue: any) {
  return `${rawValue || ""}`.split(",").map(item => item.trim()).filter(item => item !== "");
}

function normalizeAndJoin(values: string[]) {
  return (values || []).map(item => `${item}`.trim()).filter(item => item !== "").join(",");
}

function getProviderSubTypeOptions(type: string) {
  if (type === "Aliyun Captcha") {
    return [
      {id: "Embed", name: "Embed"},
      {id: "Popup", name: "Popup"},
    ];
  }
  return [];
}

function getClientIdLabel(provider: any): Label {
  if (provider.category === "OAuth") {
    return label(i18next.t("provider:Client ID"), i18next.t("provider:Client ID - Tooltip"));
  } else if (provider.category === "Email") {
    return label(i18next.t("signup:Username"), i18next.t("signup:Username - Tooltip"));
  } else if (provider.category === "Captcha") {
    return provider.type === "Aliyun Captcha"
      ? label(i18next.t("general:Access key"), i18next.t("general:Access key - Tooltip"))
      : label(i18next.t("provider:Site key"), i18next.t("provider:Site key - Tooltip"));
  } else if (provider.category === "Notification") {
    return label(i18next.t("provider:Client ID"), i18next.t("provider:Client ID - Tooltip"));
  }
  return label(i18next.t("provider:Client ID"), i18next.t("provider:Client ID - Tooltip"));
}

function getClientSecretLabel(provider: any): Label {
  if (provider.category === "OAuth") {
    return label(i18next.t("provider:Client secret"), i18next.t("provider:Client secret - Tooltip"));
  } else if (provider.category === "Storage") {
    return label(i18next.t("provider:Client secret"), i18next.t("provider:Client secret - Tooltip"));
  } else if (provider.category === "Email") {
    return provider.type === "Resend"
      ? label(i18next.t("provider:Secret key"), i18next.t("provider:Secret key - Tooltip"))
      : label(i18next.t("general:Password"), i18next.t("general:Password - Tooltip"));
  } else if (provider.category === "Captcha") {
    return provider.type === "Aliyun Captcha"
      ? label(i18next.t("provider:Secret access key"), i18next.t("provider:Secret access key - Tooltip"))
      : label(i18next.t("provider:Secret key"), i18next.t("provider:Secret key - Tooltip"));
  } else if (provider.category === "Notification") {
    if (["Telegram", "Bark"].includes(provider.type)) {
      return label(i18next.t("provider:Secret key"), i18next.t("provider:Secret key - Tooltip"));
    }
    return label(i18next.t("provider:Client secret"), i18next.t("provider:Client secret - Tooltip"));
  }
  return label(i18next.t("provider:Client secret"), i18next.t("provider:Client secret - Tooltip"));
}

function getClientId2Label(provider: any): Label {
  if (provider.category === "OAuth") {
    return label(i18next.t("provider:Client ID 2"), i18next.t("provider:Client ID 2 - Tooltip"));
  } else if (provider.category === "Email") {
    return label(i18next.t("provider:From address"), i18next.t("provider:From address - Tooltip"));
  } else if (provider.type === "Aliyun Captcha") {
    return label(i18next.t("provider:Scene"), i18next.t("provider:Scene - Tooltip"));
  }
  return label(i18next.t("provider:Client ID 2"), i18next.t("provider:Client ID 2 - Tooltip"));
}

function getClientSecret2Label(provider: any): Label {
  if (provider.category === "OAuth") {
    return label(i18next.t("provider:Client secret 2"), i18next.t("provider:Client secret 2 - Tooltip"));
  } else if (provider.category === "Email") {
    return label(i18next.t("provider:From name"), i18next.t("provider:From name - Tooltip"));
  } else if (provider.type === "Aliyun Captcha") {
    return label(i18next.t("provider:App key"), i18next.t("provider:App key - Tooltip"));
  }
  return label(i18next.t("provider:Client secret 2"), i18next.t("provider:Client secret 2 - Tooltip"));
}

/** the extra "appId" row, whose meaning depends on the provider — null hides it */
function getAppIdLabel(provider: any): Label | null {
  return null;
}

/** the notification "receiver" row — null when the provider needs no receiver */
function getReceiverLabel(provider: any): Label | null {
  if (provider.type === "Telegram") {
    return label(i18next.t("provider:Chat ID"), i18next.t("provider:Chat ID - Tooltip"));
  } else if (provider.type === "Custom HTTP") {
    return label(i18next.t("provider:Endpoint"), i18next.t("provider:Endpoint - Tooltip"));
  }
  return null;
}

function hasClientIdRow(provider: any) {
  if ((provider.category === "Email" && provider.type === "Resend") ||
      (provider.category === "Notification" && ["Telegram", "Bark"].includes(provider.type))) {
    return false;
  }
  return true;
}

function hasCredentialRows(provider: any) {
  if ((provider.category === "Captcha" && provider.type === "Default") ||
      provider.category === "Audit" ||
      provider.category === "Log" ||
      (provider.category === "Storage" && provider.type === "Local File System") ||
      (provider.category === "Notification" && ["Custom HTTP"].includes(provider.type))) {
    return false;
  }
  return true;
}

function hasCredential2Rows(provider: any) {
  return provider.category === "Email" ||
    provider.type === "Aliyun Captcha";
}

export default function ProviderEditPage() {
  const {organizationName = "", providerName = ""} = useParams();
  const {account} = useAccount();
  const navigate = useNavigate();

  const [owner, setOwner] = React.useState(organizationName);
  const [name, setName] = React.useState(providerName);
  const organizations = useOrganizationOptions();
  const [providers, setProviders] = React.useState<any[]>([]);
  const [certs, setCerts] = React.useState<any[]>([]);
  const [saving, setSaving] = React.useState(false);

  const [nameNotUserEdited, setNameNotUserEdited] = React.useState(false);
  const [displayNameNotUserEdited, setDisplayNameNotUserEdited] = React.useState(false);

  const [discoveryLoading, setDiscoveryLoading] = React.useState(false);

  const transform = React.useCallback((provider: any) => {
    provider.userMapping = provider.userMapping || {...defaultUserMapping};
    return provider;
  }, []);

  const {record: provider, setRecord, loading, denied, mode, setMode} = useEditRecord<any>({
    fetch: () => ProviderBackend.getProvider(organizationName, providerName),
    transform,
    deps: [organizationName, providerName],
  });

  const getProviders = React.useCallback((forOwner: string) => {
    ProviderBackend.getProviders(forOwner).then((res: any) => {
      if (res.status === "ok") {
        setProviders(res.data ?? []);
      }
    });
  }, []);

  const getCerts = React.useCallback((forOwner: string) => {
    CertBackend.getCerts(forOwner).then((res: any) => {
      if (res.status === "ok") {
        setCerts(res.data ?? []);
      }
    });
  }, []);

  React.useEffect(() => {
    getProviders(owner);
    getCerts(owner);
  }, [owner, getProviders, getCerts]);

  // the name/display name keep following category+type until the user types their own
  const initializedRef = React.useRef(false);
  React.useEffect(() => {
    if (provider !== null && !initializedRef.current) {
      initializedRef.current = true;
      setNameNotUserEdited(isDefaultProviderName(provider.name));
      setDisplayNameNotUserEdited(isDefaultProviderDisplayName(provider.displayName));
    }
  }, [provider]);

  const applyProviderRules = (next: any) => {
    return next;
  };

  const patchProvider = React.useCallback((patch: Record<string, any>) => {
    setRecord((prev: any) => {
      if (prev === null) {
        return prev;
      }
      const next = {...prev, ...patch};
      if (Object.prototype.hasOwnProperty.call(patch, "port")) {
        next.port = Setting.myParseInt(patch.port);
      }
      return applyProviderRules(next);
    });
  }, [setRecord]);

  const updateProviderField = React.useCallback((key: string, value: any) => {
    if (key === "owner" && provider !== null && provider.owner !== value) {
      // the provider changed owner, the cert no longer applies
      patchProvider({owner: value, cert: ""});
      getProviders(value);
      getCerts(value);
      return;
    }
    patchProvider({[key]: value});
  }, [provider, patchProvider, getProviders, getCerts]);

  const updateUserMappingField = (key: string, value: string) => {
    if (provider === null) {
      return;
    }
    const requiredKeys = ["id", "username", "displayName"];
    if (value === "" && requiredKeys.includes(key)) {
      Setting.showMessage("error", i18next.t("general:This field is required"));
      return;
    }

    const userMapping = {...(provider.userMapping ?? {})};
    if (value === "") {
      delete userMapping[key];
    } else {
      userMapping[key] = value;
    }
    patchProvider({userMapping});
  };

  const save = async(exitAfterSave: boolean) => {
    if (provider === null) {
      return;
    }
    const payload = Setting.deepCopy(provider);
    setSaving(true);
    await submitEdit({
      mode,
      record: payload,
      add: (record) => ProviderBackend.addProvider(record),
      update: (record) => ProviderBackend.updateProvider(owner, name, record),
      onSaved: () => {
        setOwner(provider.owner);
        setName(provider.name);
        setMode("edit");
        if (exitAfterSave) {
          navigate("/providers");
        } else {
          const next = `/providers/${provider.owner}/${provider.name}`;
          if (next !== Setting.getRoutePath()) {
            navigate(next, {replace: true});
          }
        }
      },
      onFailed: () => {
        if (mode !== "add") {
          patchProvider({name});
        }
      },
    });
    setSaving(false);
  };

  const fetchOidcDiscovery = () => {
    setDiscoveryLoading(true);
    ProviderBackend.getIdpDiscovery(provider.domain ?? "")
      .then((res: any) => {
        if (res.status !== "ok") {
          Setting.showMessage("error", res.msg);
          return;
        }

        const discovery = res.data;
        patchProvider({
          domain: discovery.issuer || provider.domain,
          customAuthUrl: discovery.authorization_endpoint ?? "",
          customTokenUrl: discovery.token_endpoint ?? "",
          customUserInfoUrl: discovery.userinfo_endpoint ?? "",
          customLogoutUrl: discovery.end_session_endpoint ?? "",
        });
        Setting.showMessage("success", i18next.t("general:Successfully added"));
      })
      .catch((err: any) => {
        Setting.showMessage("error", err.message);
      })
      .finally(() => {
        setDiscoveryLoading(false);
      });
  };

  if (denied) {
    return <UnauthorizedPage />;
  }

  if (loading || provider === null) {
    return <Loading />;
  }

  const certOptions = certs.map((cert: any) => ({value: cert.name, label: cert.name}));
  const subTypeOptions = getProviderSubTypeOptions(provider.type);

  const onChangeCategory = (value: string) => {
    const patch: Record<string, any> = {category: value};
    let defaultType = "";
    if (value === "OAuth") {
      defaultType = "Google";
    } else if (value === "Email") {
      defaultType = "Default";
      patch.host = "smtp.example.com";
      patch.port = 465;
      patch.sslMode = "Auto";
      patch.title = "Masdoor Verification Code";
      patch.content = Setting.getDefaultHtmlEmailContent();
      patch.metadata = Setting.getDefaultInvitationHtmlEmailContent();
      patch.receiver = account?.email ?? "";
    } else if (value === "Storage") {
      defaultType = "AWS S3";
    } else if (value === "Captcha") {
      defaultType = "Default";
    } else if (value === "Notification") {
      defaultType = "Telegram";
    } else if (value === "Audit") {
      defaultType = "Syslog";
      patch.host = "";
      patch.port = 514;
      patch.method = "UDP";
      patch.title = "auth";
      patch.templateCode = "RFC 5424";
      patch.state = "Enabled";
    } else if (value === "Log") {
      defaultType = "Masdoor Permission Log";
      patch.host = "";
      patch.port = 0;
      patch.title = "";
      patch.state = "Enabled";
    }

    if (defaultType) {
      patch.type = defaultType;
      if (nameNotUserEdited) {
        patch.name = getAutoProviderName(value, defaultType, "");
      }
      if (displayNameNotUserEdited) {
        patch.displayName = getAutoProviderDisplayName(value, defaultType, "");
      }
    }
    patchProvider(patch);
  };

  const onChangeType = (value: string) => {
    const patch: Record<string, any> = {type: value};
    if (value === "Local File System") {
      patch.domain = Setting.getFullServerUrl();
    } else if (value === "OIDC") {
      patch.scopes = "openid profile email";
    } else if (value.startsWith("Custom") && provider.category === "OAuth") {
      patch.scopes = "openid profile email";
    } else if (value === "Custom HTTP") {
      patch.method = "GET";
      patch.title = "";
    } else if (value === "Aliyun Captcha") {
      // Popup stays opt-in: only Alibaba Cloud's traceless scenes require it
      patch.subType = "Embed";
    }
    if (nameNotUserEdited) {
      patch.name = getAutoProviderName(provider.category, value, "");
    }
    if (displayNameNotUserEdited) {
      patch.displayName = getAutoProviderDisplayName(provider.category, value, "");
    }
    patchProvider(patch);
  };

  const renderMappingRows = (rows: {key: string; label: Label}[]) => (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.key} className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(120px,160px)_1fr] sm:items-center">
          <span className="text-sm text-muted-foreground">{row.label.label}</span>
          <Input
            value={provider.userMapping?.[row.key] ?? ""}
            onChange={(e) => updateUserMappingField(row.key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );

  const renderUserMappingInput = () => renderMappingRows([
    {key: "id", label: label(i18next.t("general:ID"))},
    {key: "username", label: label(i18next.t("signup:Username"))},
    {key: "displayName", label: label(i18next.t("general:Display name"))},
    {key: "email", label: label(i18next.t("general:Email"))},
    {key: "avatarUrl", label: label(i18next.t("general:Avatar"))},
    {key: "phone", label: label(i18next.t("general:Phone"))},
    {key: "countryCode", label: label(i18next.t("user:Country code"))},
    {key: "firstName", label: label(i18next.t("general:First name"))},
    {key: "lastName", label: label(i18next.t("general:Last name"))},
    {key: "region", label: label(i18next.t("provider:Region"))},
    {key: "location", label: label(i18next.t("user:Location"))},
    {key: "affiliation", label: label(i18next.t("user:Affiliation"))},
    {key: "title", label: label(i18next.t("general:Title"))},
  ]);

  const renderOAuthFields = () => (
    <React.Fragment>
      <FormRow labelKey="provider:Email regex">
        <Textarea rows={4} value={provider.emailRegex ?? ""} onChange={(e) => updateProviderField("emailRegex", e.target.value)} />
      </FormRow>
      <FormRow labelKey="provider:Enable proxy">
        <Switch checked={!!provider.enableProxy} onCheckedChange={(v) => updateProviderField("enableProxy", v)} />
      </FormRow>
      {provider.category === "Storage" ? (
        <FormRow label={i18next.t("provider:Domain")} tooltip={i18next.t("provider:Domain - Tooltip")}>
          <Input value={provider.domain ?? ""} onChange={(e) => updateProviderField("domain", e.target.value)} />
        </FormRow>
      ) : null}
      {provider.type === "Google" ? (
        <FormRow
          label={i18next.t("provider:Get phone number")}
          tooltip={i18next.t("provider:Get phone number - Tooltip")}
        >
          <Switch disabled={!provider.clientId} checked={!!provider.disableSsl} onCheckedChange={(v) => updateProviderField("disableSsl", v)} />
        </FormRow>
      ) : null}
      {provider.type === "OIDC" ? (
        <FormRow labelKey="provider:Issuer URL">
          <div className="flex flex-wrap items-center gap-2">
            <Input className="w-96 max-w-full" value={provider.domain ?? ""} onChange={(e) => updateProviderField("domain", e.target.value)} />
            <Button loading={discoveryLoading} disabled={!provider.domain} onClick={fetchOidcDiscovery}>
              {i18next.t("general:Request")}
            </Button>
          </div>
        </FormRow>
      ) : null}
      {Setting.isCustomOAuthType(provider.type) ? (
        <React.Fragment>
          <FormRow labelKey="provider:Auth URL">
            <Input value={provider.customAuthUrl ?? ""} onChange={(e) => updateProviderField("customAuthUrl", e.target.value)} />
          </FormRow>
          <FormRow labelKey="provider:Token URL">
            <Input value={provider.customTokenUrl ?? ""} onChange={(e) => updateProviderField("customTokenUrl", e.target.value)} />
          </FormRow>
          <FormRow labelKey="provider:Scope">
            <Input value={provider.scopes ?? ""} onChange={(e) => updateProviderField("scopes", e.target.value)} />
          </FormRow>
          <FormRow labelKey="provider:UserInfo URL">
            <Input value={provider.customUserInfoUrl ?? ""} onChange={(e) => updateProviderField("customUserInfoUrl", e.target.value)} />
          </FormRow>
          <FormRow labelKey="provider:Logout URL">
            <Input value={provider.customLogoutUrl ?? ""} onChange={(e) => updateProviderField("customLogoutUrl", e.target.value)} />
          </FormRow>
          <FormRow labelKey="provider:Enable PKCE">
            <Switch checked={!!provider.enablePkce} onCheckedChange={(v) => updateProviderField("enablePkce", v)} />
          </FormRow>
          <FormRow labelKey="provider:User mapping" block>
            {renderUserMappingInput()}
          </FormRow>
          <FormRow labelKey="general:Favicon" block>
            <div className="space-y-2">
              <Input value={provider.customLogo ?? ""} onChange={(e) => updateProviderField("customLogo", e.target.value)} />
              {provider.customLogo ? (
                <a target="_blank" rel="noreferrer" href={provider.customLogo}>
                  <img src={provider.customLogo} alt={provider.customLogo} height={90} className="h-[90px]" />
                </a>
              ) : null}
            </div>
          </FormRow>
        </React.Fragment>
      ) : null}
    </React.Fragment>
  );

  const renderEmailFields = () => (
    <React.Fragment>
      {provider.type !== "Resend" ? (
        <FormRow label={i18next.t("general:Host")} tooltip={i18next.t("provider:Host - Tooltip")}>
          <Input value={provider.host ?? ""} onChange={(e) => updateProviderField("host", e.target.value)} />
        </FormRow>
      ) : null}
      {provider.type !== "Resend" ? (
        <React.Fragment>
          <FormRow label={i18next.t("general:Port")} tooltip={i18next.t("provider:Port - Tooltip")}>
            <Input type="number" value={provider.port ?? 0} onChange={(e) => updateProviderField("port", e.target.value)} />
          </FormRow>
          <FormRow labelKey="provider:SSL mode">
            <SelectField
              value={provider.sslMode || "Auto"}
              onChange={(v) => updateProviderField("sslMode", v)}
              options={[
                {id: "Auto", name: i18next.t("general:Auto")},
                {id: "Enable", name: i18next.t("general:Enable")},
                {id: "Disable", name: i18next.t("general:Disable")},
              ]}
            />
          </FormRow>
        </React.Fragment>
      ) : null}
      <FormRow labelKey="provider:Enable proxy">
        <Switch checked={!!provider.enableProxy} onCheckedChange={(v) => updateProviderField("enableProxy", v)} />
      </FormRow>
      <FormRow block labelKey="provider:Email title">
        <Input value={provider.title ?? ""} onChange={(e) => updateProviderField("title", e.target.value)} />
      </FormRow>
      <FormRow labelKey="provider:Email content" block>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateProviderField("content", "You have requested a verification code at Masdoor. Here is your code: %s, please enter in 5 minutes. <reset-link>Or click %link to reset</reset-link>")}
            >
              {i18next.t("general:Reset to Default")} (Text)
            </Button>
            <Button size="sm" onClick={() => updateProviderField("content", Setting.getDefaultHtmlEmailContent())}>
              {i18next.t("general:Reset to Default")} (HTML)
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CodeEditor
              language="html"
              height={300}
              value={provider.content ?? ""}
              onChange={(v) => updateProviderField("content", v)}
            />
            <iframe
              title="email-content-preview"
              sandbox=""
              className="h-[300px] w-full rounded-md border bg-background"
              srcDoc={String(provider.content ?? "").replace("%s", "123456").replace("%{user.friendlyName}", account ? Setting.getFriendlyUserName(account) : "")}
            />
          </div>
        </div>
      </FormRow>
      <FormRow
        label={`${i18next.t("provider:Email content")}-${i18next.t("general:Invitations")}`}
        tooltip={i18next.t("provider:Email content - Tooltip")}
        block
      >
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateProviderField("metadata", "You have invited to join Masdoor. Here is your invitation code: %s, please enter in 5 minutes. Or click %link to signup")}
            >
              {i18next.t("general:Reset to Default")} (Text)
            </Button>
            <Button size="sm" onClick={() => updateProviderField("metadata", Setting.getDefaultInvitationHtmlEmailContent())}>
              {i18next.t("general:Reset to Default")} (HTML)
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CodeEditor
              language="html"
              height={300}
              value={provider.metadata ?? ""}
              onChange={(v) => updateProviderField("metadata", v)}
            />
            <iframe
              title="invitation-email-content-preview"
              sandbox=""
              className="h-[300px] w-full rounded-md border bg-background"
              srcDoc={String(provider.metadata ?? "").replace("%code", "123456").replace("%s", "123456")}
            />
          </div>
        </div>
      </FormRow>
      <FormRow labelKey="provider:Test Email">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="w-64"
            value={provider.receiver ?? ""}
            placeholder={i18next.t("user:Input your email")}
            onChange={(e) => updateProviderField("receiver", e.target.value)}
          />
          {provider.type !== "Resend" ? (
            <Button variant="outline" onClick={() => ProviderTest.connectSmtpServer(provider)}>
              {i18next.t("provider:Test SMTP Connection")}
            </Button>
          ) : null}
          <Button
            disabled={!Setting.isValidEmail(provider.receiver ?? "")}
            onClick={() => ProviderTest.sendTestEmail(provider, provider.receiver)}
          >
            {i18next.t("provider:Send Testing Email")}
          </Button>
        </div>
      </FormRow>
    </React.Fragment>
  );


  const renderNotificationFields = () => {
    const receiverLabel = getReceiverLabel(provider);
    return (
      <React.Fragment>
        {provider.type === "Custom HTTP" ? (
          <FormRow label={i18next.t("general:Method")} tooltip={i18next.t("provider:Method - Tooltip")}>
            <SelectField
              value={provider.method}
              onChange={(v) => updateProviderField("method", v)}
              options={[{id: "GET", name: "GET"}, {id: "POST", name: "POST"}]}
            />
          </FormRow>
        ) : null}
        {provider.type === "Custom HTTP" ? (
          <FormRow labelKey="provider:Parameter">
            <Input value={provider.title ?? ""} onChange={(e) => updateProviderField("title", e.target.value)} />
          </FormRow>
        ) : null}
        <FormRow labelKey="provider:Content">
          <Textarea rows={3} value={provider.content ?? ""} onChange={(e) => updateProviderField("content", e.target.value)} />
        </FormRow>
        <FormRow label={receiverLabel ? receiverLabel.label : "Test Notification"} tooltip={receiverLabel?.tooltip}>
          <div className="flex flex-wrap items-center gap-2">
            {receiverLabel ? (
              <Input
                className="w-72"
                value={provider.receiver ?? ""}
                onChange={(e) => updateProviderField("receiver", e.target.value)}
              />
            ) : null}
            <Button onClick={() => ProviderTest.sendTestNotification(provider)}>
              {i18next.t("provider:Send Testing Notification")}
            </Button>
          </div>
        </FormRow>
      </React.Fragment>
    );
  };

  const onChangeSyslogProtocol = (value: string) => {
    const patch: Record<string, any> = {method: value};
    if (value === "TLS" && provider.port === 514) {
      patch.port = 6514;
    } else if (value !== "TLS" && provider.port === 6514) {
      patch.port = 514;
    }
    patchProvider(patch);
  };

  const renderAuditFields = () => (
    <React.Fragment>
      <FormRow label={i18next.t("general:Host")} tooltip={i18next.t("provider:Host - Tooltip")}>
        <Input value={provider.host ?? ""} placeholder="10.10.10.10" onChange={(e) => updateProviderField("host", e.target.value)} />
      </FormRow>
      <FormRow label={i18next.t("general:Port")} tooltip={i18next.t("provider:Port - Tooltip")}>
        <Input type="number" value={provider.port ?? 0} onChange={(e) => updateProviderField("port", e.target.value)} />
      </FormRow>
      <FormRow label={i18next.t("provider:Protocol")} tooltip={i18next.t("provider:Protocol - Tooltip")}>
        <SelectField
          value={provider.method || "UDP"}
          onChange={onChangeSyslogProtocol}
          options={SYSLOG_PROTOCOLS.map((item) => ({id: item, name: item}))}
        />
      </FormRow>
      <FormRow label={i18next.t("provider:Facility")} tooltip={i18next.t("provider:Facility - Tooltip")}>
        <SelectField
          value={provider.title || "auth"}
          onChange={(v) => updateProviderField("title", v)}
          options={SYSLOG_FACILITIES.map((item) => ({id: item, name: item}))}
        />
      </FormRow>
      <FormRow label={i18next.t("resource:Format")} tooltip={i18next.t("provider:Format - Tooltip")}>
        <SelectField
          value={provider.templateCode || "RFC 5424"}
          onChange={(v) => updateProviderField("templateCode", v)}
          options={SYSLOG_FORMATS.map((item) => ({id: item, name: item}))}
        />
      </FormRow>
      <FormRow labelKey="general:State">
        <SelectField
          value={provider.state || "Enabled"}
          onChange={(v) => updateProviderField("state", v)}
          options={[
            {id: "Enabled", name: i18next.t("general:Enabled")},
            {id: "Disabled", name: i18next.t("general:Disabled")},
          ]}
        />
      </FormRow>
    </React.Fragment>
  );

  const renderLogFields = () => (
    <React.Fragment>
      <FormRow labelKey="general:State">
        <SelectField
          value={provider.state || "Enabled"}
          onChange={(v) => updateProviderField("state", v)}
          options={[
            {id: "Enabled", name: i18next.t("general:Enabled")},
            {id: "Disabled", name: i18next.t("general:Disabled")},
          ]}
        />
      </FormRow>
    </React.Fragment>
  );

  const renderStorageFields = () => (
    <React.Fragment>
      {!["Local File System", "MinIO"].includes(provider.type) ? (
        <FormRow label={i18next.t("provider:Endpoint (Intranet)")} tooltip={i18next.t("provider:Region endpoint for Intranet")}>
          <Input value={provider.intranetEndpoint ?? ""} onChange={(e) => updateProviderField("intranetEndpoint", e.target.value)} />
        </FormRow>
      ) : null}
      {provider.type !== "Local File System" ? (
        <React.Fragment>
          <FormRow label={i18next.t("provider:Endpoint")} tooltip={i18next.t("provider:Region endpoint for Internet")}>
            <Input value={provider.endpoint ?? ""} onChange={(e) => updateProviderField("endpoint", e.target.value)} />
          </FormRow>
          <FormRow label={i18next.t("provider:Bucket")} tooltip={i18next.t("provider:Bucket - Tooltip")}>
            <Input value={provider.bucket ?? ""} onChange={(e) => updateProviderField("bucket", e.target.value)} />
          </FormRow>
        </React.Fragment>
      ) : null}
      <FormRow labelKey="provider:Path prefix">
        <Input value={provider.pathPrefix ?? ""} onChange={(e) => updateProviderField("pathPrefix", e.target.value)} />
      </FormRow>
      <FormRow labelKey="provider:Domain">
        <Input
          value={provider.domain ?? ""}
          disabled={provider.type === "Local File System"}
          onChange={(e) => updateProviderField("domain", e.target.value)}
        />
      </FormRow>
      {["AWS S3", "MinIO"].includes(provider.type) ? (
        <FormRow label={i18next.t("provider:Region ID")} tooltip={i18next.t("provider:Region ID - Tooltip")}>
          <Input value={provider.regionId ?? ""} onChange={(e) => updateProviderField("regionId", e.target.value)} />
        </FormRow>
      ) : null}
    </React.Fragment>
  );

  const renderEndpointOnlyField = () => (
    <FormRow label={i18next.t("provider:Endpoint")} tooltip={i18next.t("provider:Region endpoint for Internet")}>
      <Input value={provider.endpoint ?? ""} onChange={(e) => updateProviderField("endpoint", e.target.value)} />
    </FormRow>
  );

  const appIdLabel = getAppIdLabel(provider);

  return (
    <EditPageShell
      grid
      title={mode === "add" ? i18next.t("provider:New Provider") : i18next.t("provider:Edit Provider")}
      mode={mode}
      backTo="/providers"
      saving={saving}
      onSave={save}
    >
      <FormRow labelKey="general:Name">
        <Input
          value={provider.name ?? ""}
          onChange={(e) => {
            setNameNotUserEdited(false);
            updateProviderField("name", e.target.value);
          }}
        />
      </FormRow>
      <FormRow labelKey="general:Display name">
        <Input
          value={provider.displayName ?? ""}
          onChange={(e) => {
            setDisplayNameNotUserEdited(false);
            updateProviderField("displayName", e.target.value);
          }}
        />
      </FormRow>
      <FormRow labelKey="general:Organization">
        <SearchableSelect
          disabled={!Setting.isAdminUser(account)}
          value={provider.owner ?? ""}
          onChange={(v) => updateProviderField("owner", v)}
          options={[
            ...(Setting.isAdminUser(account) ? [{value: "admin", label: i18next.t("provider:admin (Shared)")}] : []),
            ...organizations,
          ]}
        />
      </FormRow>
      <FormRow labelKey="general:Category">
        <SearchableSelect
          value={provider.category ?? ""}
          onChange={onChangeCategory}
          options={CATEGORIES.map((item) => ({value: item, label: item}))}
        />
      </FormRow>
      <FormRow labelKey="general:Type">
        <SearchableSelect
          value={provider.type ?? ""}
          onChange={onChangeType}
          options={(Setting.getProviderTypeOptions(provider.category) as any[])
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((providerType: any) => ({
              value: providerType.id,
              label: (
                <span className="flex items-center gap-2">
                  <img
                    width={20}
                    height={20}
                    src={Setting.getProviderLogoURL({category: provider.category, type: providerType.id})}
                    alt={providerType.id}
                  />
                  {providerType.name}
                </span>
              ),
              keywords: providerType.name,
            }))}
        />
      </FormRow>
      {subTypeOptions.length > 0 ? (
        <React.Fragment>
          <FormRow labelKey="provider:Sub type">
            <SelectField
              value={provider.subType}
              onChange={(v) => {
                const patch: Record<string, any> = {subType: v};
                if (nameNotUserEdited) {
                  patch.name = getAutoProviderName(provider.category, provider.type, v);
                }
                if (displayNameNotUserEdited) {
                  patch.displayName = getAutoProviderDisplayName(provider.category, provider.type, v);
                }
                patchProvider(patch);
              }}
              options={subTypeOptions}
            />
          </FormRow>
        </React.Fragment>
      ) : null}

      {provider.category === "OAuth" ? renderOAuthFields() : null}

      {hasCredentialRows(provider) ? (
        <React.Fragment>
          {hasClientIdRow(provider) ? (
            <FormRow label={getClientIdLabel(provider).label} tooltip={getClientIdLabel(provider).tooltip}>
              <Input value={provider.clientId ?? ""} onChange={(e) => updateProviderField("clientId", e.target.value)} />
            </FormRow>
          ) : null}
          <FormRow label={getClientSecretLabel(provider).label} tooltip={getClientSecretLabel(provider).tooltip}>
            <Input value={provider.clientSecret ?? ""} onChange={(e) => updateProviderField("clientSecret", e.target.value)} />
          </FormRow>
        </React.Fragment>
      ) : null}

      {hasCredential2Rows(provider) ? (
        <React.Fragment>
          <FormRow label={getClientId2Label(provider).label} tooltip={getClientId2Label(provider).tooltip}>
            <Input value={provider.clientId2 ?? ""} onChange={(e) => updateProviderField("clientId2", e.target.value)} />
          </FormRow>
          {(
            <FormRow label={getClientSecret2Label(provider).label} tooltip={getClientSecret2Label(provider).tooltip}>
              <Input value={provider.clientSecret2 ?? ""} onChange={(e) => updateProviderField("clientSecret2", e.target.value)} />
            </FormRow>
          )}
        </React.Fragment>
      ) : null}

      {appIdLabel ? (
        <FormRow label={appIdLabel.label} tooltip={appIdLabel.tooltip}>
          <Input value={provider.appId ?? ""} onChange={(e) => updateProviderField("appId", e.target.value)} />
        </FormRow>
      ) : null}

      {provider.category === "Notification" ? renderNotificationFields() : null}
      {provider.category === "Email" ? renderEmailFields() : null}
      {provider.category === "Audit" ? renderAuditFields() : null}
      {provider.category === "Log" ? renderLogFields() : null}
      {provider.category === "Storage" ? renderStorageFields() : null}

      {provider.category !== "Log" && provider.category !== "Audit" ? (
        <FormRow block labelKey="provider:Provider URL">
          <Input value={provider.providerUrl ?? ""} onChange={(e) => updateProviderField("providerUrl", e.target.value)} />
        </FormRow>
      ) : null}

      {provider.category === "Captcha" ? (
        <FormRow block labelKey="general:Preview">
          <CaptchaPreview
            owner={provider.owner}
            name={name}
            provider={provider}
            captchaType={provider.type}
            subType={provider.subType}
            clientId={provider.clientId}
            clientSecret={provider.clientSecret}
            clientId2={provider.clientId2}
            clientSecret2={provider.clientSecret2}
            providerUrl={provider.providerUrl}
          />
        </FormRow>
      ) : null}
    </EditPageShell>
  );
}
