#!/bin/sh
set -e

# 필수 환경변수 검증
if [ -z "$LIVEKIT_API_KEY" ] || [ -z "$LIVEKIT_API_SECRET" ]; then
    echo "ERROR: LIVEKIT_API_KEY / LIVEKIT_API_SECRET 환경변수가 설정되지 않았습니다." >&2
    exit 1
fi

if [ -z "$REDIS_PASSWORD" ]; then
    echo "ERROR: REDIS_PASSWORD 환경변수가 설정되지 않았습니다." >&2
    exit 1
fi

# ingress.yaml의 환경변수 치환
RESOLVED_CONFIG_PATH="/tmp/ingress.resolved.yaml"
SRC_CONFIG_PATH="/etc/ingress.yaml"

if [ ! -f "$SRC_CONFIG_PATH" ]; then
    echo "ERROR: $SRC_CONFIG_PATH not found" >&2
    exit 1
fi

if command -v envsubst >/dev/null 2>&1; then
    envsubst < "$SRC_CONFIG_PATH" > "$RESOLVED_CONFIG_PATH"
else
    echo "envsubst not found; using sed fallback for variable substitution" >&2
    cp "$SRC_CONFIG_PATH" "$RESOLVED_CONFIG_PATH"
    # macOS와 Linux 호환을 위해 다른 방식으로 치환
    sed -i.bak "s|\${LIVEKIT_API_KEY}|${LIVEKIT_API_KEY}|g" "$RESOLVED_CONFIG_PATH"
    sed -i.bak "s|\${LIVEKIT_API_SECRET}|${LIVEKIT_API_SECRET}|g" "$RESOLVED_CONFIG_PATH"
    sed -i.bak "s|\${REDIS_PASSWORD}|${REDIS_PASSWORD}|g" "$RESOLVED_CONFIG_PATH"
    rm -f "${RESOLVED_CONFIG_PATH}.bak"
fi

echo "Ingress 설정 파일이 환경변수로 치환되었습니다: $RESOLVED_CONFIG_PATH"

# ingress 실행
export INGRESS_CONFIG_FILE="$RESOLVED_CONFIG_PATH"

# 인수가 없으면 기본 명령어 실행
if [ $# -eq 0 ]; then
    exec ingress
else
    exec "$@"
fi
