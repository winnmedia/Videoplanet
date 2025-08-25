-- PostgreSQL 초기 설정 및 최적화
-- VideoPlayer 프로젝트용 데이터베이스 초기화

-- 확장 기능 설치
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID 생성
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- 텍스트 검색 최적화
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- 복합 인덱스 최적화
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- 쿼리 모니터링

-- 기본 스키마 생성
CREATE SCHEMA IF NOT EXISTS videoplanet;

-- 데이터베이스 최적화 설정
ALTER DATABASE videoplanet_db SET search_path TO videoplanet, public;
ALTER DATABASE videoplanet_db SET timezone TO 'Asia/Seoul';

-- 연결 풀링 최적화 설정
ALTER DATABASE videoplanet_db SET max_connections = 200;
ALTER DATABASE videoplanet_db SET shared_buffers = '256MB';
ALTER DATABASE videoplanet_db SET effective_cache_size = '1GB';
ALTER DATABASE videoplanet_db SET maintenance_work_mem = '64MB';
ALTER DATABASE videoplanet_db SET checkpoint_completion_target = 0.9;
ALTER DATABASE videoplanet_db SET wal_buffers = '16MB';
ALTER DATABASE videoplanet_db SET default_statistics_target = 100;
ALTER DATABASE videoplanet_db SET random_page_cost = 1.1;
ALTER DATABASE videoplanet_db SET effective_io_concurrency = 200;
ALTER DATABASE videoplanet_db SET work_mem = '4MB';
ALTER DATABASE videoplanet_db SET min_wal_size = '1GB';
ALTER DATABASE videoplanet_db SET max_wal_size = '4GB';

-- 쿼리 성능 최적화
ALTER DATABASE videoplanet_db SET enable_partitionwise_join = on;
ALTER DATABASE videoplanet_db SET enable_partitionwise_aggregate = on;
ALTER DATABASE videoplanet_db SET jit = on;

-- 로깅 설정
ALTER DATABASE videoplanet_db SET log_statement = 'all';
ALTER DATABASE videoplanet_db SET log_duration = on;
ALTER DATABASE videoplanet_db SET log_min_duration_statement = 100; -- 100ms 이상 쿼리 로깅

-- 사용자 권한 설정
GRANT ALL PRIVILEGES ON SCHEMA videoplanet TO videoplanet_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA videoplanet TO videoplanet_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA videoplanet TO videoplanet_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA videoplanet TO videoplanet_user;

-- 기본 권한 설정
ALTER DEFAULT PRIVILEGES IN SCHEMA videoplanet
    GRANT ALL ON TABLES TO videoplanet_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA videoplanet
    GRANT ALL ON SEQUENCES TO videoplanet_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA videoplanet
    GRANT ALL ON FUNCTIONS TO videoplanet_user;

-- 테이블스페이스 생성 (옵션)
-- CREATE TABLESPACE fast_tablespace LOCATION '/var/lib/postgresql/fast_data';
-- CREATE TABLESPACE archive_tablespace LOCATION '/var/lib/postgresql/archive_data';

COMMENT ON DATABASE videoplanet_db IS 'VideoPlayer 프로젝트 메인 데이터베이스';
COMMENT ON SCHEMA videoplanet IS 'VideoPlayer 애플리케이션 스키마';