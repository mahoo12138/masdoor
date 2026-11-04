#!/bin/bash
#try to connect to google to determine whether user need to use proxy
curl www.google.com -o /dev/null --connect-timeout 5 2> /dev/null
if [ $? == 0 ]
then
    echo "Successfully connected to Google, no need to use Go proxy"
else
    echo "Google is blocked, Go proxy is enabled: GOPROXY=https://goproxy.cn,direct"
    export GOPROXY="https://goproxy.cn,direct"
fi

# Build only for the current platform. Docker passes TARGETARCH; local builds default to the host arch.
ARCH="${TARGETARCH:-$(go env GOARCH)}"
CGO_ENABLED=0 GOOS=linux GOARCH="$ARCH" go build -trimpath -ldflags="-w -s" -o "masdoor_linux_${ARCH}" .
