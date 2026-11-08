{{/*
Expand the name of the chart.
*/}}
{{- define "masdoor.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "masdoor.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "masdoor.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "masdoor.labels" -}}
helm.sh/chart: {{ include "masdoor.chart" . }}
{{ include "masdoor.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "masdoor.selectorLabels" -}}
app.kubernetes.io/name: {{ include "masdoor.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "masdoor.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "masdoor.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create dataSourceName used in the configmap
*/}}
{{- define "masdoor.dataSourceName" -}}
file:masdoor.db?cache=shared&_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)
{{- end }}

{{/*
Create EnvfromConfigmap
*/}}
{{- define "masdoor.envFromConfigmap" -}}
{{- range . -}}
- name: {{ .name }}
  valueFrom:
    configMapKeyRef:
      name: {{ .configmapName }}
      key: {{ .key }}
{{- end -}}
{{- end }}

{{/*
Create EnvfromSecret
*/}}
{{- define "masdoor.envFromSecret" -}}
{{- range . -}}
- name: {{ .name }}
  valueFrom:
    secretKeyRef:
      name: {{ .secretName }}
      key: {{ .key }}
{{- end -}}
{{- end -}}

{{/*
Create Envfrom
*/}}
{{- define "masdoor.envFrom" -}}
{{- range . -}}
{{- if eq .type "configmap" -}}
- configMapRef:
    name: {{ .name }}
{{ end }}
{{- if eq .type "secret" -}}
- secretRef:
    name: {{ .name }}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Name of the Secret holding the init data
*/}}
{{- define "masdoor.initDataSecretName" -}}
{{- .Values.initData.existingSecret | default (printf "%s-init-data" (include "masdoor.fullname" .)) }}
{{- end }}

{{/*
Key of the init data file in its Secret
*/}}
{{- define "masdoor.initDataKey" -}}
{{- if .Values.initData.existingSecret }}
{{- .Values.initData.existingSecretKey }}
{{- else }}
{{- "init_data.json" }}
{{- end }}
{{- end }}
