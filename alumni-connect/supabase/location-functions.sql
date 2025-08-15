-- 위치 업데이트를 위한 헬퍼 함수
create or replace function update_user_location(
  user_id uuid,
  lat double precision,
  lng double precision
)
returns void
language sql
security definer
as $$
  insert into user_location (user_id, coord, updated_at)
  values (user_id, st_setsrid(st_makepoint(lng, lat), 4326)::geography, now())
  on conflict (user_id)
  do update set 
    coord = st_setsrid(st_makepoint(lng, lat), 4326)::geography,
    updated_at = now();
$$;

-- 위치 정보를 좌표로 변환하는 함수
create or replace function get_user_coordinates(user_id uuid)
returns table(latitude double precision, longitude double precision)
language sql
security definer
as $$
  select 
    st_y(coord::geometry) as latitude,
    st_x(coord::geometry) as longitude
  from user_location
  where user_location.user_id = get_user_coordinates.user_id;
$$;