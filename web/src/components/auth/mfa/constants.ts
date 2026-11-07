// MFA type identifiers as the Masdoor backend uses them.
export const EmailMfaType = "email";
export const TotpMfaType = "app";
export const PushMfaType = "push";
export const RecoveryMfaType = "recovery";

// Answers the login API can return instead of a session.
export const NextMfa = "NextMfa";
export const RequiredMfa = "RequiredMfa";

// `method` values of the MFA forms, mirroring web/src/auth/mfa/MfaVerifyForm.js.
export const mfaAuth = "mfaAuth";
export const mfaSetup = "mfaSetup";
