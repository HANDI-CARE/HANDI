// Jenkins CI/CD 멀티브랜치 파이프라인 정의 파일
// be-prod, fe-prod 브랜치에 커밋이 반영될 때 각각 배포 자동화

// * env.BUILD_NUMBER -> 내장 환경변수

pipeline {
    agent any
    
    tools {
        // Node.js LTS 버전 설정
        nodejs 'NodeJS-22_17_1'
    }

    environment {
        // Docker 경로 설정
        DOCKER_PATH = "/usr/local/bin:${env.PATH}"
        // Jenkins 빌드 번호로 태그 지정
        BUILD_TAG = "${env.BUILD_NUMBER}"
        
        // Backend 환경변수
        BE_IMAGE_NAME = 'kyngmn/handi-backend'
        BE_CONTAINER_NAME = 'backend'
        
        // Frontend S3+CloudFront 환경변수
        S3_BUCKET = 'handi-frontend-bucket'
        CLOUDFRONT_DISTRIBUTION_ID = credentials('cloudfront_distribution_id')
        AWS_DEFAULT_REGION = 'ap-northeast-2'
        
        // 성능 최적화 환경변수
        GRADLE_OPTS = '-Dorg.gradle.daemon=true -Dorg.gradle.parallel=true -Dorg.gradle.caching=true -Xmx2g'
        NODE_OPTIONS = '--max_old_space_size=4096'

        // OpenVidu 환경변수
        LAN_DOMAIN = 'rtc.brewprint.xyz'

        // 백엔드 배포 환경변수
        PASS               = credentials('PASS')
        FASTAPI_HTTP_URL = 'http://handi-pharmguard:5500/api/v1'

        // AI image push success flags (gate for compose deploy)
        AI_LLM_PUSHED = 'false'
        AI_PHARM_PUSHED = 'false'
    }

    stages {
        // 전역 환경 변수 설정
        stage('[SETUP] Setup Credentials') {
            steps {
                withCredentials([
                    file(credentialsId: 'OPENVIDU_PROD_ENV', variable: 'OPENVIDU_ENV_FILE')
                ]) {
                    script {
                        def configContent = readFile(env.OPENVIDU_ENV_FILE)
                        echo "🔍 환경변수 파일 내용 확인 중..."
                        
                        // 안전한 정규식으로 특정 변수 추출
                        def apiKeyMatcher = configContent =~ /LIVEKIT_API_KEY=([^\s\n\r]+)/
                        def apiSecretMatcher = configContent =~ /LIVEKIT_API_SECRET=([^\s\n\r]+)/
                        
                        if (apiKeyMatcher.find()) {
                            env.LIVEKIT_API_KEY = apiKeyMatcher.group(1).trim()
                            echo "✅ LIVEKIT_API_KEY 설정 완료"
                        } else {
                            error("❌ OPENVIDU_PROD_ENV 파일에서 LIVEKIT_API_KEY를 찾을 수 없습니다")
                        }
                        
                        if (apiSecretMatcher.find()) {
                            env.LIVEKIT_API_SECRET = apiSecretMatcher.group(1).trim()
                            echo "✅ LIVEKIT_API_SECRET 설정 완료"
                        } else {
                            error("❌ OPENVIDU_PROD_ENV 파일에서 LIVEKIT_API_SECRET을 찾을 수 없습니다")
                        }
                        
                        // 키 길이 검증
                        if (env.LIVEKIT_API_KEY.length() < 16) {
                            error("❌ LIVEKIT_API_KEY가 너무 짧습니다 (최소 16자 필요)")
                        }
                        if (env.LIVEKIT_API_SECRET.length() < 32) {
                            error("❌ LIVEKIT_API_SECRET이 너무 짧습니다 (최소 32자 필요)")
                        }
                    }
                }
            }
        }

        // 전역 환경변수 예시 / 테스트
        stage('[SETUP] Test') {
            steps {
                script {
                    // 환경변수 설정 확인 (보안상 키 값은 마스킹)
                    if (env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET) {
                        echo "✅ LiveKit API Key 길이: ${env.LIVEKIT_API_KEY.length()}자"
                        echo "✅ LiveKit API Secret 길이: ${env.LIVEKIT_API_SECRET.length()}자"
                        echo "✅ LiveKit 환경변수 설정 검증 완료"
                    } else {
                        error("❌ LiveKit 환경변수가 제대로 설정되지 않았습니다")
                    }
                }
            }
        }
        
        // CI 단계 - MR target 브랜치 기준 테스트
        stage('[CI] Build & Test') {
            when {
                anyOf {
                    changeRequest(target: 'be-dev')
                    changeRequest(target: 'fe-dev')
                    changeRequest(target: 'be-prod')
                    changeRequest(target: 'fe-prod')
                    changeRequest(target: 'ai-prod')
                }
            }
            parallel {
                // Backend CI
                stage('Backend CI') {
                    when {
                        anyOf {
                            changeRequest(target: 'be-dev')
                            changeRequest(target: 'be-prod')
                        }
                    }
                    steps {
                        script {
                            dir('backend') {
                                sh '''
                                    echo "⚙️ Backend 빌드 및 테스트 시작..."
                                    
                                    # Gradle 실행 권한 확인
                                    if [ ! -x "./gradlew" ]; then
                                        echo "🔧 gradlew 실행 권한 추가..."
                                        chmod +x ./gradlew
                                    fi
                                    
                                    # 환경 정보 확인
                                    echo "📋 Gradle 버전: $(./gradlew --version | grep Gradle | head -1)"
                                    echo "📋 Java 버전: $(java -version 2>&1 | head -n 1)"
                                    
                                    # 빌드 및 테스트 실행
                                    if ./gradlew clean build test --parallel --build-cache --daemon --max-workers=4 --configure-on-demand; then
                                        echo "✅ Backend 빌드 및 테스트 완료"
                                    else
                                        echo "❌ Backend 빌드 또는 테스트 실패"
                                        exit 1
                                    fi
                                    
                                    # 빌드 결과 확인
                                    echo "📊 빌드 결과 확인..."
                                    if [ -d "build/reports/tests/test" ]; then
                                        echo "✅ 테스트 리포트 생성됨"
                                    fi
                                    
                                    if ls build/libs/*.jar 1> /dev/null 2>&1; then
                                        echo "✅ JAR 파일 생성 확인:"
                                        ls -la build/libs/*.jar
                                    else
                                        echo "❌ JAR 파일이 생성되지 않았습니다"
                                        exit 1
                                    fi
                                '''
                            }
                        }
                    }
                }
                
                // Frontend CI
                stage('Frontend CI') {
                    when {
                        anyOf {
                            changeRequest(target: 'fe-dev')
                            changeRequest(target: 'fe-prod')
                        }
                    }
                    steps {
                        script {
                            // 1) 프론트엔드 테스트 및 빌드, Capacitor 동기화까지 수행
                            dir('frontend') {
                                withCredentials([
                                    string(credentialsId: 'VITE_API_URL', variable: 'VITE_API_URL'),
                                    string(credentialsId: 'VITE_USE_PROXY', variable: 'VITE_USE_PROXY'),
                                ]) {
                                    sh '''
                                        echo "⚙️ Frontend 빌드 및 테스트 시작..."
                                        
                                        # 환경 설정
                                        export NODE_OPTIONS="--max_old_space_size=4096"
                                        export NPM_CONFIG_REGISTRY="https://registry.npmjs.org/"
                                        
                                        # npm 버전 확인
                                        echo "📋 npm 버전: $(npm --version)"
                                        echo "📋 node 버전: $(node --version)"
                                        
                                        # package-lock.json 확인
                                        if [ ! -f "package-lock.json" ]; then
                                            echo "⚠️ package-lock.json 없음, npm install로 생성"
                                            npm install --package-lock-only
                                        fi
                                        
                                        # npm 캐시 정리 및 재구성
                                        npm cache clean --force
                                        npm cache verify
                                        
                                        # node_modules 완전 제거
                                        rm -rf node_modules
                                        
                                        # 재시도 로직 (더 짧은 타임아웃)
                                        for i in {1..3}; do
                                            echo "🔄 의존성 설치 시도 $i/3..."
                                            # `npm ci` 후에 한번 더 필요한 패키지를 설치하여 npm 버그로 인해 필수 패키지가 설치되지 않는 현상 방지
                                            if timeout 180 npm ci --no-optional --no-audit --progress=false &&
                                                timeout 180 npm install rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs; then
                                                echo "✅ 의존성 설치 완료"
                                                break
                                            else
                                                echo "⚠️ 시도 $i 실패"
                                                if [ $i -lt 3 ]; then
                                                    echo "🧹 정리 후 재시도..."
                                                    rm -rf node_modules package-lock.json
                                                    npm cache clean --force
                                                    npm install --package-lock-only
                                                    # npm 버그로 인해 필수 패키지가 설치되지 않는 현상 방지
                                                    npm install rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs
                                                    sleep 10
                                                else
                                                    echo "❌ 의존성 설치 최종 실패"
                                                    exit 1
                                                fi
                                            fi
                                        done
                                        
                                        if npm run test:ci; then
                                            echo "✅ CI 테스트 통과"
                                        else
                                            echo "❌ CI 테스트 실패"
                                            exit 1
                                        fi
                                        
                                        if npm run build; then
                                            echo "✅ CI 빌드 완료"
                                        else
                                            echo "❌ CI 빌드 실패"
                                            exit 1
                                        fi
                                        
                                        # Capacitor 자산 동기화 (android)
                                        echo "🔄 Capacitor sync(android) 실행"
                                        npx cap sync android
                                        echo "✅ Frontend 웹 자산 및 Capacitor 동기화 완료"
                                        
                                        echo "✅ Frontend CI 완료"
                                    '''
                                }
                            }
                            
                            // 2) Android Debug APK 빌드 및 파일명 규칙으로 복사
                            dir('frontend/android') {
                                sh '''
                                    echo "🛠️ Android Gradle 빌드 시작 (Debug APK)"

                                    # gradlew 실행권한 보장
                                    if [ ! -x "./gradlew" ]; then
                                      chmod +x ./gradlew
                                    fi

                                    # JDK 21 확보 및 사용 (Capacitor v7 빌드에 필요)
                                    if ! java -version 2>&1 | head -n 1 | grep -q 'version "21'; then
                                      JDK_DIR="$WORKSPACE/.jdk-21"
                                      if [ ! -x "$JDK_DIR/bin/java" ]; then
                                        JDK_URL="https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse?project=jdk"
                                        TMP_DIR=$(mktemp -d)
                                        echo "⬇️ JDK21 다운로드: $JDK_URL"
                                        curl -L --retry 3 --fail -o "$TMP_DIR/jdk21.tar.gz" "$JDK_URL"
                                        mkdir -p "$TMP_DIR/extract"
                                        tar -xzf "$TMP_DIR/jdk21.tar.gz" -C "$TMP_DIR/extract"
                                        EXTRACTED=$(find "$TMP_DIR/extract" -maxdepth 1 -type d -name 'jdk-*' -print -quit)
                                        if [ -z "$EXTRACTED" ]; then echo "❌ JDK 압축 해제 실패"; exit 1; fi
                                        rm -rf "$JDK_DIR"
                                        mv "$EXTRACTED" "$JDK_DIR"
                                        rm -rf "$TMP_DIR"
                                      fi
                                      export JAVA_HOME="$JDK_DIR"
                                      export PATH="$JAVA_HOME/bin:$PATH"
                                    fi

                                    echo "📋 Java 버전: $(java -version 2>&1 | head -n 1)"
                                    ./gradlew --version || true

                                    # Android SDK 자동 설치 (미설치 시)
                                    SDK_DIR="${ANDROID_SDK_ROOT:-$WORKSPACE/.android-sdk}"
                                    mkdir -p "$SDK_DIR"
                                    export ANDROID_SDK_ROOT="$SDK_DIR"
                                    export PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"

                                    if ! command -v sdkmanager >/dev/null 2>&1; then
                                      echo "🔽 Android cmdline-tools 설치 (Ubuntu) ..."

                                      CT_URL="https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip"

                                      TMP_DIR=$(mktemp -d)
                                      echo "➡️ 다운로드: $CT_URL"
                                      if command -v curl >/dev/null 2>&1; then
                                        curl -L --retry 3 --fail -o "$TMP_DIR/ct.zip" "$CT_URL"
                                      elif command -v wget >/dev/null 2>&1; then
                                        wget -O "$TMP_DIR/ct.zip" "$CT_URL"
                                      else
                                        echo "❌ curl 또는 wget 이 필요합니다"
                                        exit 1
                                      fi
                                      busybox unzip -q "$TMP_DIR/ct.zip" -d "$TMP_DIR"
                                      mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"
                                      rm -rf "$ANDROID_SDK_ROOT/cmdline-tools/latest"
                                      if [ -d "$TMP_DIR/cmdline-tools" ]; then
                                        mv "$TMP_DIR/cmdline-tools" "$ANDROID_SDK_ROOT/cmdline-tools/latest"
                                      else
                                        mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools/latest"
                                        mv "$TMP_DIR"/* "$ANDROID_SDK_ROOT/cmdline-tools/latest/" || true
                                      fi
                                      rm -rf "$TMP_DIR"
                                      export PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"
                                    fi

                                    # 라이선스 수락 및 필요한 컴포넌트 설치
                                    yes | sdkmanager --licenses >/dev/null 2>&1 || true
                                    sdkmanager --install "platform-tools" "platforms;android-35" "build-tools;35.0.0" || {
                                      echo "⚠️ 일부 구성요소 설치 실패, 재시도";
                                      yes | sdkmanager --licenses >/dev/null 2>&1 || true
                                      sdkmanager --install "platform-tools" "platforms;android-35" "build-tools;35.0.0"
                                    }

                                    # local.properties 작성
                                    echo "sdk.dir=$ANDROID_SDK_ROOT" > local.properties
                                    echo "✅ ANDROID_SDK_ROOT: $ANDROID_SDK_ROOT"

                                    # 디버그 빌드
                                    if ./gradlew clean assembleDebug --parallel --build-cache --daemon --max-workers=4; then
                                      echo "✅ Android Debug APK 빌드 완료"
                                    else
                                      echo "❌ Android Debug APK 빌드 실패"
                                      exit 1
                                    fi

                                    APK_DIR="app/build/outputs/apk/debug"
                                    # 대표 APK 경로 탐색 (app-debug.apk 또는 유사 파일명)
                                    SOURCE_APK=$(ls -1 "$APK_DIR"/*.apk 2>/dev/null | head -1 || true)
                                    if [ -z "$SOURCE_APK" ]; then
                                      echo "❌ APK 파일을 찾을 수 없습니다: $APK_DIR"
                                      exit 1
                                    fi

                                    BUILD_TYPE="debug"
                                    # Jenkins 멀티브랜치에서 제공되는 BRANCH_NAME/GIT_BRANCH 중 사용
                                    BRANCH_RAW="${GIT_BRANCH:-$BRANCH_NAME}"
                                    # origin/ 또는 refs/heads/ 접두사 제거 후, 안전한 문자열로 변환
                                    BRANCH_SAFE=$(echo "$BRANCH_RAW" | sed -E 's#^origin/##; s#^refs/heads/##' | tr '[:upper:]' '[:lower:]' | sed -E 's#[^a-z0-9._-]+#-#g')
                                    TS=$(date +%Y%m%d-%H%M%S)
                                    TARGET_APK="$APK_DIR/handi-${BUILD_TYPE}-${TS}-${BRANCH_SAFE}.apk"

                                    echo "📦 APK 리네이밍: $(basename "$SOURCE_APK") -> $(basename "$TARGET_APK")"
                                    cp "$SOURCE_APK" "$TARGET_APK"

                                    echo "📁 APK 산출물 목록"
                                    ls -la "$APK_DIR" || true
                                '''
                            }

                            // 3) Jenkins 아티팩트 업로드 (규칙 파일만)
                            archiveArtifacts artifacts: 'frontend/android/app/build/outputs/apk/debug/handi-*.apk', fingerprint: true, allowEmptyArchive: false

                            // 4) Mattermost 알림 전송
                            def apkPath = sh(script: 'ls -1 frontend/android/app/build/outputs/apk/debug/handi-*.apk | head -1', returnStdout: true).trim()
                            if (apkPath) {
                                def apkName = sh(script: "basename \"${apkPath}\"", returnStdout: true).trim()
                                def branchRaw = env.GIT_BRANCH ?: env.BRANCH_NAME
                                def branch = branchRaw?.replaceFirst(/^origin\//, '')?.replaceFirst(/^refs\/heads\//, '')
                                def artifactUrl = "${env.BUILD_URL}artifact/${apkPath}"
                                def buildType = 'debug'

                                // 커밋 URL/해시 계산 (Jenkins env → git 명령 순으로 보완)
                                def repoUrl = env.GIT_URL
                                if (!repoUrl) {
                                    repoUrl = sh(script: 'git config --get remote.origin.url || true', returnStdout: true).trim()
                                }
                                if (repoUrl) {
                                    repoUrl = repoUrl.replaceFirst(/\\.git$/, '')
                                }
                                def gitCommit = env.GIT_COMMIT
                                if (!gitCommit) {
                                    gitCommit = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                                }
                                def shortCommit = gitCommit ? gitCommit.take(7) : 'unknown'
                                def commitUrl = (repoUrl && gitCommit) ? "${repoUrl}/commit/${gitCommit}" : ''

                                def mmMessage = """📦 Android ${buildType} APK 빌드 완료\n- 브랜치: ${branch}\n- 커밋: [${shortCommit}](${commitUrl})\n- APK: [${apkName}](${artifactUrl})"""
                                mattermostSend message: mmMessage, color: '#2EB886'
                            } else {
                                echo '⚠️ Mattermost 알림 건너뜀: APK 경로를 찾을 수 없습니다.'
                            }
                        }
                    }
                }
                
                // AI Basic CI (ai-prod 대상 MR에서만): Python 구문 검증 및 경량 정적 검사
                stage('AI Basic CI') {
                    when {
                        anyOf {
                            changeRequest(target: 'ai-prod')
                        }
                    }
                    steps {
                        sh '''
                            export PATH="/usr/local/bin:$DOCKER_PATH"
                            echo "🐳 Docker 환경 확인 (AI Basic CI)..."
                            if ! which docker > /dev/null 2>&1; then
                                echo "❌ Docker not found in PATH"
                                exit 1
                            fi
                            docker --version || exit 1

                            set -e
                            for dir in ai/llm ai/pharmguard; do
                                if [ -d "$dir" ]; then
                                    echo "🔎 Syntax compile & lightweight lint: $dir"
                                    docker run --rm -v "$PWD/$dir":/app -w /app python:3.11-slim /bin/sh -lc "\
                                        python -m compileall -q . && \
                                        pip install --no-cache-dir ruff && \
                                        ruff check --select E9,F63,F7,F82 .
                                    "
                                fi
                            done
                            echo "✅ AI Basic CI 완료"
                        '''
                    }
                }
            }
        }
        
        stage('[CD] Deploy Services') {
            when {
                anyOf {
                    branch 'be-prod'
                    branch 'fe-prod'
                    branch 'ai-prod'
                    expression { return env.GIT_BRANCH?.endsWith('be-prod') }
                    expression { return env.GIT_BRANCH?.endsWith('fe-prod') }
                    expression { return env.GIT_BRANCH?.endsWith('ai-prod') }
                    changeRequest(target: 'ai-prod')
                }
            }
            stages {
                stage('Backend Environment Check') {
                    when {
                        anyOf {
                            branch 'be-prod'
                            expression { return env.GIT_BRANCH?.endsWith('be-prod') }
                        }
                    }
                    steps {
                        // Docker 환경 확인 (Backend CD 전용 - 강화된 검증)
                        sh '''
                            export PATH="/usr/local/bin:$DOCKER_PATH"
                            echo "🐳 Docker 환경 확인 중..."
                            
                            # Docker 바이너리 확인
                            if ! which docker > /dev/null 2>&1; then
                                echo "❌ Docker not found in PATH"
                                exit 1
                            fi
                            echo "✅ Docker binary found: $(which docker)"
                            
                            # Docker 버전 확인
                            DOCKER_VERSION=$(docker --version 2>/dev/null || echo "")
                            if [ -z "$DOCKER_VERSION" ]; then
                                echo "❌ Docker version check failed"
                                exit 1
                            fi
                            echo "✅ Docker version: $DOCKER_VERSION"
                            
                            # Docker 데몬 상태 확인
                            if ! docker info > /dev/null 2>&1; then
                                echo "❌ Docker daemon not running or not accessible"
                                echo "Docker daemon status check failed"
                                exit 1
                            fi
                            echo "✅ Docker daemon is running"
                            
                            # Docker 디스크 공간 확인
                            DOCKER_SPACE=$(docker system df --format "table {{.Type}}\t{{.Size}}" 2>/dev/null || echo "")
                            if [ -n "$DOCKER_SPACE" ]; then
                                echo "📊 Docker disk usage:"
                                echo "$DOCKER_SPACE"
                            fi
                            
                            echo "🚀 Docker 환경 검증 완료!"
                        '''
                    }
                }
                stage('OpenVidu Environment Check') {
                    when {
                        anyOf {
                            branch 'be-prod'
                            expression { return env.GIT_BRANCH?.endsWith('be-prod') }
                        }
                    }
                    steps {
                        // Docker 환경 확인 (OpenVidu CD용 - 동일 검증)
                        sh '''
                            export PATH="/usr/local/bin:$DOCKER_PATH"
                            echo "🐳 Docker 환경 확인 중 (OpenVidu)..."

                            if ! which docker > /dev/null 2>&1; then
                                echo "❌ Docker not found in PATH"
                                exit 1
                            fi
                            echo "✅ Docker binary found: $(which docker)"

                            DOCKER_VERSION=$(docker --version 2>/dev/null || echo "")
                            if [ -z "$DOCKER_VERSION" ]; then
                                echo "❌ Docker version check failed"
                                exit 1
                            fi
                            echo "✅ Docker version: $DOCKER_VERSION"

                            if ! docker info > /dev/null 2>&1; then
                                echo "❌ Docker daemon not running or not accessible"
                                exit 1
                            fi
                            echo "✅ Docker daemon is running"

                            DOCKER_SPACE=$(docker system df --format "table {{.Type}}\t{{.Size}}" 2>/dev/null || echo "")
                            if [ -n "$DOCKER_SPACE" ]; then
                                echo "📊 Docker disk usage:"
                                echo "$DOCKER_SPACE"
                            fi

                            echo "🚀 Docker 환경 검증 완료 (OpenVidu)!"
                        '''
                    }
                }
                // AI용 ChromaDB 보장 단계 (없으면 기동 및 초기화)
                stage('AI ChromaDB Ensure') {
                    when {
                        anyOf {
                            branch 'ai-prod'
                            expression { return env.GIT_BRANCH?.endsWith('ai-prod') }
                            changeRequest(target: 'ai-prod')
                        }
                    }
                    steps {
                        withCredentials([file(credentialsId: 'AI_PROD_ENV', variable: 'ENV_FILE')]) {
                            dir('ai') {
                                sh '''
                                    set -e
                                    export PATH="/usr/local/bin:$DOCKER_PATH"
                                    echo "🔎 chromadb 컨테이너 존재 여부 확인"
                                    docker network create handi-network || true
                                    if docker ps -a --format "{{.Names}}" | grep -w chromadb >/dev/null 2>&1; then
                                        echo "✅ chromadb 이미 존재. 스킵"
                                    else
                                        echo "🚀 chromadb 기동 및 초기화"
                                        docker-compose -f docker-compose-prod.yml --env-file "$ENV_FILE" up -d chromadb
                                        docker-compose -f docker-compose-prod.yml --env-file "$ENV_FILE" run --rm vectordb-init
                                    fi
                                '''
                            }
                        }
                    }
                }
                // AI용 RabbitMQ 보장 단계 (없으면 기동)
                stage('AI RabbitMQ Ensure') {
                    when {
                        anyOf {
                            branch 'ai-prod'
                            expression { return env.GIT_BRANCH?.endsWith('ai-prod') }
                            changeRequest(target: 'ai-prod')
                        }
                    }
                    steps {
                        withCredentials([
                            string(credentialsId: 'PASS', variable: 'PASS')
                        ]) {
                            dir('ai') {
                                sh '''
                                    set -e
                                    export PATH="/usr/local/bin:$DOCKER_PATH"
                                    echo "🔎 rabbitmq 컨테이너 존재 여부 확인"
                                    docker network create handi-network || true
                                    if docker ps -a --format "{{.Names}}" | grep -w handi-rabbitmq-prod >/dev/null 2>&1; then
                                        echo "✅ rabbitmq 이미 존재. 스킵"
                                    else
                                        echo "🚀 rabbitmq 기동"
                                        docker-compose -f docker-compose-prod.yml up -d rabbitmq
                                    fi
                                '''
                            }
                        }
                    }
                }
                stage('Deploy') {
                    parallel {
                        // be-prod: OpenVidu -> Backend 직렬 실행 묶음
                        stage('BE Prod Deploy') {
                            when {
                                anyOf {
                                    branch 'be-prod'
                                    expression { return env.GIT_BRANCH?.endsWith('be-prod') }
                                }
                            }
                            steps {
                                script {
                                    // 1) OpenVidu Deploy
                                    dir('openvidu/community') {
                                        withCredentials([file(credentialsId: 'OPENVIDU_PROD_ENV', variable: 'ENV_FILE')]) {
                                            try {
                                                sh '''
                                                    echo "🚀 OpenVidu 서비스 배포 시작..."
                                                    
                                                    # 환경변수 검증
                                                    if [ -z "$LIVEKIT_API_KEY" ] || [ -z "$LIVEKIT_API_SECRET" ]; then
                                                        echo "❌ LIVEKIT_API_KEY 또는 LIVEKIT_API_SECRET이 설정되지 않았습니다"
                                                        exit 1
                                                    fi
                                                    echo "✅ LiveKit 환경변수 검증 완료"

                                                    # 네트워크 존재 보장
									                docker network create handi-network || true

										            # 실행 중일 수 있는 컨테이너 강제 종료/삭제 (충돌 방지)
#                                                    for c in openvidu-caddy-proxy-prod openvidu-redis-prod openvidu-minio-prod openvidu-server-prod openvidu-ingress-prod openvidu-egress-prod openvidu-operator-prod openvidu-ready-check-prod openvidu-setup-prod; do
#                                                    docker rm -f "$c" 2>/dev/null || true
#                                                    done
                                                    # 혹시 남은 orphans까지 정리 (데이터 볼륨은 보존)
#                                                    docker-compose -f docker-compose-prod.yaml down --remove-orphans || true

                                                    # 신규 서비스 시작 (충돌 시 한 번 더 정리 후 재시도)
#                                                    if ! docker-compose -f docker-compose-prod.yaml --env-file "$ENV_FILE" up -d; then
#                                                    echo "⚠️ up 실패: 잠재적 네임 충돌 정리 후 재시도..."
#                                                    docker ps -a --format '{{.ID}} {{.Names}}' | awk '/openvidu-.*-prod/{print $1}' | xargs -r docker rm -f || true
#                                                    docker-compose -f docker-compose-prod.yaml --env-file "$ENV_FILE" up -d
#                                                    fi

                                                    echo "🔍 OpenVidu 헬스체크 진행 중..."
                                                    for i in {1..18}; do
                                                        sleep 5
                                                        # caddy-proxy와 openvidu, ingress 일부가 Up 상태인지 확인
                                                        if docker-compose -f docker-compose-prod.yaml ps | grep -E "(caddy-proxy|openvidu|ingress)" | grep Up >/dev/null 2>&1; then
                                                            echo "✅ OpenVidu 관련 핵심 서비스가 실행 중입니다"
                                                            docker-compose -f docker-compose-prod.yaml ps
                                                            exit 0
                                                        fi
                                                        echo "⏳ 헬스체크 $i/18 재시도..."
                                                    done

                                                    echo "❌ OpenVidu 헬스체크 실패"
                                                    exit 1
                                                '''
                                            } catch (Exception e) {
                                                echo "💥 OpenVidu 배포 실패! 재시도 수행..."
                                                sh '''
                                                    echo "🧹 실패한 서비스 정리 중..."
                                                    docker-compose -f docker-compose-prod.yaml logs caddy-proxy | tail -100 || true
                                                    docker-compose -f docker-compose-prod.yaml logs openvidu | tail -100 || true
                                                    docker-compose -f docker-compose-prod.yaml logs ingress | tail -100 || true
                                                    docker-compose -f docker-compose-prod.yaml down || true

                                                    echo "🔄 재기동 시도"
                                                    docker-compose -f docker-compose-prod.yaml --env-file "$ENV_FILE" up -d
                                                    sleep 10
                                                    docker-compose -f docker-compose-prod.yaml ps
                                                '''
                                                error("OpenVidu 배포 실패")
                                            }
                                        }
                                    }

                                    // 2) Backend Deploy (Build -> Docker Build/Push -> Compose Deploy)
                                    // Backend Build & Test (빠른 실행)
                                    dir('backend') {
                                        sh '''
                                            echo "⚙️ Backend 프로덕션 빌드 시작..."
                                            
                                            # Gradle 실행 권한 확인
                                            if [ ! -x "./gradlew" ]; then
                                                echo "🔧 gradlew 실행 권한 추가..."
                                                chmod +x ./gradlew
                                            fi
                                            
                                            # Gradle 및 Java 버전 확인
                                            echo "📋 Gradle 버전 확인..."
                                            ./gradlew --version
                                            echo "📋 Java 버전: $(java -version 2>&1 | head -n 1)"
                                            
                                            # 빌드 실행
                                            if ./gradlew clean build test --parallel --build-cache --daemon --max-workers=4 --configure-on-demand; then
                                                echo "✅ Backend 프로덕션 빌드 완료"
                                            else
                                                echo "❌ Backend 프로덕션 빌드 실패"
                                                exit 1
                                            fi
                                            
                                            # JAR 파일 생성 확인
                                            echo "📦 JAR 파일 확인..."
                                            if ls build/libs/*.jar 1> /dev/null 2>&1; then
                                                echo "✅ JAR 파일 생성 확인:"
                                                ls -la build/libs/*.jar
                                                
                                                # 실행 가능한 JAR 파일 확인
                                                EXECUTABLE_JAR=$(ls build/libs/*.jar | grep -v plain | head -1)
                                                if [ -z "$EXECUTABLE_JAR" ]; then
                                                    echo "❌ 실행 가능한 JAR 파일을 찾을 수 없습니다"
                                                    exit 1
                                                fi
                                                echo "📦 사용할 JAR: $EXECUTABLE_JAR"
                                            else
                                                echo "❌ JAR 파일이 생성되지 않았습니다"
                                                exit 1
                                            fi
                                        '''
                                    }

                                    // Backend Docker Build & Push
                                    dir('backend') {
                                        sh '''
                                            echo "🐳 Backend Docker 이미지 빌드 시작..."
                                            
                                            # Docker 환경 재확인
                                            echo "📋 Docker 버전: $(docker --version)"
                                            
                                            # Dockerfile.prod 존재 확인
                                            if [ ! -f "Dockerfile.prod" ]; then
                                                echo "❌ Dockerfile.prod 파일이 존재하지 않습니다"
                                                exit 1
                                            fi
                                            echo "✅ Dockerfile.prod 확인됨"
                                            
                                            # JAR 파일 재확인
                                            if ! ls build/libs/*.jar 1> /dev/null 2>&1; then
                                                echo "❌ JAR 파일이 없습니다. Docker 빌드를 진행할 수 없습니다."
                                                exit 1
                                            fi
                                            
                                            # plain JAR 임시 백업 (Docker 빌드에서 혼란 방지)
                                            echo "🧹 Docker 빌드를 위한 JAR 파일 정리..."
                                            if [ -f "build/libs/backend-0.0.1-SNAPSHOT-plain.jar" ]; then
                                                mv build/libs/backend-0.0.1-SNAPSHOT-plain.jar build/libs/backend-0.0.1-SNAPSHOT-plain.jar.bak
                                                echo "✅ plain JAR 임시 백업"
                                            fi
                                            
                                            # 빌드 정보 출력
                                            echo "📋 빌드 정보:"
                                            echo "  이미지명: ''' + "${BE_IMAGE_NAME}" + '''"
                                            echo "  태그: ''' + "${BUILD_TAG}" + '''"
                                            
                                            # Docker 빌드 실행
                                            if docker build \
                                                -f Dockerfile.prod \
                                                --platform linux/amd64 \
                                                -t ''' + "${BE_IMAGE_NAME}:${BUILD_TAG}" + ''' \
                                                .; then
                                                echo "✅ Backend Docker 이미지 빌드 완료"
                                            else
                                                echo "❌ Backend Docker 이미지 빌드 실패"
                                                # plain JAR 복원
                                                if [ -f "build/libs/backend-0.0.1-SNAPSHOT-plain.jar.bak" ]; then
                                                    mv build/libs/backend-0.0.1-SNAPSHOT-plain.jar.bak build/libs/backend-0.0.1-SNAPSHOT-plain.jar
                                                fi
                                                exit 1
                                            fi
                                            
                                            # 빌드된 이미지 확인
                                            echo "📦 빌드된 Docker 이미지 확인..."
                                            docker images | grep "''' + "${BE_IMAGE_NAME}" + '''" | head -3
                                            
                                            # 이미지 크기 확인
                                            IMAGE_SIZE=$(docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep "''' + "${BE_IMAGE_NAME}" + '''" | head -1)
                                            echo "📊 이미지 정보: $IMAGE_SIZE"
                                            
                                            # plain JAR 복원
                                            if [ -f "build/libs/backend-0.0.1-SNAPSHOT-plain.jar.bak" ]; then
                                                mv build/libs/backend-0.0.1-SNAPSHOT-plain.jar.bak build/libs/backend-0.0.1-SNAPSHOT-plain.jar
                                                echo "✅ plain JAR 복원"
                                            fi
                                        '''
                                        withCredentials([usernamePassword(credentialsId: 'docker_hub_credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                                            sh '''
                                                echo "📦 Docker Hub에 이미지 푸시 시작..."
                                                
                                                # Docker Hub 로그인
                                                if echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin; then
                                                    echo "✅ Docker Hub 로그인 성공"
                                                else
                                                    echo "❌ Docker Hub 로그인 실패"
                                                    exit 1
                                                fi
                                                
                                                # 이미지 푸시
                                                echo "📤 이미지 푸시 중: ''' + "${BE_IMAGE_NAME}:${BUILD_TAG}" + '''"
                                                if docker push ''' + "${BE_IMAGE_NAME}:${BUILD_TAG}" + '''; then
                                                    echo "✅ Docker Hub 푸시 완료"
                                                else
                                                    echo "❌ Docker Hub 푸시 실패"
                                                    docker logout
                                                    exit 1
                                                fi
                                                
                                                # 최신 태그도 푸시 (선택사항)
                                                echo "🏷️ latest 태그 생성 및 푸시..."
                                                docker tag ''' + "${BE_IMAGE_NAME}:${BUILD_TAG}" + ''' ''' + "${BE_IMAGE_NAME}" + ''':latest
                                                docker push ''' + "${BE_IMAGE_NAME}" + ''':latest
                                                
                                                docker logout
                                                echo "✅ Docker Hub 작업 완료"
                                            '''
                                        }
                                    }

                                    // Deploy with Docker Compose (롤백 지원)
                                    dir('backend') {
                                        withCredentials([
                                            // OAuth2 인증 정보
                                            string(credentialsId: 'oauth_naver_id', variable: 'NAVER_ID'),
                                            string(credentialsId: 'oauth_naver_secret', variable: 'NAVER_SECRET'),
                                            string(credentialsId: 'oauth_naver_uri', variable: 'NAVER_URI'),
                                            string(credentialsId: 'oauth_google_id', variable: 'GOOGLE_ID'),
                                            string(credentialsId: 'oauth_google_secret', variable: 'GOOGLE_SECRET'),
                                            string(credentialsId: 'oauth_google_uri', variable: 'GOOGLE_URI'),
                                            string(credentialsId: 'oauth_kakao_id', variable: 'KAKAO_ID'),
                                            string(credentialsId: 'oauth_kakao_uri', variable: 'KAKAO_URI'),
                                            // JWT
                                            string(credentialsId: 'auth_jwt_secret', variable: 'JWT_SECRET'),
                                            // Twilio 인증 정보
                                            string(credentialsId: 'twilio_verify_service_sid', variable: 'TWILIO_VERIFY_SERVICE_SID'),
                                            string(credentialsId: 'twilio_account_sid', variable: 'TWILIO_ACCOUNT_SID'),
                                            string(credentialsId: 'twilio_auth_token', variable: 'TWILIO_AUTH_TOKEN'),
                                            string(credentialsId: 'twilio_from_number', variable: 'TWILIO_FROM_NUMBER'),
                                            // OpenVidu 환경파일
                                            file(credentialsId: 'OPENVIDU_PROD_ENV', variable: 'OPENVIDU_ENV_FILE')
                                        ]) {
                                            script {
                                                try {
                                                    sh '''
                                                        # 현재 실행 중인 컨테이너 백업
                                                        CURRENT_IMAGE=$(docker ps --format "table {{.Image}}" | grep backend | head -1 || echo "none")
                                                        echo "💾 현재 백엔드 이미지: $CURRENT_IMAGE"
                                                        
                                                        # 새 버전 배포
                                                        export BUILD_TAG=''' + "${BUILD_TAG}" + '''
                                                        echo "🚀 새 버전 배포: ${BUILD_TAG}"
                                                        
                                                        # Stop existing services
                                                        docker-compose -f docker-compose-prod.yml stop backend || true
                                                        docker-compose -f docker-compose-prod.yml rm -f backend || true
                                                        
                                                        
                                                        # Start new services
                                                        docker-compose -f docker-compose-prod.yml --env-file "$OPENVIDU_ENV_FILE" up -d
                                                        
                                                        # Health check (60초 대기 - 더 안정적)
                                                        echo "🔍 헬스체크 진행 중..."
                                                        for i in {1..12}; do
                                                            sleep 5
                                                            if docker-compose -f docker-compose-prod.yml ps | grep "Up" | grep backend; then
                                                                echo "✅ Backend 서비스 정상 작동"
                                                                exit 0
                                                            fi
                                                            echo "⏳ 헬스체크 $i/12 재시도..."
                                                        done
                                                        
                                                        echo "❌ Backend 헬스체크 실패"
                                                        exit 1
                                                    '''
                                                } catch (Exception e) {
                                                    echo "💥 배포 실패! 롤백 시작..."
                                                    sh '''
                                                        echo "🧹 실패한 서비스 정리 중..."
                                                        docker-compose -f docker-compose-prod.yml stop backend redis handi-minio || true
                                                        docker-compose -f docker-compose-prod.yml rm -f backend redis handi-minio || true
                                                        
                                                        echo "🔄 롤백 실행: latest 버전으로 복구"
                                                        export BUILD_TAG=latest
                                                        docker-compose -f docker-compose-prod.yml up -d
                                                        
                                                        echo "🔍 롤백 헬스체크 진행 중..."
                                                        sleep 10
                                                        docker-compose -f docker-compose-prod.yml ps
                                                        docker-compose -f docker-compose-prod.yml logs backend | tail -20
                                                        echo "✅ 롤백 완료"
                                                    '''
                                                    error("Backend 배포 실패로 인한 롤백 완료")
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Frontend 배포 (fe-prod 브랜치에서만) - Direct S3+CloudFront 배포
                        stage('Frontend Deploy') {
                            when {
                                anyOf {
                                    branch 'fe-prod'
                                    expression { return env.GIT_BRANCH?.endsWith('fe-prod') }
                                }
                            }
                            steps {
                                script {
                                    // Frontend Build & Test & Deploy
                                    dir('frontend') {
                                        withCredentials([
                                            string(credentialsId: 'VITE_API_URL', variable: 'VITE_API_URL'),
                                            string(credentialsId: 'VITE_USE_PROXY', variable: 'VITE_USE_PROXY'),
                                        ]) {
                                            // 의존성 설치 및 테스트 실행
                                            sh '''
                                                echo "📦 Frontend 의존성 설치 시작..."
                                                
                                                # 환경 설정
                                                export NODE_OPTIONS="--max_old_space_size=4096"
                                                export NPM_CONFIG_REGISTRY="https://registry.npmjs.org/"
                                                
                                                # npm 버전 확인
                                                echo "📋 npm 버전: $(npm --version)"
                                                echo "📋 node 버전: $(node --version)"
                                                
                                                # package-lock.json 확인
                                                if [ ! -f "package-lock.json" ]; then
                                                    echo "⚠️ package-lock.json 없음, npm install로 생성"
                                                    npm install --package-lock-only
                                                fi
                                                
                                                # npm 캐시 정리 및 재구성
                                                npm cache clean --force
                                                npm cache verify
                                                
                                                # node_modules 완전 제거
                                                rm -rf node_modules
                                                
                                                # 재시도 로직 (더 짧은 타임아웃)
                                                for i in {1..3}; do
                                                    echo "🔄 의존성 설치 시도 $i/3..."
                                                    # `npm ci` 후에 한번 더 필요한 패키지를 설치하여 npm 버그로 인해 필수 패키지가 설치되지 않는 현상 방지
                                                    if timeout 180 npm ci --no-optional --no-audit --progress=false &&
                                                        timeout 180 npm install rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs; then
                                                        echo "✅ 의존성 설치 완료"
                                                        break
                                                    else
                                                        echo "⚠️ 시도 $i 실패"
                                                        if [ $i -lt 3 ]; then
                                                            echo "🧹 정리 후 재시도..."
                                                            rm -rf node_modules package-lock.json
                                                            npm cache clean --force
                                                            npm install --package-lock-only
                                                            # npm 버그로 인해 필수 패키지가 설치되지 않는 현상 방지
                                                            npm install rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs
                                                            sleep 10
                                                        else
                                                            echo "❌ 의존성 설치 최종 실패"
                                                            exit 1
                                                        fi
                                                    fi
                                                done
                                                
                                                echo "🧪 Frontend 테스트 실행 중..."
                                                if npm run test:ci; then
                                                    echo "✅ 테스트 통과"
                                                else
                                                    echo "❌ 테스트 실패"
                                                    exit 1
                                                fi
                                                
                                                echo "⚙️ Frontend 빌드 시작..."
                                                if NODE_OPTIONS="--max_old_space_size=4096" npm run build; then
                                                    echo "✅ Frontend 빌드 완료"
                                                else
                                                    echo "❌ Frontend 빌드 실패"
                                                    exit 1
                                                fi
                                            '''
                                            
                                            // S3 배포 및 CloudFront 캐시 무효화
                                            withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws_credentials']]) {
                                                sh '''
                                                    echo "🚀 프론트엔드 배포 시작..."
                                                    
                                                    # 환경변수 확인
                                                    if [ -z "$S3_BUCKET" ] || [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
                                                        echo "❗ 필요한 환경변수가 설정되지 않았습니다."
                                                        exit 1
                                                    fi
                                                    
                                                    echo "S3 버킷: $S3_BUCKET"
                                                    echo "CloudFront 배포 ID: $CLOUDFRONT_DISTRIBUTION_ID"
                                                    
                                                    # build 디렉토리 존재 확인
                                                    if [ ! -d "build" ]; then
                                                        echo "❌ build 디렉토리가 존재하지 않습니다"
                                                        exit 1
                                                    fi
                                                    
                                                    echo "📁 S3에 정적 파일 업로드 중..."
                                                    if ! aws s3 sync build/client/ s3://$S3_BUCKET/dist/ --delete --cache-control "public, max-age=31536000, immutable" --cli-read-timeout 300 --cli-connect-timeout 60; then
                                                        echo "⚠️ S3 업로드 재시도 중..."
                                                        sleep 5
                                                        if ! aws s3 sync build/client/ s3://$S3_BUCKET/dist/ --delete --cache-control "public, max-age=31536000, immutable" --cli-read-timeout 300 --cli-connect-timeout 60; then
                                                            echo "❌ S3 업로드 최종 실패"
                                                            exit 1
                                                        fi
                                                    fi
                                                    echo "✅ S3 업로드 완료"
                                                    
                                                    echo "🔄 index.html 캐시 설정 재지정..."
                                                    if ! aws s3 cp build/client/index.html s3://$S3_BUCKET/dist/index.html --cache-control "public, max-age=0, must-revalidate" --cli-read-timeout 300 --cli-connect-timeout 60; then
                                                        echo "⚠️ index.html 업로드 재시도 중..."
                                                        sleep 5
                                                        if ! aws s3 cp build/client/index.html s3://$S3_BUCKET/dist/index.html --cache-control "public, max-age=0, must-revalidate" --cli-read-timeout 300 --cli-connect-timeout 60; then
                                                            echo "❌ index.html 업로드 최종 실패"
                                                            exit 1
                                                        fi
                                                    fi
                                                    echo "✅ index.html 캐시 설정 완료"
                                                    
                                                    echo "♻️ CloudFront 캐시 무효화 요청 중..."
                                                    INVALIDATION_ID=$(aws cloudfront create-invalidation \
                                                    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
                                                    --paths "/*" \
                                                    --query "Invalidation.Id" \
                                                    --output text 2>/dev/null)
                                                    
                                                    if [ -z "$INVALIDATION_ID" ] || [ "$INVALIDATION_ID" = "None" ]; then
                                                        echo "❌ CloudFront 무효화 요청 실패"
                                                        exit 1
                                                    fi
                                                    echo "📋 무효화 ID: $INVALIDATION_ID"
                                                    
                                                    echo "⏳ 무효화 완료 대기 중..."
                                                    if ! aws cloudfront wait invalidation-completed \
                                                    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
                                                    --id $INVALIDATION_ID; then
                                                        echo "❌ CloudFront 무효화 대기 실패"
                                                        exit 1
                                                    fi
                                                    echo "✅ CloudFront 무효화 완료"
                                                    
                                                    echo "🔍 배포 상태 확인..."
                                                    if ! aws s3 ls s3://$S3_BUCKET/dist/index.html > /dev/null 2>&1; then
                                                        echo "❌ 배포 상태 확인 실패"
                                                        exit 1
                                                    fi
                                                    echo "✅ 배포 상태 확인 완료"
                                                    
                                                    echo "🎉 프론트엔드 배포 완료!"
                                                '''
                                            }
                                        }
                                    }
                                }
                            }
                        }


                        // AI 배포 (ai-prod 브랜치 또는 ai-prod 대상 MR에서만)
                        stage('AI Deploy - LLM') {
                            when {
                                anyOf {
                                    branch 'ai-prod'
                                    expression { return env.GIT_BRANCH?.endsWith('ai-prod') }
                                    changeRequest(target: 'ai-prod')
                                }
                            }
                            steps {
                                sh '''
                                    export PATH="/usr/local/bin:$DOCKER_PATH"
                                    echo "🐳 Docker 환경 확인 중 (LLM)..."
                                    if ! which docker > /dev/null 2>&1; then
                                        echo "❌ Docker not found in PATH"
                                        exit 1
                                    fi
                                    echo "✅ Docker binary: $(which docker)"
                                    DOCKER_VERSION=$(docker --version 2>/dev/null || echo "")
                                    if [ -z "$DOCKER_VERSION" ]; then
                                        echo "❌ Docker version check failed"
                                        exit 1
                                    fi
                                    echo "✅ Docker version: $DOCKER_VERSION"
                                '''
                                dir('ai/llm') {
                                    withCredentials([usernamePassword(credentialsId: 'docker_hub_credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                                        script {
                                            try {
                                                sh '''
                                                    set -e
                                                    echo "🔐 Docker Hub 로그인 (LLM)"
                                                    echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                                                    echo "🔧 실행 권한 설정"
                                                    chmod +x build_and_push.sh || true
                                                    export DOCKER_PLATFORM=linux/amd64
                                                    echo "🏷️ 태그: ${BUILD_TAG} (추가 태그: latest)"
                                                    ./build_and_push.sh "${BUILD_TAG}" "$DOCKER_USER" latest
                                                    docker logout || true
                                                '''
                                                env.AI_LLM_PUSHED = 'true'
                                            } catch (Exception e) {
                                                env.AI_LLM_PUSHED = 'false'
                                                error("LLM 이미지 푸시 실패")
                                            }
                                        }
                                    }
                                }
                                // LLM 전용 컨테이너 교체 (푸시된 새 태그로)
                                withCredentials([
                                    file(credentialsId: 'AI_PROD_ENV', variable: 'ENV_FILE'),
                                    usernamePassword(credentialsId: 'docker_hub_credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')
                                ]) {
                                    sh '''
                                        set -e
                                        export PATH="/usr/local/bin:$DOCKER_PATH"
                                        echo "🔐 Docker Hub 로그인 (LLM Deploy)"
                                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin

                                        export APP_TAG="${BUILD_TAG}"
                                        REPO_LLM="$DOCKER_USER/handi-llm:${APP_TAG}"

                                        echo "⏳ 레지스트리 반영 확인 (LLM)"
                                        for i in {1..18}; do
                                            if docker manifest inspect "$REPO_LLM" >/dev/null 2>&1; then
                                                echo "✅ 이미지 사용 가능: $REPO_LLM"
                                                break
                                            fi
                                            echo "⏳ 재시도 $i/18..."
                                            sleep 5
                                            if [ "$i" -eq 18 ]; then
                                                echo "❌ 새 태그가 레지스트리에 아직 없습니다: $REPO_LLM"
                                                exit 1
                                            fi
                                        done

                                        echo "🛑 기존 LLM 컨테이너 정지/제거"
                                        docker-compose -f ai/docker-compose-prod.yml --env-file "$ENV_FILE" stop handi-llm || true
                                        docker-compose -f ai/docker-compose-prod.yml --env-file "$ENV_FILE" rm -f handi-llm || true

                                        echo "📥 LLM 이미지 Pull (APP_TAG=${APP_TAG})"
                                        docker-compose -f ai/docker-compose-prod.yml --env-file "$ENV_FILE" pull handi-llm

                                        echo "🚀 LLM 컨테이너 재기동"
                                        docker-compose -f ai/docker-compose-prod.yml --env-file "$ENV_FILE" up -d --no-deps handi-llm

                                        echo "📋 상태 확인"
                                        docker-compose -f ai/docker-compose-prod.yml --env-file "$ENV_FILE" ps

                                        docker logout || true
                                    '''
                                }
                            }
                        }
                        stage('AI Deploy - Pharmguard') {
                            when {
                                anyOf {
                                    branch 'ai-prod'
                                    expression { return env.GIT_BRANCH?.endsWith('ai-prod') }
                                    changeRequest(target: 'ai-prod')
                                }
                            }
                            steps {
                                sh '''
                                    export PATH="/usr/local/bin:$DOCKER_PATH"
                                    echo "🐳 Docker 환경 확인 중 (Pharmguard)..."
                                    if ! which docker > /dev/null 2>&1; then
                                        echo "❌ Docker not found in PATH"
                                        exit 1
                                    fi
                                    echo "✅ Docker binary: $(which docker)"
                                    DOCKER_VERSION=$(docker --version 2>/dev/null || echo "")
                                    if [ -z "$DOCKER_VERSION" ]; then
                                        echo "❌ Docker version check failed"
                                        exit 1
                                    fi
                                    echo "✅ Docker version: $DOCKER_VERSION"
                                '''
                                dir('ai/pharmguard') {
                                    withCredentials([usernamePassword(credentialsId: 'docker_hub_credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                                        script {
                                            try {
                                                sh '''
                                                    set -e
                                                    echo "🔐 Docker Hub 로그인 (Pharmguard)"
                                                    echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                                                    echo "🔧 실행 권한 설정"
                                                    chmod +x build_and_push.sh || true
                                                    export DOCKER_PLATFORM=linux/amd64
                                                    echo "🏷️ 태그: ${BUILD_TAG} (추가 태그: latest)"
                                                    ./build_and_push.sh "${BUILD_TAG}" "$DOCKER_USER" latest
                                                    docker logout || true
                                                '''
                                                env.AI_PHARM_PUSHED = 'true'
                                            } catch (Exception e) {
                                                env.AI_PHARM_PUSHED = 'false'
                                                error("Pharmguard 이미지 푸시 실패")
                                            }
                                        }
                                    }
                                }
                                // Pharmguard 전용 컨테이너 교체 (푸시된 새 태그로)
                                withCredentials([
                                    file(credentialsId: 'AI_PROD_ENV', variable: 'ENV_FILE'),
                                    usernamePassword(credentialsId: 'docker_hub_credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')
                                ]) {
                                    sh '''
                                        set -e
                                        export PATH="/usr/local/bin:$DOCKER_PATH"
                                        echo "🔐 Docker Hub 로그인 (Pharmguard Deploy)"
                                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin

                                        export APP_TAG="${BUILD_TAG}"
                                        REPO_PHARM="$DOCKER_USER/handi-pharmguard:${APP_TAG}"

                                        echo "⏳ 레지스트리 반영 확인 (Pharmguard)"
                                        for i in {1..18}; do
                                            if docker manifest inspect "$REPO_PHARM" >/dev/null 2>&1; then
                                                echo "✅ 이미지 사용 가능: $REPO_PHARM"
                                                break
                                            fi
                                            echo "⏳ 재시도 $i/18..."
                                            sleep 5
                                            if [ "$i" -eq 18 ]; then
                                                echo "❌ 새 태그가 레지스트리에 아직 없습니다: $REPO_PHARM"
                                                exit 1
                                            fi
                                        done

                                        echo "🛑 기존 Pharmguard 컨테이너 정지/제거"
                                        docker-compose -f ai/docker-compose-prod.yml --env-file "$ENV_FILE" stop handi-pharmguard || true
                                        docker-compose -f ai/docker-compose-prod.yml --env-file "$ENV_FILE" rm -f handi-pharmguard || true

                                        echo "📥 Pharmguard 이미지 Pull (APP_TAG=${APP_TAG})"
                                        docker-compose -f ai/docker-compose-prod.yml --env-file "$ENV_FILE" pull handi-pharmguard

                                        echo "🚀 Pharmguard 컨테이너 재기동"
                                        docker-compose -f ai/docker-compose-prod.yml --env-file "$ENV_FILE" up -d --no-deps handi-pharmguard

                                        echo "📋 상태 확인"
                                        docker-compose -f ai/docker-compose-prod.yml --env-file "$ENV_FILE" ps

                                        docker logout || true
                                    '''
                                }
                            }
                        }

                        // (참고) 통합 배포 스테이지는 제거되었습니다. 서비스별로 개별 배포합니다.
                    }
                }
            }
        }
    }
}