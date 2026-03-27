#!/usr/bin/env bash

set -euo pipefail

CONSOLE_IMAGE=${CONSOLE_IMAGE:="quay.io/openshift/origin-console:latest"}
CONSOLE_PORT=${CONSOLE_PORT:=9000}
CONSOLE_IMAGE_PLATFORM=${CONSOLE_IMAGE_PLATFORM:="linux/amd64"}

# Plugin metadata is declared in package.json
PLUGIN_NAME=$(node -p "require('./package.json').consolePlugin.name")

echo "Starting local OpenShift console using existing kubeconfig..."

# Get cluster endpoint and token from current context
CLUSTER_ENDPOINT=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
if [ -z "$CLUSTER_ENDPOINT" ]; then
  echo "Error: Could not determine cluster endpoint from kubeconfig"
  echo "Make sure you have a valid kubeconfig with an active context"
  exit 1
fi

# Try to get token from current context
BEARER_TOKEN=$(kubectl config view --minify --raw -o jsonpath='{.users[0].user.token}' 2>/dev/null)
if [ -z "$BEARER_TOKEN" ]; then
  # If no token in kubeconfig, try to get from oc (for OpenShift)
  BEARER_TOKEN=$(oc whoami -t 2>/dev/null || echo "")
fi

if [ -z "$BEARER_TOKEN" ]; then
  echo "Warning: Could not extract bearer token. Authentication may not work."
  echo "Make sure you're logged in with 'oc login' or 'kubectl' with a valid token"
fi

echo "Using cluster: $CLUSTER_ENDPOINT"

# Use bearer token auth
BRIDGE_USER_AUTH="disabled"
BRIDGE_K8S_MODE="off-cluster"
BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT="$CLUSTER_ENDPOINT"
BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS=true
BRIDGE_K8S_AUTH="bearer-token"
BRIDGE_K8S_AUTH_BEARER_TOKEN="$BEARER_TOKEN"
BRIDGE_USER_SETTINGS_LOCATION="localstorage"
BRIDGE_I18N_NAMESPACES="plugin__${PLUGIN_NAME}"

echo "Console Image: $CONSOLE_IMAGE"
echo "Console URL: http://localhost:${CONSOLE_PORT}"
echo "Console Platform: $CONSOLE_IMAGE_PLATFORM"
echo "NOTE: Using bearer token authentication. MCP Gateway plugin will work via mock broker"

# Prefer podman if installed. Otherwise, fall back to docker.
if [ -x "$(command -v podman)" ]; then
    if [ "$(uname -s)" = "Linux" ]; then
        BRIDGE_PLUGINS="${PLUGIN_NAME}=http://localhost:9001"
        podman run --pull always --platform $CONSOLE_IMAGE_PLATFORM --rm --network=host \
          --env-file <(set | grep BRIDGE) \
          $CONSOLE_IMAGE
    else
        # macOS - use host.containers.internal and add extra host mapping
        BRIDGE_PLUGINS="${PLUGIN_NAME}=http://host.containers.internal:9001"
        podman run --pull always --platform $CONSOLE_IMAGE_PLATFORM --rm -p "$CONSOLE_PORT":9000 \
          --add-host=host.containers.internal:host-gateway \
          --env-file <(set | grep BRIDGE) \
          $CONSOLE_IMAGE
    fi
else
    # Docker - add host mapping for host.docker.internal
    BRIDGE_PLUGINS="${PLUGIN_NAME}=http://host.docker.internal:9001"
    docker run --pull always --platform $CONSOLE_IMAGE_PLATFORM --rm -p "$CONSOLE_PORT":9000 \
      --add-host=host.docker.internal:host-gateway \
      --env-file <(set | grep BRIDGE) \
      $CONSOLE_IMAGE
fi
