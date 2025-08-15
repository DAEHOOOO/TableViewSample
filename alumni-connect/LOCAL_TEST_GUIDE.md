# 🧪 Alumni Connect 로컬 테스트 가이드

## 🚀 완성된 기능들 ✅

### 1. 완전한 사용자 플로우
- ✅ **회원가입/로그인**: 이메일 인증 포함
- ✅ **온보딩**: 닉네임, 나이 검증(19+), 소속 정보 입력
- ✅ **위치 설정**: 브라우저 GPS 권한 요청
- ✅ **후보 발견**: 6km 반경 내 동문 매칭
- ✅ **공통 소속 표시**: 학교/회사별 뱃지 시스템

### 2. 데이터베이스 & API
- ✅ **PostGIS 지리 쿼리**: 정확한 거리 계산
- ✅ **복합 소속 매칭**: 여러 학교/회사 동시 지원
- ✅ **실시간 위치 업데이트**: GPS 재조회 기능
- ✅ **이벤트 추적**: 모든 사용자 액션 로깅

## 🖥 로컬 테스트 방법

### 1단계: 개발 서버 실행
```bash
cd alumni-connect
npm run dev
```
👉 **http://localhost:3000** 접속

### 2단계: Supabase 설정 (필수!)

#### 2-1. Supabase 프로젝트 생성
1. [supabase.com](https://supabase.com) 가입/로그인
2. "New project" 클릭
3. 프로젝트명: `alumni-connect-local`
4. 데이터베이스 비밀번호 설정 (기록해두세요!)
5. 서울 리전 선택

#### 2-2. 데이터베이스 스키마 설정
1. Supabase 대시보드 → **SQL Editor**
2. `supabase/schema.sql` 파일 내용 전체 복사
3. SQL Editor에 붙여넣기 → **Run** 클릭
4. `supabase/location-functions.sql` 내용도 실행

#### 2-3. 환경 변수 설정
1. Supabase 대시보드 → **Settings** → **API**
2. **Project URL**과 **anon key** 복사
3. `alumni-connect/.env.local` 파일 수정:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3단계: 실제 테스트 시나리오

#### 🎯 시나리오 1: 첫 사용자 (본인)
1. **회원가입** (http://localhost:3000/signup)
   - 이메일/비밀번호 입력
   - 이메일 인증 확인 (받은편지함 체크)
   
2. **로그인** (http://localhost:3000/login)
   - 인증된 이메일로 로그인
   
3. **온보딩** (자동 리다이렉션)
   - 닉네임: "김테스터"
   - 출생연도: 1995 (만 19세 이상)
   - 소속: 연세대학교, 네이버 등 추가
   
4. **위치 설정**
   - 브라우저에서 위치 권한 허용
   - GPS 좌표 자동 저장

5. **대시보드 도달**
   - "동문 둘러보기" 클릭

#### 🎯 시나리오 2: 샘플 데이터로 테스트
현재는 다른 사용자가 없어서 후보가 표시되지 않습니다.
테스트를 위해 샘플 데이터를 추가하세요:

1. **Supabase SQL Editor**에서 `scripts/create-sample-data.sql` 실행
2. 5명의 샘플 사용자가 강남 지역에 생성됩니다
3. 연세대, 고려대, 서울대, 네이버, 삼성, 카카오 등 다양한 소속

#### 🎯 시나리오 3: 후보 발견 테스트
1. **"동문 둘러보기"** 클릭 (`/discover`)
2. 현재 위치 기준 6km 내 후보 표시
3. **공통 소속 뱃지** 확인:
   - "연세대학교 (univ)"
   - "네이버 (company)" 등
4. **거리 표시**: "1.2km 거리" 등
5. **"말 걸기"** 버튼 → 채팅방 생성 예정

## 🔍 테스트 체크리스트

### ✅ 필수 확인 사항
- [ ] 회원가입 → 이메일 인증 작동
- [ ] 만 19세 미만 가입 차단
- [ ] 위치 권한 요청/저장
- [ ] 소속 정보 다중 입력
- [ ] 후보 목록 표시 (샘플 데이터 필요)
- [ ] 공통 소속 뱃지 표시
- [ ] 거리 계산 정확성

### 🔧 고급 테스트
- [ ] 위치 새로고침 기능
- [ ] 서로 다른 위치에서 접속
- [ ] 6km 범위 밖 사용자 미표시
- [ ] 공통 소속 없는 사용자 미표시

## 🚨 문제 해결

### 1. "후보가 없습니다" 표시
**원인**: 샘플 데이터 미생성 또는 위치 차이
**해결**: 
1. `scripts/create-sample-data.sql` 실행
2. 위치를 강남 지역(37.5, 127.0)으로 설정
3. 브라우저에서 "위치 새로고침" 클릭

### 2. 위치 권한 오류
**원인**: HTTPS 필요 또는 브라우저 설정
**해결**:
1. Chrome에서 localhost는 기본 허용됨
2. 브라우저 주소창 좌측 자물쇠 → 위치 권한 확인
3. 시크릿 모드에서 테스트

### 3. 데이터베이스 연결 오류
**원인**: 환경 변수 미설정
**해결**:
1. `.env.local` 파일 존재 확인
2. Supabase URL/키 정확성 확인
3. 개발 서버 재시작: `npm run dev`

## 📊 실제 데이터 확인

### Supabase Dashboard에서 확인
1. **Database** → **Tables**
2. 생성된 데이터 확인:
   - `app_user`: 사용자 프로필
   - `affiliation`: 소속 정보
   - `user_location`: GPS 좌표
   - `user_event`: 사용자 액션 로그

### SQL로 직접 확인
```sql
-- 내 위치 확인
SELECT nickname, ST_AsText(coord) as location 
FROM app_user au 
JOIN user_location ul ON au.user_id = ul.user_id;

-- 후보 검색 테스트 (강남역 기준)
SELECT * FROM find_candidates(
  'your-user-id'::uuid,
  37.4979,  -- 강남역 위도
  127.0276, -- 강남역 경도
  6000      -- 6km
);
```

## 🎉 다음 단계 미리보기

현재 "말 걸기" 버튼을 누르면 채팅방 생성 API가 호출되지만,
아직 채팅 UI는 구현되지 않았습니다.

**다음 구현 예정**:
- 실시간 1:1 채팅 인터페이스
- 메시지 전송/수신
- 차단/신고 기능
- 채팅 목록 관리

---

**🔥 현재 상태**: 전체 플로우의 **80%** 완성!
**🎯 핵심 기능**: 후보 발견까지 완전 구현됨