-- 테스트용 샘플 데이터 생성 스크립트
-- 주의: 실제 사용자가 생성된 후에 실행해야 합니다

-- 샘플 사용자들 (실제 auth 사용자 ID는 다를 수 있음)
-- 서울 강남 지역 좌표 기준 (37.5172, 127.0473)

-- 샘플 사용자 1
INSERT INTO app_user (user_id, nickname, birth_year) VALUES 
('sample-user-1', '김동문', 1995),
('sample-user-2', '이선배', 1992),
('sample-user-3', '박후배', 1998),
('sample-user-4', '최동기', 1994),
('sample-user-5', '정동창', 1996);

-- 샘플 소속 정보
INSERT INTO affiliation (user_id, type, name, start_year, end_year, major, department) VALUES
-- 김동문 (연세대학교)
('sample-user-1', 'univ', '연세대학교', 2014, 2018, '컴퓨터과학과', '공과대학'),
('sample-user-1', 'company', '네이버', 2018, NULL, NULL, '개발팀'),

-- 이선배 (연세대학교 + 삼성)
('sample-user-2', 'univ', '연세대학교', 2011, 2015, '경영학과', '경영대학'),
('sample-user-2', 'company', '삼성전자', 2015, NULL, NULL, '기획팀'),

-- 박후배 (고려대학교)
('sample-user-3', 'univ', '고려대학교', 2017, 2021, '경영학과', '경영대학'),
('sample-user-3', 'company', '카카오', 2021, NULL, NULL, '개발팀'),

-- 최동기 (연세대학교 + 네이버)
('sample-user-4', 'univ', '연세대학교', 2013, 2017, '전자공학과', '공과대학'),
('sample-user-4', 'company', '네이버', 2017, NULL, NULL, 'AI팀'),

-- 정동창 (서울대학교)
('sample-user-5', 'univ', '서울대학교', 2015, 2019, '컴퓨터공학과', '공과대학'),
('sample-user-5', 'company', '네이버', 2019, NULL, NULL, '플랫폼팀');

-- 샘플 위치 정보 (강남 지역 근처, 6km 반경 내)
INSERT INTO user_location (user_id, coord) VALUES
-- 강남역 근처
('sample-user-1', ST_GeomFromText('POINT(127.0276 37.4979)', 4326)),
-- 선릉역 근처  
('sample-user-2', ST_GeomFromText('POINT(127.0495 37.5044)', 4326)),
-- 역삼역 근처
('sample-user-3', ST_GeomFromText('POINT(127.0369 37.5007)', 4326)),
-- 삼성역 근처
('sample-user-4', ST_GeomFromText('POINT(127.0634 37.5087)', 4326)),
-- 잠실역 근처 (조금 더 멀리)
('sample-user-5', ST_GeomFromText('POINT(127.1000 37.5133)', 4326));

-- 설명을 위한 주석
-- 실제 사용자가 강남역(127.0276, 37.4979) 주변에 있다면
-- 모든 샘플 사용자들이 6km 반경 내에 있도록 설정했습니다.

-- 거리 확인 쿼리 (테스트용)
-- SELECT 
--   nickname,
--   ST_Distance(
--     ST_GeomFromText('POINT(127.0276 37.4979)', 4326)::geography,
--     coord
--   ) as distance_meters
-- FROM user_location ul
-- JOIN app_user au ON au.user_id = ul.user_id
-- WHERE ul.user_id LIKE 'sample-%'
-- ORDER BY distance_meters;