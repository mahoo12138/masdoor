FROM --platform=$BUILDPLATFORM node:20.20.1 AS FRONT
WORKDIR /web

# Copy only dependency files first for better caching
COPY ./web/package.json ./web/yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 1000000

# Copy source files and build
COPY ./web .
RUN rm -rf build build-old build-temp && NODE_OPTIONS="--max-old-space-size=4096" yarn run build

FROM --platform=$BUILDPLATFORM golang:1.26.10 AS BACK
# 国内网络默认走 goproxy.cn；海外构建可 --build-arg GOPROXY=https://proxy.golang.org,direct
ARG GOPROXY=https://goproxy.cn,direct
ENV GOPROXY=${GOPROXY}
WORKDIR /go/src/masdoor

# Copy only go.mod and go.sum first for dependency caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source files
COPY . .

RUN go test -v -run TestGetVersionInfo ./util/system_test.go ./util/system.go ./util/variable.go
RUN ./build.sh

FROM alpine:latest AS STANDARD
LABEL MAINTAINER="https://github.com/Mahoo12138/masdoor"
ARG USER=masdoor
ARG TARGETOS
ARG TARGETARCH
ENV BUILDX_ARCH="${TARGETOS:-linux}_${TARGETARCH:-amd64}"

RUN sed -i 's/https/http/' /etc/apk/repositories
RUN apk add --update sudo
RUN apk add tzdata
RUN apk add curl
RUN apk add ca-certificates && update-ca-certificates

RUN adduser -D $USER -u 1000 \
    && echo "$USER ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/$USER \
    && chmod 0440 /etc/sudoers.d/$USER \
    && mkdir logs \
    && chown -R $USER:$USER logs

USER 1000
WORKDIR /
COPY --from=BACK --chown=$USER:$USER /go/src/masdoor/masdoor_${BUILDX_ARCH} ./server
COPY --from=BACK --chown=$USER:$USER /go/src/masdoor/swagger ./swagger
COPY --from=BACK --chown=$USER:$USER /go/src/masdoor/conf/app.conf ./conf/app.conf
COPY --from=FRONT --chown=$USER:$USER /web/build ./web/build

HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${httpport:-8000}/api/health" > /dev/null || exit 1

ENTRYPOINT ["/server"]


FROM debian:latest AS ALLINONE
LABEL MAINTAINER="https://github.com/Mahoo12138/masdoor"
ARG TARGETOS
ARG TARGETARCH
ENV BUILDX_ARCH="${TARGETOS:-linux}_${TARGETARCH:-amd64}"

RUN apt update
RUN apt install -y ca-certificates lsof curl && update-ca-certificates

WORKDIR /
COPY --from=BACK /go/src/masdoor/masdoor_${BUILDX_ARCH} ./server
COPY --from=BACK /go/src/masdoor/swagger ./swagger
COPY --from=BACK /go/src/masdoor/docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=BACK /go/src/masdoor/conf/app.conf ./conf/app.conf
COPY --from=FRONT /web/build ./web/build

HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${httpport:-8000}/api/health" > /dev/null || exit 1

ENTRYPOINT ["/bin/bash"]
CMD ["/docker-entrypoint.sh"]
