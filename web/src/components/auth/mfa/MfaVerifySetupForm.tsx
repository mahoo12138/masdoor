import * as React from "react";
import i18next from "i18next";
import {Copy} from "lucide-react";
import {QRCodeSVG} from "qrcode.react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {CountryCodeSelect} from "@/components/common/CountryCodeSelect";
import {SendCodeInput} from "@/components/auth/SendCodeInput";
import {CodeInput} from "@/components/auth/CodeInput";
import {
  EmailMfaType,
  PushMfaType,
  TotpMfaType,
  mfaSetup,
} from "@/components/auth/mfa/constants";
import * as MfaBackend from "@/backend/MfaBackend";
import * as Setting from "@/lib/setting";

interface Props {
  mfaProps: any;
  application: any;
  user: any;
  onSuccess: (res: any) => void;
  onFail: (res: any) => void;
}

/**
 * Step 2 of the MFA wizard: prove the second factor works before enabling it.
 * Ported from web/src/auth/mfa/MfaVerifyForm.js and its four per-type forms.
 */
export function MfaVerifySetupForm({mfaProps, application, user, onSuccess, onFail}: Props) {
  const isEmail = mfaProps?.mfaType === EmailMfaType;

  const [passcode, setPasscode] = React.useState("");
  const [dest, setDest] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setDest(isEmail ? (user?.email ?? "") : "");
    setPasscode("");
  }, [mfaProps?.mfaType, user, isEmail]);

  if (!mfaProps || !application || !user) {
    return null;
  }

  // Push authenticates through a provider of the application, so the secret is
  // that provider's id rather than something the user typed.
  const resolveSecret = () => {
    if (mfaProps.mfaType === PushMfaType) {
      const provider = application.providers?.find((el: any) => el.provider?.category === "Notification")?.provider;
      return provider ? `${provider.owner}/${provider.name}` : mfaProps.secret;
    }
    return mfaProps.secret;
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitting(true);
    const secret = resolveSecret();
    MfaBackend.MfaSetupVerify({
      passcode,
      mfaType: mfaProps.mfaType,
      secret,
      dest,
      ...user,
    })
      .then((res: any) => {
        if (res.status === "ok") {
          onSuccess({...res, dest, secret});
        } else {
          onFail(res);
        }
      })
      .catch((error: any) =>
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`),
      )
      .finally(() => {
        setPasscode("");
        setSubmitting(false);
      });
  };

  const verifyComplete = () => {
    if (!submitting) {
      submit();
    }
  };

  const renderBody = () => {
    if (isEmail) {
      const hasDest = !!user.email;
      return (
        <>
          {hasDest ? (
            <p className="text-center text-sm text-muted-foreground">
              {i18next.t("mfa:Your email is")} {dest}
            </p>
          ) : (
            <>
              <p className="text-center text-sm text-muted-foreground">
                {i18next.t(
                  "mfa:Please bind your email first, the system will automatically uses the mail for multi-factor authentication",
                )}
              </p>
              <Input
                value={dest}
                placeholder={i18next.t("general:Email")}
                onChange={(e) => setDest(e.target.value)}
              />
            </>
          )}
          <SendCodeInput
            value={passcode}
            onChange={setPasscode}
            method={mfaSetup}
            destType="email"
            dest={mfaProps.secret || dest}
            application={application}
            applicationId={Setting.getApplicationName(application)}
            checkUser={user?.name}
            onComplete={verifyComplete}
          />
        </>
      );
    }

    if (mfaProps.mfaType === TotpMfaType) {
      return (
        <>
          {mfaProps.secret ? (
            <>
              <div className="flex justify-center rounded-lg border bg-white p-4">
                <QRCodeSVG value={mfaProps.url} size={180} level="H" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {i18next.t("mfa:Scan the QR code with your Authenticator App")}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                {i18next.t("mfa:Or copy the secret to your Authenticator App")}
              </p>
              <div className="flex gap-2">
                <Input readOnly value={mfaProps.secret} className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={i18next.t("general:Copy")}
                  onClick={() => Setting.copyToClipboard(mfaProps.secret)}
                >
                  <Copy />
                </Button>
              </div>
            </>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="passcode">{i18next.t("mfa:Verify Code")}</Label>
            <CodeInput id="passcode" autoFocus value={passcode} onChange={setPasscode} onComplete={verifyComplete} />
          </div>
        </>
      );
    }

    if (mfaProps.mfaType === PushMfaType) {
      return (
        <>
          <Input
            value={dest}
            placeholder={i18next.t("mfa:Push notification receiver")}
            onChange={(e) => setDest(e.target.value)}
          />
          <Input
            value={passcode}
            placeholder={i18next.t("login:Verification code")}
            onChange={(e) => setPasscode(e.target.value)}
          />
        </>
      );
    }

    return null;
  };

  return (
    <form className="mx-auto w-full max-w-[320px] space-y-4" onSubmit={submit}>
      {renderBody()}
      <Button type="submit" className="w-full" loading={submitting}>
        {i18next.t("forget:Next Step")}
      </Button>
    </form>
  );
}
