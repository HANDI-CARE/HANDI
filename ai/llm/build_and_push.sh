#!/usr/bin/env bash
set -Eeuo pipefail

# Usage:
#   ./build_and_push.sh [TAG] [DOCKER_USER] [EXTRA_TAG ...]
# Defaults:
#   TAG=latest
#   DOCKER_USER=${DOCKER_USER:-kyngmn}
# Env overrides:
#   DOCKER_PLATFORM   -> if set, passed to docker build as --platform "$DOCKER_PLATFORM"
#   DOCKERFILE        -> defaults to "Dockerfile"
#   DOCKER_CONTEXT    -> defaults to current script directory
#   DOCKER_BUILD_ARGS -> extra args appended to docker build (e.g., "--build-arg KEY=VALUE")

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

trap 'echo "❌ Build failed (LLM)." >&2' ERR

TAG="${1:-latest}"
DOCKER_USER="${2:-${DOCKER_USER:-kyngmn}}"
shift || true
shift || true
EXTRA_TAGS=("${@:-}")

IMAGE_NAME_BASE="handi-llm"
LOCAL_IMAGE="${IMAGE_NAME_BASE}:${TAG}"
REMOTE_IMAGE_BASE="${DOCKER_USER}/${IMAGE_NAME_BASE}"

DOCKERFILE_PATH="${DOCKERFILE:-Dockerfile}"
BUILD_CONTEXT="${DOCKER_CONTEXT:-$SCRIPT_DIR}"
EXTRA_BUILD_ARGS="${DOCKER_BUILD_ARGS:-}"

# Basic validations
command -v docker >/dev/null 2>&1 || { echo "Docker is not installed or not in PATH" >&2; exit 1; }
[[ -f "$DOCKERFILE_PATH" ]] || { echo "Dockerfile not found at: $DOCKERFILE_PATH" >&2; exit 1; }

echo "Building ${LOCAL_IMAGE} (context: ${BUILD_CONTEXT}, dockerfile: ${DOCKERFILE_PATH})"
if [[ -n "${DOCKER_PLATFORM:-}" ]]; then
  docker build -t "${LOCAL_IMAGE}" -f "$DOCKERFILE_PATH" --platform "${DOCKER_PLATFORM}" ${EXTRA_BUILD_ARGS} "$BUILD_CONTEXT"
else
  docker build -t "${LOCAL_IMAGE}" -f "$DOCKERFILE_PATH" ${EXTRA_BUILD_ARGS} "$BUILD_CONTEXT"
fi

echo "Tagging and pushing to remote: ${REMOTE_IMAGE_BASE}:${TAG}"
docker tag "${LOCAL_IMAGE}" "${REMOTE_IMAGE_BASE}:${TAG}"
docker push "${REMOTE_IMAGE_BASE}:${TAG}"

if [[ ${#EXTRA_TAGS[@]} -gt 0 ]]; then
  echo "Pushing extra tags: ${EXTRA_TAGS[*]}"
  for et in "${EXTRA_TAGS[@]}"; do
    [[ -n "$et" ]] || continue
    docker tag "${LOCAL_IMAGE}" "${REMOTE_IMAGE_BASE}:${et}"
    docker push "${REMOTE_IMAGE_BASE}:${et}"
  done
fi

echo "✅ Done: ${REMOTE_IMAGE_BASE}:${TAG} ${EXTRA_TAGS:+(and ${EXTRA_TAGS[*]})}"


