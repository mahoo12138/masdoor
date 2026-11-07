import * as React from "react";
import i18next from "i18next";
import {Badge} from "@/components/ui/badge";
import type {ColumnDef, ColumnFilterOption} from "@/components/crud/types";

/**
 * Translated labels and colours for the stored enum values Masdoor shows in
 * tables and selects. The antd frontend spelled these out per page as a
 * `switch` returning `Setting.getTag(color, i18next.t(key))`; keeping one map
 * per enum here means a list column and its edit-page select can never drift.
 *
 * The variants follow the antd colours: processing → info, success → success,
 * warning/gold/orange → warning, error/red → destructive, default → secondary.
 */
export type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "warning" | "info" | "outline";

export interface EnumEntry {
  /** i18n key; resolved at render so switching language updates the label */
  i18nKey: string;
  variant?: BadgeVariant;
}

export type EnumMap = Record<string, EnumEntry>;

export const INVITATION_STATES: EnumMap = {
  "Active": {i18nKey: "general:Active", variant: "success"},
  "Suspended": {i18nKey: "general:Suspended", variant: "secondary"},
};

export const KEY_STATES: EnumMap = {
  "Active": {i18nKey: "general:Active", variant: "success"},
  "Inactive": {i18nKey: "key:Inactive", variant: "secondary"},
};

export const KEY_TYPES: EnumMap = {
  "Organization": {i18nKey: "general:Organization"},
  "Application": {i18nKey: "general:Application"},
  "User": {i18nKey: "general:User"},
  "General": {i18nKey: "general:General"},
  "Prometheus": {i18nKey: "Prometheus"},
};

/** what a provider row's "Rule" means depends on the provider it points at */
export const PROVIDER_CAPTCHA_RULES: EnumMap = {
  "None": {i18nKey: "general:None"},
  "Dynamic": {i18nKey: "application:Dynamic"},
  "Always": {i18nKey: "application:Always"},
  "Internet-Only": {i18nKey: "application:Internet-Only"},
};

export const PROVIDER_GOOGLE_RULES: EnumMap = {
  "Default": {i18nKey: "general:Default"},
  "OneTap": {i18nKey: "One Tap"},
};

export const PROVIDER_CODE_RULES: EnumMap = {
  "all": {i18nKey: "All"},
  "signup": {i18nKey: "Signup"},
  "login": {i18nKey: "Login"},
  "forget": {i18nKey: "Forget Password"},
  "reset": {i18nKey: "Reset Password"},
  "mfaSetup": {i18nKey: "Set MFA"},
  "mfaAuth": {i18nKey: "MFA Auth"},
  "magicLink": {i18nKey: "login:Magic link"},
};

/** which of the user's identifiers an external account may bind to */
export const PROVIDER_BINDING_RULES: EnumMap = {
  "Email": {i18nKey: "general:Email"},
  "Name": {i18nKey: "general:Name"},
  "Phone": {i18nKey: "general:Phone"},
};

/**
 * The label for a stored value. Values with no entry (and keys with no
 * namespace, such as "GET") fall through to the text itself, which is what the
 * antd `default:` branches did.
 */
export function enumLabel(map: EnumMap, value: any): string {
  const entry = map[value];
  if (!entry) {
    return `${value ?? ""}`;
  }
  return entry.i18nKey.includes(":") ? i18next.t(entry.i18nKey) : entry.i18nKey;
}

/** Options for `SearchableSelect` / `MultiSelect`. */
export function enumOptions(map: EnumMap) {
  return Object.keys(map).map((value) => ({value, label: enumLabel(map, value)}));
}

/** Options for `SelectField`, which takes `{id, name}`. */
export function enumSelectOptions(map: EnumMap) {
  return Object.keys(map).map((value) => ({id: value, name: enumLabel(map, value)}));
}

export function EnumBadge({map, value}: {map: EnumMap; value: any}) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return <Badge variant={(map[value]?.variant ?? "outline") as any}>{enumLabel(map, value)}</Badge>;
}

/** A table column that renders a stored enum value as a translated badge. */
export function enumColumn<T>(options: {
  dataIndex: string;
  title: React.ReactNode;
  map: EnumMap;
  width?: number | string;
  sortable?: boolean;
  searchable?: boolean;
  /** render the header filter menu; pass `true` to build it from `map` */
  filters?: boolean | ColumnFilterOption[];
}): ColumnDef<T> {
  const {dataIndex, title, map, width = 110, sortable = true, searchable = false, filters} = options;
  return {
    dataIndex,
    title,
    width,
    sortable,
    searchable,
    filters: filters === true ? enumFilters(map) : filters || undefined,
    render: (value) => <EnumBadge map={map} value={value} />,
  };
}

/** the values of an enum map as a column filter menu, in declaration order */
export function enumFilters(map: EnumMap): ColumnFilterOption[] {
  return Object.keys(map).map((value) => ({value, label: enumLabel(map, value)}));
}
