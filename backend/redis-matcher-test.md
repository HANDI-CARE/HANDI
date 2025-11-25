# 미팅 매칭 시스템 테스트 가이드

Redis 기반 간호사-보호자 미팅 매칭 시스템 테스트를 위한 완전한 가이드입니다.

## 📋 목차
- [시스템 실행 준비](#시스템-실행-준비)
- [복합 매칭 테스트 시나리오](#복합-매칭-테스트-시나리오)
- [API 엔드포인트](#api-엔드포인트)
- [테스트 검증 포인트](#테스트-검증-포인트)
- [추가 테스트 시나리오](#추가-테스트-시나리오)

## 🚀 시스템 실행 준비

### 1. 서비스 시작
```bash
# 1. Redis 서버 시작 (Docker 사용)
docker-compose up -d

# 2. Spring Boot 애플리케이션 실행
./gradlew bootRun

# 3. 서비스 확인
curl http://localhost:8080/api/meeting/redis/health
```

### 2. Swagger UI 접속
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- 모든 API를 GUI 환경에서 테스트할 수 있습니다.

## 🧪 복합 매칭 테스트 시나리오

### 1단계: 간호사 데이터 등록 (ID: 1번, 담당 시니어: 10-15번)

```bash
curl -X 'POST' \
  'http://localhost:8080/api/meeting/redis/schedule' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 1,
  "userType": "employee",
  "seniors": [10, 11, 12, 13, 14, 15],
  "availableTime": [
    "2025-06-05T09:00:00",
    "2025-06-05T10:00:00",
    "2025-06-05T11:00:00",
    "2025-06-05T13:00:00",
    "2025-06-05T14:00:00",
    "2025-06-05T15:00:00",
    "2025-06-05T16:00:00"
  ]
}'
```

### 2단계: 시니어별 보호자 요청 등록

#### 시니어 10번 - 보호자 ID: 100 (오전 시간대 선호)
```bash
curl -X 'POST' \
  'http://localhost:8080/api/meeting/redis/schedule' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 100,
  "userType": "guardian",
  "seniors": [10],
  "availableTime": [
    "2025-06-05T09:00:00",
    "2025-06-05T10:00:00",
    "2025-06-05T11:00:00"
  ]
}'
```

#### 시니어 11번 - 보호자 ID: 101 (오후 시간대 선호)
```bash
curl -X 'POST' \
  'http://localhost:8080/api/meeting/redis/schedule' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 101,
  "userType": "guardian",
  "seniors": [11],
  "availableTime": [
    "2025-06-05T10:00:00",
    "2025-06-05T13:00:00",
    "2025-06-05T14:00:00"
  ]
}'
```

#### 시니어 12번 - 보호자 ID: 102 (시간 겹침 테스트)
```bash
curl -X 'POST' \
  'http://localhost:8080/api/meeting/redis/schedule' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 102,
  "userType": "guardian",
  "seniors": [12],
  "availableTime": [
    "2025-06-05T10:00:00",
    "2025-06-05T11:00:00",
    "2025-06-05T15:00:00"
  ]
}'
```

#### 시니어 13번 - 보호자 ID: 103 (제한적 시간)
```bash
curl -X 'POST' \
  'http://localhost:8080/api/meeting/redis/schedule' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 103,
  "userType": "guardian",
  "seniors": [13],
  "availableTime": [
    "2025-06-05T16:00:00"
  ]
}'
```

#### 시니어 14번 - 보호자 ID: 104 (다양한 시간)
```bash
curl -X 'POST' \
  'http://localhost:8080/api/meeting/redis/schedule' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 104,
  "userType": "guardian",
  "seniors": [14],
  "availableTime": [
    "2025-06-05T13:00:00",
    "2025-06-05T14:00:00",
    "2025-06-05T15:00:00",
    "2025-06-05T16:00:00"
  ]
}'
```

#### 시니어 15번 - 보호자 ID: 105 (시간 불일치 케이스)
```bash
curl -X 'POST' \
  'http://localhost:8080/api/meeting/redis/schedule' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 105,
  "userType": "guardian",
  "seniors": [15],
  "availableTime": [
    "2025-06-05T08:00:00",
    "2025-06-05T12:00:00",
    "2025-06-05T17:00:00"
  ]
}'
```

### 3단계: 매칭 실행

```bash
curl -X 'POST' \
  'http://localhost:8080/api/meeting/matching/execute?targetDate=2025-06-05' \
  -H 'accept: */*'
```

## 📚 API 엔드포인트

### Redis 데이터 관리
```http
# 스케줄 등록
POST /api/meeting/redis/schedule

# 스케줄 조회
GET /api/meeting/redis/schedule/{key}

# 시니어별 보호자 요청 조회
GET /api/meeting/redis/guardian/senior/{seniorId}

# Redis 헬스체크
GET /api/meeting/redis/health
```

### 매칭 시스템
```http
# 매칭 실행
POST /api/meeting/matching/execute?targetDate=YYYY-MM-DD

# 매칭 시스템 상태 조회
GET /api/meeting/matching/status
```

## 🔍 예상 매칭 결과 분석

### 매칭 가능한 조합
| 시니어 | 보호자 | 가능한 시간 | 매칭 상태 |
|--------|--------|-------------|-----------|
| 10 | 100 | 09:00, 10:00, 11:00 | ✅ 매칭 가능 |
| 11 | 101 | 10:00, 13:00, 14:00 | ✅ 매칭 가능 |
| 12 | 102 | 10:00, 11:00, 15:00 | ✅ 매칭 가능 |
| 13 | 103 | 16:00 | ✅ 매칭 가능 |
| 14 | 104 | 13:00, 14:00, 15:00, 16:00 | ✅ 매칭 가능 |
| 15 | 105 | - | ❌ 시간 불일치 |

### 최적 매칭 예시 (총 5개)
```json
[
  {"employeeId": 1, "guardianId": 100, "seniorId": 10, "meetingTime": "2025-06-05T09:00:00"},
  {"employeeId": 1, "guardianId": 101, "seniorId": 11, "meetingTime": "2025-06-05T13:00:00"},
  {"employeeId": 1, "guardianId": 102, "seniorId": 12, "meetingTime": "2025-06-05T11:00:00"},
  {"employeeId": 1, "guardianId": 103, "seniorId": 13, "meetingTime": "2025-06-05T16:00:00"},
  {"employeeId": 1, "guardianId": 104, "seniorId": 14, "meetingTime": "2025-06-05T14:00:00"}
]
```

## ✅ 테스트 검증 포인트

### 1. 매칭 개수 검증
- 최대 몇 개의 매칭이 이루어지는가?
- 예상: 5개 (시니어 15번 제외)

### 2. 시간 중복 검증
- 같은 시간에 여러 매칭이 있는지 확인
- 모든 매칭 시간이 유니크해야 함

### 3. 시니어 중복 검증
- 같은 시니어가 여러 번 매칭되는지 확인
- 각 시니어는 최대 1회만 매칭되어야 함

### 4. 데이터 정리 검증
```bash
# 매칭 완료 후 Redis 데이터 확인
curl http://localhost:8080/api/meeting/redis/schedule/employee:schedule:1
curl http://localhost:8080/api/meeting/redis/guardian/senior/10
```

### 5. 알고리즘 성능 측정
- 복잡한 상황에서도 합리적인 시간 내에 결과가 나오는지 확인

## 🔄 추가 테스트 시나리오

### 충돌 상황 테스트 - 시니어 16번 추가
```bash
curl -X 'POST' \
  'http://localhost:8080/api/meeting/redis/schedule' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 106,
  "userType": "guardian",
  "seniors": [16],
  "availableTime": [
    "2025-06-05T15:00:00"
  ]
}'
```

**결과 분석**: 시니어 12번과 16번이 모두 15:00을 원하므로 백트래킹 알고리즘이 어떤 선택을 하는지 확인

### 복수 간호사 테스트
```bash
# 간호사 2번 추가 (다른 시니어 담당)
curl -X 'POST' \
  'http://localhost:8080/api/meeting/redis/schedule' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 2,
  "userType": "employee",
  "seniors": [20, 21, 22],
  "availableTime": [
    "2025-06-05T09:00:00",
    "2025-06-05T14:00:00",
    "2025-06-05T16:00:00"
  ]
}'
```

### 에지 케이스 테스트

#### 1. 빈 데이터 매칭
```bash
curl -X 'POST' \
  'http://localhost:8080/api/meeting/matching/execute?targetDate=2025-06-06' \
  -H 'accept: */*'
```

#### 2. 잘못된 날짜 형식
```bash
curl -X 'POST' \
  'http://localhost:8080/api/meeting/matching/execute?targetDate=06-05-2025' \
  -H 'accept: */*'
```

#### 3. 시간 포맷 테스트
```bash
# 잘못된 시간 형식으로 데이터 등록 시도
curl -X 'POST' \
  'http://localhost:8080/api/meeting/redis/schedule' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 999,
  "userType": "employee",
  "seniors": [99],
  "availableTime": [
    "2025-06-05 09:00:00",
    "invalid-time-format"
  ]
}'
```

## 🛠 트러블슈팅

### 일반적인 문제들

#### 1. Redis 연결 실패
```bash
# Redis 컨테이너 상태 확인
docker ps | grep redis

# Redis 재시작
docker-compose restart

# Redis 연결 테스트
curl http://localhost:8080/api/meeting/redis/health
```

#### 2. 애플리케이션 포트 충돌
```bash
# 8080 포트 사용 중인 프로세스 확인
lsof -i :8080

# 포트 변경 (application.yml의 server.port 수정)
```

#### 3. JSON 파싱 오류
- Content-Type 헤더가 `application/json`인지 확인
- JSON 문법 오류가 없는지 확인
- 필수 필드가 누락되지 않았는지 확인

#### 4. 매칭 결과가 없는 경우
- 날짜 형식이 YYYY-MM-DD인지 확인
- 간호사와 보호자의 시간이 겹치는지 확인
- Redis에 데이터가 제대로 저장되었는지 확인

### 데이터 초기화
```bash
# Redis 데이터 전체 삭제 (주의: 모든 데이터 삭제됨)
docker exec -it $(docker ps -q --filter "name=redis") redis-cli FLUSHALL
```

## 📊 성능 벤치마킹

### 대량 데이터 테스트
```bash
# 100명의 간호사와 1000명의 보호자 데이터 생성 스크립트 실행
# (별도 스크립트 필요)

# 성능 측정
time curl -X 'POST' \
  'http://localhost:8080/api/meeting/matching/execute?targetDate=2025-06-05' \
  -H 'accept: */*'
```

### 메모리 사용량 모니터링
```bash
# Redis 메모리 사용량 확인
docker exec -it $(docker ps -q --filter "name=redis") redis-cli INFO memory

# Java 힙 메모리 사용량 확인 (JVM 옵션 추가 필요)
jstat -gc <java_process_id>
```

이 테스트 가이드를 통해 미팅 매칭 시스템의 모든 기능을 체계적으로 검증할 수 있습니다.