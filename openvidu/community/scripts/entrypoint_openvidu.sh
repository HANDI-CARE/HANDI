#!/bin/sh
set -e

if [ "$LAN_PRIVATE_IP" != "none" ]; then
    export NODE_IP="$LAN_PRIVATE_IP"
fi


# 필수 환경변수 검증 (치환 실패 및 런타임 오류 방지)
if [ -z "$LIVEKIT_API_KEY" ] || [ -z "$LIVEKIT_API_SECRET" ]; then
    echo "ERROR: LIVEKIT_API_KEY / LIVEKIT_API_SECRET 환경변수가 설정되지 않았습니다." >&2
    echo "       .env 또는 compose 환경에 키를 설정하고 다시 실행하세요." >&2
    exit 1
fi

# LiveKit secret 최소 길이 검증 (서버 내부 검증 이전에 명확한 오류 메시지 제공)
if [ ${#LIVEKIT_API_SECRET} -lt 32 ]; then
    echo "ERROR: LIVEKIT_API_SECRET 길이가 32자 미만입니다. 더 긴 비밀키를 사용하세요." >&2
    exit 1
fi

# Analytics(Mongo) 사용 시 필요한 자격 증명 검증
# livekit.yaml에서 analytics.enabled가 true이고 사용자/비밀번호가 비어 있으면 런타임에서 panic 발생
# if grep -q "^\s*enabled:\s*true" /etc/livekit.yaml 2>/dev/null; then
#     if [ -z "$MONGO_ADMIN_USERNAME" ] || [ -z "$MONGO_ADMIN_PASSWORD" ]; then
#         echo "ERROR: analytics.enabled=true 인데 MONGO_ADMIN_USERNAME / MONGO_ADMIN_PASSWORD가 비어 있습니다." >&2
#         echo "       Mongo 자격 증명을 설정하거나 analytics.enabled=false로 비활성화하세요." >&2
#         exit 1
#     fi
# fi

# livekit-server는 YAML 내 ${...}를 자동 치환하지 않음
# 실제 로그에 ${LIVEKIT_API_KEY}가 그대로 찍혀 secret 길이 에러가 발생했기 때문에, 서버 기동 전에 /etc/livekit.yaml을 환경변수로 렌더링하도록 추가
# envsubst가 없을 상황을 대비해 sed 대체치환도 넣음
RESOLVED_CONFIG_PATH="/tmp/livekit.resolved.yaml"
SRC_CONFIG_PATH="/etc/livekit.yaml"

if [ ! -f "$SRC_CONFIG_PATH" ]; then
    echo "ERROR: $SRC_CONFIG_PATH not found" >&2
    exit 1
fi

if command -v envsubst >/dev/null 2>&1; then
    # shellcheck disable=SC2016
    envsubst < "$SRC_CONFIG_PATH" > "$RESOLVED_CONFIG_PATH"
else
    echo "envsubst not found; using sed fallback for variable substitution" >&2
    cp "$SRC_CONFIG_PATH" "$RESOLVED_CONFIG_PATH"
    sed -i "s|\\${LIVEKIT_API_KEY}|${LIVEKIT_API_KEY}|g" "$RESOLVED_CONFIG_PATH"
    sed -i "s|\\${LIVEKIT_API_SECRET}|${LIVEKIT_API_SECRET}|g" "$RESOLVED_CONFIG_PATH"
    sed -i "s|\\${REDIS_PASSWORD}|${REDIS_PASSWORD}|g" "$RESOLVED_CONFIG_PATH"
    # Mongo 자격 증명은 livekit.yaml에서 ${MONGO_ADMIN_USERNAME}, ${MONGO_ADMIN_PASSWORD}로 사용됨
    sed -i "s|\\${MONGO_ADMIN_USERNAME}|${MONGO_ADMIN_USERNAME}|g" "$RESOLVED_CONFIG_PATH"
    sed -i "s|\\${MONGO_ADMIN_PASSWORD}|${MONGO_ADMIN_PASSWORD}|g" "$RESOLVED_CONFIG_PATH"
fi

exec ./livekit-server --config "$RESOLVED_CONFIG_PATH"
