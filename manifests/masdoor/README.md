# Masdoor

Masdoor is a lightweight self-hosted identity provider with a web UI, supporting OAuth 2.0, OIDC, WebAuthn / Passkeys, TOTP and MFA. This is the official Helm chart of the Masdoor fork.

- Source: <https://github.com/mahoo12138/masdoor>
- Source: <https://github.com/mahoo12138/masdoor/tree/master/manifests/masdoor>

## Prerequisites

- Kubernetes 1.19+
- Helm v3.8+

## Installation

```shell
helm install masdoor oci://ghcr.io/masdoor/helm-charts/masdoor --version <version>
```

To install with a custom values file:

```shell
helm install masdoor oci://ghcr.io/masdoor/helm-charts/masdoor \
  --version <version> \
  -f my-values.yaml
```

The chart does not expose Masdoor outside the cluster by default. Use `kubectl port-forward svc/<service-name> 8000:8000` to try it, or enable Ingress or the Gateway API below.

## Upgrading

```shell
helm upgrade masdoor oci://ghcr.io/masdoor/helm-charts/masdoor --version <version>
```


## Uninstalling

```shell
helm uninstall masdoor
```

## Configuration

Override any value from [values.yaml](https://github.com/mahoo12138/masdoor/blob/master/manifests/masdoor/values.yaml) using `--set` or a custom values file.

### Core parameters

| Parameter | Description | Default |
|---|---|---|
| `replicaCount` | Number of Masdoor pods | `1` |
| `image.repository` | Docker image repository | `mahoo12138` |
| `image.name` | Docker image name | `masdoor` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `image.tag` | Image tag (defaults to chart appVersion) | `""` |
| `config` | Masdoor `app.conf` content (Go template) | See values.yaml |
| `configFromSecret` | Name of an existing Secret holding `app.conf` | `""` |

### Database

Masdoor stores everything in a single SQLite file. The chart's default `config` template points at `file:masdoor.db` in the container filesystem, which does not survive a pod restart — mount a PersistentVolume through `extraVolumes` / `extraVolumeMounts` and override the `config` value so `dataSourceName` lands on it.

### Declarative configuration (init data)

Organizations, applications, users, providers, roles and the other Masdoor objects can be kept in the values file, in the init data file format. The chart stores them in a Secret, Masdoor applies them at startup and checks them for changes every `initData.watchInterval` seconds, so a `helm upgrade` that changes them takes effect without restarting the pods.

```yaml
initData:
  enabled: true
  data:
    organizations:
      - owner: admin
        name: acme
        displayName: Acme
        passwordType: bcrypt
    applications:
      - owner: admin
        name: app-acme
        organization: acme
        displayName: Acme Portal
        redirectUris:
          - https://portal.acme.example.com/callback
    users:
      - owner: acme
        name: alice
        displayName: Alice
        password: change-me
        signupApplication: app-acme
```

With `initData.merge: true` (the default), an object that already exists only gets the fields written in the data, its other fields keep the values edited in the web UI. A user's `password` is only used when the user is created, so users can change their own passwords. Objects removed from the data are not deleted from Masdoor.

| Parameter | Description | Default |
|---|---|---|
| `initData.enabled` | Apply `initData.data` (or `initData.existingSecret`) | `false` |
| `initData.merge` | Update existing objects with the given fields only; when `false`, they are deleted and re-created on every apply | `true` |
| `initData.watchInterval` | Seconds between the checks for changes, `0` applies the data only at startup (the pods then restart when `initData.data` changes) | `30` |
| `initData.existingSecret` | Name of an existing Secret holding the data, instead of `initData.data` | `""` |
| `initData.existingSecretKey` | Key of the file in `existingSecret`; a `.yaml`/`.yml` key is read as YAML, any other as JSON | `init_data.yaml` |
| `initData.data` | The objects to apply | `{}` |

### Service

| Parameter | Description | Default |
|---|---|---|
| `service.type` | Kubernetes service type | `ClusterIP` |
| `service.port` | Service port | `8000` |
| `service.annotations` | Annotations to add to the Service | `{}` |

### Ingress

Exposes Masdoor via a standard Kubernetes `Ingress` resource.

| Parameter | Description | Default |
|---|---|---|
| `ingress.enabled` | Enable Ingress | `false` |
| `ingress.className` | IngressClass name | `""` |
| `ingress.annotations` | Ingress annotations | `{}` |
| `ingress.hosts` | List of `{host, paths}` entries | See values.yaml |
| `ingress.tls` | TLS configuration | `[]` |

Example:

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: masdoor.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: masdoor-tls
      hosts:
        - masdoor.example.com
```

### Gateway API

Exposes Masdoor via the [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/) (`HTTPRoute` + optional `Gateway`). This is the modern successor to Ingress, supported by Istio, Envoy Gateway, Cilium, Kong, NGINX Gateway Fabric, and others.

**Requires:** Gateway API CRDs (`gateway.networking.k8s.io/v1`) installed in the cluster and a compatible controller running.

#### Core Gateway API parameters

| Parameter | Description | Default |
|---|---|---|
| `gatewayApi.enabled` | Enable HTTPRoute creation | `false` |
| `gatewayApi.createGateway` | Also create a `Gateway` resource | `false` |
| `gatewayApi.annotations` | Annotations for the HTTPRoute | `{}` |
| `gatewayApi.labels` | Extra labels for the HTTPRoute | `{}` |
| `gatewayApi.parentRefs` | Parent Gateway references for the HTTPRoute | `[]` |
| `gatewayApi.hostnames` | Hostnames to match (Host header) | `[]` |
| `gatewayApi.rules` | Routing rules (matches, filters, backendRefs) | PathPrefix `/` → chart Service |

#### Gateway creation parameters (`gatewayApi.gateway.*`)

Only used when `gatewayApi.createGateway=true`.

| Parameter | Description | Default |
|---|---|---|
| `gatewayApi.gateway.name` | Gateway resource name (defaults to chart fullname) | `""` |
| `gatewayApi.gateway.gatewayClassName` | **Required.** GatewayClass name (e.g. `istio`, `envoy`) | `""` |
| `gatewayApi.gateway.annotations` | Annotations for the Gateway | `{}` |
| `gatewayApi.gateway.labels` | Extra labels for the Gateway | `{}` |
| `gatewayApi.gateway.listeners` | Gateway listeners | HTTP:80 (see values.yaml) |

#### HTTPS redirect parameters (`gatewayApi.httpsRedirect.*`)

Creates a second HTTPRoute that redirects HTTP traffic to HTTPS.

| Parameter | Description | Default |
|---|---|---|
| `gatewayApi.httpsRedirect.enabled` | Enable the HTTP→HTTPS redirect HTTPRoute | `false` |
| `gatewayApi.httpsRedirect.httpListenerName` | HTTP listener `sectionName` on the Gateway | `http` |
| `gatewayApi.httpsRedirect.httpsListenerName` | HTTPS listener `sectionName` on the Gateway | `https` |
| `gatewayApi.httpsRedirect.hostnames` | Hostnames for the redirect route (falls back to `gatewayApi.hostnames`) | `[]` |
| `gatewayApi.httpsRedirect.statusCode` | Redirect response code | `301` |
| `gatewayApi.httpsRedirect.parentRefs` | Override parentRefs for the redirect route | `[]` |

#### Example: attach to an existing Gateway

```yaml
gatewayApi:
  enabled: true
  parentRefs:
    - name: my-gateway
      namespace: gateway-system
      sectionName: https
  hostnames:
    - masdoor.example.com
```

#### Example: create a new Gateway (Istio) with HTTP→HTTPS redirect

```yaml
gatewayApi:
  enabled: true
  createGateway: true
  hostnames:
    - masdoor.example.com
  gateway:
    gatewayClassName: istio
    listeners:
      - name: http
        protocol: HTTP
        port: 80
        allowedRoutes:
          namespaces:
            from: Same
      - name: https
        protocol: HTTPS
        port: 443
        tls:
          certificateRefs:
            - name: masdoor-tls
              kind: Secret
        allowedRoutes:
          namespaces:
            from: Same
  httpsRedirect:
    enabled: true
```

### Resources and scaling

| Parameter | Description | Default |
|---|---|---|
| `resources` | CPU/memory requests and limits | `{}` |
| `autoscaling.enabled` | Enable HorizontalPodAutoscaler | `false` |
| `autoscaling.minReplicas` | HPA minimum replicas | `1` |
| `autoscaling.maxReplicas` | HPA maximum replicas | `100` |
| `autoscaling.targetCPUUtilizationPercentage` | HPA CPU target | `80` |

### Scheduling

| Parameter | Description | Default |
|---|---|---|
| `nodeSelector` | Node selector labels | `{}` |
| `tolerations` | Pod tolerations | `[]` |
| `affinity` | Pod affinity/anti-affinity rules | `{}` |
| `priorityClassName` | Pod priority class | `""` |

### Extra containers and volumes

| Parameter | Description | Default |
|---|---|---|
| `initContainersEnabled` | Enable init containers | `false` |
| `initContainers` | Init container definitions (YAML string) | `""` |
| `extraContainersEnabled` | Enable sidecar containers | `false` |
| `extraContainers` | Sidecar container definitions (YAML string) | `""` |
| `extraVolumeMounts` | Extra volume mounts for the Masdoor container | `[]` |
| `extraVolumes` | Extra volumes for the pod | `[]` |
| `defaultConfigVolumeEnabled` | Mount the default config volume at `/conf` | `true` |

### Environment variables

| Parameter | Description | Default |
|---|---|---|
| `envFromSecret` | Env vars sourced from individual Secret keys | `[]` |
| `envFromConfigmap` | Env vars sourced from individual ConfigMap keys | `[]` |
| `envFrom` | Env vars from entire Secrets or ConfigMaps | `[]` |

### Probes

| Parameter | Description | Default |
|---|---|---|
| `probe.path` | HTTP path requested by all probes | `/api/health` |
| `probe.startup.enabled` | Enable startup probe, which holds off the other probes until Masdoor has started | `true` |
| `probe.startup.initialDelaySeconds` | Seconds before the first startup check | `0` |
| `probe.startup.periodSeconds` | Seconds between startup checks | `10` |
| `probe.startup.timeoutSeconds` | Seconds before a startup check times out | `5` |
| `probe.startup.failureThreshold` | Failed startup checks before the container is restarted (`30` x `10s` allows 5 minutes to start) | `30` |
| `probe.readiness.enabled` | Enable readiness probe | `true` |
| `probe.readiness.initialDelaySeconds` | Seconds before the first readiness check | `0` |
| `probe.readiness.periodSeconds` | Seconds between readiness checks | `10` |
| `probe.readiness.timeoutSeconds` | Seconds before a readiness check times out | `5` |
| `probe.readiness.failureThreshold` | Failed readiness checks before the pod is taken out of the Service | `3` |
| `probe.liveness.enabled` | Enable liveness probe | `true` |
| `probe.liveness.initialDelaySeconds` | Seconds before the first liveness check | `0` |
| `probe.liveness.periodSeconds` | Seconds between liveness checks | `10` |
| `probe.liveness.timeoutSeconds` | Seconds before a liveness check times out | `5` |
| `probe.liveness.failureThreshold` | Failed liveness checks before the container is restarted | `3` |
