-- TRUNCATE all tables in reverse foreign key order to ensure a clean slate
-- This ensures that IDENTITY sequences are reset and foreign key constraints are handled correctly.
TRUNCATE TABLE public.observation_records RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.medications RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.medication_schedules RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.document_library RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.meeting_matches RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.senior_user_relations RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.vital_signs RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.users RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.seniors RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.oauth_users RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.organizations RESTART IDENTITY CASCADE;

ALTER TABLE public.organizations
    ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN is_deleted SET DEFAULT FALSE;

ALTER TABLE public.oauth_users
    ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN is_deleted SET DEFAULT FALSE;

ALTER TABLE public.users
    ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN is_deleted SET DEFAULT FALSE;

ALTER TABLE public.seniors
    ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN is_deleted SET DEFAULT FALSE;

ALTER TABLE public.vital_signs
    ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN is_deleted SET DEFAULT FALSE;


ALTER TABLE public.senior_user_relations
    ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN is_deleted SET DEFAULT FALSE;


ALTER TABLE public.observation_records
    ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN is_deleted SET DEFAULT FALSE;

ALTER TABLE public.meeting_matches
    ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN is_deleted SET DEFAULT FALSE,
    ALTER COLUMN status SET DEFAULT 'PENDING';

ALTER TABLE public.document_library
    ALTER COLUMN is_deleted SET DEFAULT FALSE;

ALTER TABLE public.medication_schedules
    ALTER COLUMN is_deleted SET DEFAULT FALSE;

ALTER TABLE public.medications
    ALTER COLUMN is_deleted SET DEFAULT FALSE;

INSERT INTO public.organizations (name, breakfast_time, lunch_time, dinner_time, sleep_time)
VALUES
    ('행복 요양원', '08:00:00', '12:30:00', '18:00:00', '22:00:00'),
    ('사랑 요양원', '07:30:00', '12:00:00', '17:30:00', '21:30:00'),
    ('건강 요양원', '08:30:00', '13:00:00', '18:30:00', '22:30:00'),
    ('평화 요양원', '07:45:00', '12:15:00', '17:45:00', '21:45:00'),
    ('희망 요양원', '08:15:00', '12:45:00', '18:15:00', '22:15:00'),
    ('미래 요양원', '07:00:00', '11:30:00', '17:00:00', '21:00:00'),
    ('새싹 요양원', '08:00:00', '12:00:00', '18:00:00', '22:00:00'),
    ('햇살 요양원', '07:40:00', '12:10:00', '17:40:00', '21:40:00'),
    ('늘푸른 요양원', '08:20:00', '12:50:00', '18:20:00', '22:20:00'),
    ('행복나눔 요양원', '07:50:00', '12:20:00', '17:50:00', '21:50:00');

INSERT INTO public.oauth_users (profile_image_url, email, name, phone_number, provider_user_id,
                                social_provider)
VALUES (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'admin@test.com', '김철수', '01012345678', 'google_id_00001', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user2@test.com', '이영희', '01098765432', 'kakao_id_00002', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user3@test.com', '박민수', '01011112222', 'naver_id_00003', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user4@test.com', '최유진', '01033334444', 'google_id_00004', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user5@test.com', '정대현', '01055556666', 'kakao_id_00005', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user6@test.com', '홍길동', '01077778888', 'google_id_00006', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user7@test.com', '이지은', '01022223333', 'naver_id_00007', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user8@test.com', '강민준', '01044445555', 'google_id_00008', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user9@test.com', '윤서연', '01066667777', 'kakao_id_00009', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user10@test.com', '신동우', '01088889999', 'naver_id_00010', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user11@test.com', '임수빈', '01010102020', 'google_id_00011', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user12@test.com', '장지훈', '01030304040', 'kakao_id_00012', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user13@test.com', '김민지', '01012123434', 'google_id_00013', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user14@test.com', '박준영', '01056567878', 'kakao_id_00014', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user15@test.com', '이서현', '01090901212', 'naver_id_00015', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user16@test.com', '정우성', '01034345656', 'google_id_00016', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user17@test.com', '최예원', '01078789090', 'kakao_id_00017', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user18@test.com', '한지민', '01011223344', 'google_id_00018', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user19@test.com', '고은별', '01055667788', 'naver_id_00019', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user20@test.com', '윤지후', '01099001122', 'kakao_id_00020', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user21@test.com', '서지우', '01033445566', 'google_id_00021', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user22@test.com', '이태양', '01077889900', 'naver_id_00022', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user23@test.com', '김하늘', '01011335577', 'kakao_id_00023', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user24@test.com', '박다정', '01022446688', 'google_id_00024', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user25@test.com', '최성민', '01033557799', 'naver_id_00025', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user26@test.com', '정수아', '01044668800', 'kakao_id_00026', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user27@test.com', '강동현', '01055779911', 'google_id_00027', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user28@test.com', '윤소희', '01066880022', 'naver_id_00028', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user29@test.com', '신지훈', '01077991133', 'kakao_id_00029', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user30@test.com', '임은정', '01088002244', 'google_id_00030', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user31@test.com', '장민서', '01099113355', 'naver_id_00031', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user32@test.com', '홍성민', '01000224466', 'kakao_id_00032', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user33@test.com', '김영진', '01011335577', 'google_id_00033', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user34@test.com', '박지수', '01022446688', 'naver_id_00034', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user35@test.com', '이현우', '01033557799', 'kakao_id_00035', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user36@test.com', '정유미', '01044668800', 'google_id_00036', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user37@test.com', '최민준', '01055779911', 'naver_id_00037', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user38@test.com', '한수아', '01066880022', 'kakao_id_00038', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user39@test.com', '고준호', '01077991133', 'google_id_00039', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user40@test.com', '윤채원', '01088002244', 'naver_id_00040', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user41@test.com', '서민준', '01099113355', 'kakao_id_00041', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user42@test.com', '이하은', '01000224466', 'google_id_00042', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user43@test.com', '김도윤', '01011335577', 'naver_id_00043', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user44@test.com', '박소윤', '01022446688', 'kakao_id_00044', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user45@test.com', '최지훈', '01033557799', 'google_id_00045', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user46@test.com', '정서현', '01044668800', 'naver_id_00046', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user47@test.com', '강예진', '01055779911', 'kakao_id_00047', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user48@test.com', '윤준서', '01066880022', 'google_id_00048', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user49@test.com', '신유진', '01077991133', 'naver_id_00049', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user50@test.com', '임재현', '01088002244', 'kakao_id_00050', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user51@test.com', '장하영', '01099113355', 'google_id_00051', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user52@test.com', '홍지우', '01000224466', 'naver_id_00052', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user53@test.com', '김서준', '01011335577', 'kakao_id_00053', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user54@test.com', '박채은', '01022446688', 'google_id_00054', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user55@test.com', '이민혁', '01033557799', 'naver_id_00055', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user56@test.com', '정소민', '01044668800', 'kakao_id_00056', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user57@test.com', '최은우', '01055779911', 'google_id_00057', 'GOOGLE'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user58@test.com', '한재윤', '01066880022', 'naver_id_00058', 'NAVER'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user59@test.com', '고아라', '01077991133', 'kakao_id_00059', 'KAKAO'),

       (
           'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
           'user60@test.com', '윤도현', '01088002244', 'google_id_00060', 'GOOGLE');

INSERT INTO public.users (oauth_user_id, organization_id,
                          address, email, name, phone_number, role, profile_image_url)
VALUES ( 1, 1, '서울시 강남구', 'admin@test.com', '김철수', '01012345678', 'ADMIN',
         'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (2, 1, '서울시 서초구', 'user2@test.com', '이영희', '01098765432', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (3, 2, '경기도 성남시', 'user3@test.com', '박민수', '01011112222', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (4, 1, '서울시 송파구', 'user4@test.com', '최유진', '01033334444', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (5, 3, '인천시 연수구', 'user5@test.com', '정대현', '01055556666', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (6, 2, '부산시 해운대구', 'user6@test.com', '홍길동', '01077778888', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (7, 1, '서울시 강서구', 'user7@test.com', '이지은', '01022223333', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (8, 4, '대구시 수성구', 'user8@test.com', '강민준', '01044445555', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (9, 5, '광주시 북구', 'user9@test.com', '윤서연', '01066667777', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (10, 1, '대전시 유성구', 'user10@test.com', '신동우', '01088889999', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (11, 2, '울산시 남구', 'user11@test.com', '임수빈', '01010102020', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (12, 3, '세종시', 'user12@test.com', '장지훈', '01030304040', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (13, 4, '서울시 종로구', 'user13@test.com', '김민지', '01012123434', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (14, 5, '서울시 마포구', 'user14@test.com', '박준영', '01056567878', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (15, 1, '서울시 영등포구', 'user15@test.com', '이서현', '01090901212', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (16, 2, '서울시 강동구', 'user16@test.com', '정우성', '01034345656', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (17, 3, '서울시 서대문구', 'user17@test.com', '최예원', '01078789090', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (18, 4, '서울시 동대문구', 'user18@test.com', '한지민', '01011223344', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (19, 5, '서울시 성북구', 'user19@test.com', '고은별', '01055667788', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (20, 1, '서울시 중랑구', 'user20@test.com', '윤지후', '01099001122', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (21, 2, '서울시 도봉구', 'user21@test.com', '서지우', '01033445566', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (22, 3, '서울시 노원구', 'user22@test.com', '이태양', '01077889900', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (23, 4, '서울시 은평구', 'user23@test.com', '김하늘', '01011335577', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (24, 5, '서울시 서초구', 'user24@test.com', '박다정', '01022446688', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (25, 1, '서울시 강남구', 'user25@test.com', '최성민', '01033557799', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (26, 2, '서울시 송파구', 'user26@test.com', '정수아', '01044668800', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (27, 3, '서울시 강서구', 'user27@test.com', '강동현', '01055779911', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (28, 4, '서울시 관악구', 'user28@test.com', '윤소희', '01066880022', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (29, 5, '서울시 동작구', 'user29@test.com', '신지훈', '01077991133', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (30, 1, '서울시 구로구', 'user30@test.com', '임은정', '01088002244', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (31, 2, '서울시 금천구', 'user31@test.com', '장민서', '01099113355', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (32, 3, '서울시 양천구', 'user32@test.com', '홍성민', '01000224466', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (33, 4, '서울시 강서구', 'user33@test.com', '김영진', '01011335577', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (34, 5, '서울시 마포구', 'user34@test.com', '박지수', '01022446688', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (35, 1, '서울시 용산구', 'user35@test.com', '이현우', '01033557799', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (36, 2, '서울시 성동구', 'user36@test.com', '정유미', '01044668800', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (37, 3, '서울시 광진구', 'user37@test.com', '최민준', '01055779911', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (38, 4, '서울시 동대문구', 'user38@test.com', '한수아', '01066880022', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (39, 5, '서울시 중랑구', 'user39@test.com', '고준호', '01077991133', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (40, 1, '서울시 성북구', 'user40@test.com', '윤채원', '01088002244', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (41, 2, '서울시 강북구', 'user41@test.com', '서민준', '01099113355', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (42, 3, '서울시 도봉구', 'user42@test.com', '이하은', '01000224466', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (43, 4, '서울시 노원구', 'user43@test.com', '김도윤', '01011335577', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (44, 5, '서울시 은평구', 'user44@test.com', '박소윤', '01022446688', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (45, 1, '서울시 서대문구', 'user45@test.com', '최지훈', '01033557799', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (46, 2, '서울시 종로구', 'user46@test.com', '정서현', '01044668800', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (47, 3, '서울시 중구', 'user47@test.com', '강예진', '01055779911', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (48, 4, '서울시 강남구', 'user48@test.com', '윤준서', '01066880022', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (49, 5, '서울시 서초구', 'user49@test.com', '신유진', '01077991133', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (50, 1, '서울시 송파구', 'user50@test.com', '임재현', '01088002244', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (51, 2, '서울시 강서구', 'user51@test.com', '장하영', '01099113355', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (52, 3, '서울시 관악구', 'user52@test.com', '홍지우', '01000224466', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (53, 4, '서울시 동작구', 'user53@test.com', '김서준', '01011335577', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (54, 5, '서울시 구로구', 'user54@test.com', '박채은', '01022446688', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (55, 1, '서울시 금천구', 'user55@test.com', '이민혁', '01033557799', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (56, 2, '서울시 양천구', 'user56@test.com', '정소민', '01044668800', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (57, 3, '서울시 강서구', 'user57@test.com', '최은우', '01055779911', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (58, 4, '서울시 마포구', 'user58@test.com', '한재윤', '01066880022', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (59, 5, '서울시 용산구', 'user59@test.com', '고아라', '01077991133', 'EMPLOYEE',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (60, 1, '서울시 성동구', 'user60@test.com', '윤도현', '01088002244', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (NULL, 4, '제주도 제주시', 'guardian_null_oauth1@test.com', '김미영', '01050506060', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (NULL, 5, '강원도 춘천시', 'guardian_null_oauth2@test.com', '이준호',
        '01070708080', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (NULL, 1, '충청북도 청주시', 'guardian_null_oauth3@test.com', '박선영', '01012341234', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (NULL, 2, '경상남도 창원시', 'guardian_null_oauth4@test.com', '최민정',
        '01056785678', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

       (NULL, 3, '전라북도 전주시', 'guardian_null_oauth5@test.com', '한지훈', '01090129012', 'GUARDIAN',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');

-- Removed sync UPDATE: users INSERT emails now match oauth_users directly

INSERT INTO public.seniors (name, birth_date, gender, is_active, organization_id, admission_date, discharge_date, note)
VALUES ('김갑돌', '1940-05-20', 'MALE', TRUE, 1, '2022-01-01', NULL, '규칙적인 산책을 즐기심'),
       ('박을순', '1945-11-10', 'FEMALE', TRUE, 1, '2022-03-15', NULL, '손주 방문 시 매우 기뻐하심'),
       ('이병철', '1938-01-01', 'MALE', TRUE, 2, '2022-05-01', NULL, NULL),
       ('최정숙', '1950-07-25', 'FEMALE', TRUE, 1, '2022-08-01', NULL, '독서 활동에 적극 참여'),
       ('정영호', '1942-03-12', 'MALE', FALSE, 3, '2022-10-01', '2023-06-30', NULL),
       ('김영숙', '1935-02-14', 'FEMALE', TRUE, 2, '2022-11-01', NULL, '원예 활동에 관심 많음'),
       ('박찬호', '1948-09-03', 'MALE', TRUE, 3, '2023-01-05', NULL, NULL),
       ('이지혜', '1952-04-22', 'FEMALE', TRUE, 4, '2023-02-10', NULL, '음악 감상을 즐겨 하심'),
       ('최준영', '1941-06-08', 'MALE', TRUE, 1, '2023-03-20', NULL, NULL),
       ('한미정', '1947-12-01', 'FEMALE', TRUE, 5, '2023-04-01', NULL, '미술 치료 프로그램 선호'),
       ('송지훈', '1939-07-17', 'MALE', TRUE, 1, '2023-05-10', NULL, NULL),
       ('임은혜', '1955-01-05', 'FEMALE', TRUE, 2, '2023-06-01', NULL, '요리 프로그램 참여 희망'),
       ('강동원', '1943-03-28', 'MALE', TRUE, 3, '2023-07-01', NULL, NULL),
       ('윤아영', '1958-10-10', 'FEMALE', TRUE, 4, '2023-07-15', NULL, '주간 보호 센터 적응 중'),
       ('서진우', '1946-04-04', 'MALE', TRUE, 5, '2023-07-20', NULL, NULL),
       ('문소리', '1937-08-22', 'FEMALE', TRUE, 1, '2023-08-01', NULL, '인지 활동 프로그램 선호'),
       ('오정우', '1949-01-09', 'MALE', TRUE, 2, '2023-08-05', NULL, NULL),
       ('이선영', '1951-03-18', 'FEMALE', TRUE, 3, '2023-08-10', NULL, '가족 면회 시 활기참'),
       ('박동민', '1944-06-05', 'MALE', TRUE, 4, '2023-08-15', NULL, NULL),
       ('정미경', '1953-09-29', 'FEMALE', TRUE, 5, '2023-08-20', NULL, '산책 시 보호자 동반 필요'),
       ('김영철', '1936-04-11', 'MALE', TRUE, 1, '2023-08-25', NULL, NULL),
       ('이수진', '1946-07-07', 'FEMALE', TRUE, 2, '2023-09-01', NULL, '규칙적인 약 복용 지도 필요'),
       ('박성호', '1939-10-23', 'MALE', TRUE, 3, '2023-09-05', NULL, NULL),
       ('최은경', '1954-12-15', 'FEMALE', TRUE, 4, '2023-09-10', NULL, '식사 시 편식 경향 있음'),
       ('한정수', '1940-02-02', 'MALE', TRUE, 5, '2023-09-15', NULL, NULL),
       ('송민아', '1956-05-30', 'FEMALE', TRUE, 1, '2023-09-20', NULL, '수면 패턴 불규칙'),
       ('임재범', '1941-08-19', 'MALE', TRUE, 2, '2023-09-25', NULL, NULL),
       ('강혜진', '1957-11-27', 'FEMALE', TRUE, 3, '2023-10-01', NULL, '활동량이 많아 주의 필요'),
       ('윤상현', '1942-01-01', 'MALE', TRUE, 4, '2023-10-05', NULL, NULL),
       ('서영희', '1958-04-14', 'FEMALE', TRUE, 5, '2023-10-10', NULL, '새로운 환경에 민감함'),
       ('김성수', '1943-07-03', 'MALE', TRUE, 1, '2023-10-15', NULL, NULL),
       ('박지영', '1959-10-21', 'FEMALE', TRUE, 2, '2023-10-20', NULL, '대화 시 집중력 저하'),
       ('이동욱', '1944-12-08', 'MALE', TRUE, 3, '2023-10-25', NULL, NULL),
       ('최수정', '1960-03-01', 'FEMALE', TRUE, 4, '2023-11-01', NULL, '인지 능력 향상 프로그램 필요'),
       ('한승우', '1945-06-16', 'MALE', TRUE, 5, '2023-11-05', NULL, NULL),
       ('송은진', '1961-09-04', 'FEMALE', TRUE, 1, '2023-11-10', NULL, '식사 시 도움 필요'),
       ('임동현', '1946-11-12', 'MALE', TRUE, 2, '2023-11-15', NULL, NULL),
       ('강민아', '1962-02-28', 'FEMALE', TRUE, 3, '2023-11-20', NULL, '활동 보조 기구 사용 중'),
       ('윤지훈', '1947-05-07', 'MALE', TRUE, 4, '2023-11-25', NULL, NULL),
       ('서혜원', '1963-08-01', 'FEMALE', TRUE, 5, '2023-11-30', NULL, '낙상 위험 있어 주의 필요'),
       ('김태형', '1948-10-10', 'MALE', TRUE, 1, '2023-12-01', NULL, NULL),
       ('박나래', '1964-01-19', 'FEMALE', TRUE, 2, '2023-12-05', NULL, '배변 활동에 어려움 있음'),
       ('이준영', '1949-04-26', 'MALE', TRUE, 3, '2023-12-10', NULL, NULL),
       ('최유리', '1965-07-03', 'FEMALE', TRUE, 4, '2023-12-15', NULL, '언어 치료 필요'),
       ('한재석', '1950-09-11', 'MALE', TRUE, 5, '2023-12-20', NULL, NULL),
       ('송하윤', '1966-12-05', 'FEMALE', TRUE, 1, '2023-12-25', NULL, '정서적 지지 필요'),
       ('임성민', '1951-03-14', 'MALE', TRUE, 2, '2024-01-01', NULL, NULL),
       ('강수정', '1967-06-22', 'FEMALE', TRUE, 3, '2024-01-05', NULL, '사회성 증진 프로그램 추천'),
       ('윤정우', '1952-09-09', 'MALE', TRUE, 4, '2024-01-10', NULL, NULL),
       ('서지혜', '1968-12-18', 'FEMALE', TRUE, 5, '2024-01-15', NULL, '가족과의 유대감 형성 중요'),
       ('김준호', '1953-02-01', 'MALE', TRUE, 1, '2024-01-20', NULL, NULL),
       ('박예진', '1969-05-10', 'FEMALE', TRUE, 2, '2024-01-25', NULL, '인지 저하로 인한 반복 행동'),
       ('이도현', '1954-08-17', 'MALE', TRUE, 3, '2024-01-30', NULL, NULL),
       ('최윤서', '1970-11-26', 'FEMALE', TRUE, 4, '2024-02-01', NULL, '식사 거부 증상 관찰'),
       ('한승현', '1955-01-05', 'MALE', TRUE, 5, '2024-02-05', NULL, NULL),
       ('송지효', '1971-04-03', 'FEMALE', TRUE, 1, '2024-02-10', NULL, '배회 증상 있어 보호 필요'),
       ('임창정', '1956-07-12', 'MALE', TRUE, 2, '2024-02-15', NULL, NULL),
       ('강하늘', '1972-10-20', 'FEMALE', TRUE, 3, '2024-02-20', NULL, '수면제 복용 후에도 불면증 지속'),
       ('윤계상', '1957-12-28', 'MALE', TRUE, 4, '2024-02-25', NULL, NULL),
       ('서강준', '1973-03-05', 'MALE', TRUE, 5, '2024-03-01', NULL, '공격적인 행동 관찰'),
       ('김점례', '1940-01-01', 'MALE', TRUE, 1, '2024-03-05', NULL, NULL),
       ('새로운 어르신 2', '1945-02-02', 'FEMALE', TRUE, 2, '2024-03-10', NULL, '휠체어 사용 필요'),
       ('김영감', '1950-03-03', 'MALE', TRUE, 3, '2024-03-15', NULL, NULL),
       ('이순자', '1955-04-04', 'FEMALE', TRUE, 4, '2024-03-20', NULL, '청각 보조 기구 사용 중'),
       ('박만복', '1960-05-05', 'MALE', TRUE, 5, '2024-03-25', NULL, NULL);

INSERT INTO public.vital_signs (senior_id, measured_date, systolic, diastolic, temperature, blood_glucose, height,
                                weight)
VALUES (1, '2023-07-20', 120, 80, 36.5, 95, 165.0, 60.5),
       (1, '2023-07-21', 122, 81, 36.4, 98, 165.0, 60.3),
       (1, '2023-07-22', 121, 79, 36.6, 96, 165.0, 60.4),
       (2, '2023-07-20', 130, 85, 36.8, 110, 155.2, 55.0),
       (2, '2023-07-21', 128, 83, 36.9, 105, 155.2, 55.1),
       (2, '2023-07-22', 129, 84, 36.7, 108, 155.2, 55.2),
       (3, '2023-07-20', 125, 78, 36.7, 100, 170.0, 70.2),
       (3, '2023-07-22', 124, 77, 36.8, 99, 170.0, 70.0),
       (4, '2023-07-20', 118, 75, 36.6, 90, 160.1, 58.7),
       (4, '2023-07-22', 117, 76, 36.5, 91, 160.1, 58.8),
       (5, '2023-07-20', 135, 90, 37.0, 120, 175.5, 75.0),
       (6, '2023-07-20', 128, 82, 36.7, 102, 158.0, 57.5),
       (7, '2023-07-20', 123, 79, 36.6, 97, 168.0, 68.0),
       (8, '2023-07-20', 115, 72, 36.5, 88, 162.5, 59.0),
       (9, '2023-07-20', 127, 84, 36.8, 108, 172.0, 72.0),
       (10, '2023-07-20', 121, 76, 36.7, 93, 157.0, 56.5),
       (11, '2023-07-20', 129, 86, 36.9, 115, 166.0, 61.0),
       (12, '2023-07-20', 124, 77, 36.6, 99, 169.0, 69.0),
       (13, '2023-07-20', 131, 88, 37.1, 125, 176.0, 76.0),
       (14, '2023-07-20', 119, 74, 36.5, 92, 161.0, 58.0),
       (15, '2023-07-20', 126, 80, 36.7, 103, 171.0, 71.0),
       (16, '2023-08-01', 125, 80, 36.6, 98, 160.0, 58.0),
       (17, '2023-08-01', 132, 86, 36.9, 112, 170.0, 72.0),
       (18, '2023-08-01', 128, 79, 36.7, 105, 155.0, 54.0),
       (19, '2023-08-01', 119, 74, 36.5, 90, 163.0, 60.0),
       (20, '2023-08-01', 130, 85, 36.8, 115, 172.0, 75.0),
       (21, '2023-08-01', 124, 78, 36.6, 96, 158.0, 56.0),
       (22, '2023-08-01', 127, 81, 36.7, 100, 167.0, 67.0),
       (23, '2023-08-01', 116, 73, 36.5, 89, 161.0, 57.0),
       (24, '2023-08-01', 129, 84, 36.8, 109, 171.0, 70.0),
       (25, '2023-08-01', 122, 77, 36.7, 94, 156.0, 55.0),
       (26, '2023-08-01', 131, 87, 36.9, 118, 165.0, 62.0),
       (27, '2023-08-01', 126, 79, 36.6, 101, 168.0, 68.0),
       (28, '2023-08-01', 133, 89, 37.0, 122, 175.0, 78.0),
       (29, '2023-08-01', 120, 75, 36.5, 93, 160.0, 59.0),
       (30, '2023-08-01', 125, 80, 36.7, 104, 170.0, 71.0),
       (31, '2023-08-01', 128, 82, 36.8, 107, 159.0, 57.0),
       (32, '2023-08-01', 117, 74, 36.5, 91, 162.0, 60.0),
       (33, '2023-08-01', 129, 85, 36.9, 110, 173.0, 74.0),
       (34, '2023-08-01', 123, 76, 36.6, 95, 157.0, 56.0),
       (35, '2023-08-01', 130, 88, 37.0, 120, 166.0, 63.0),
       (36, '2023-08-01', 125, 80, 36.7, 102, 169.0, 69.0),
       (37, '2023-08-01', 132, 90, 37.1, 125, 176.0, 77.0),
       (38, '2023-08-01', 121, 75, 36.5, 94, 161.0, 59.0),
       (39, '2023-08-01', 126, 81, 36.8, 106, 172.0, 72.0),
       (40, '2023-08-01', 129, 83, 36.9, 109, 158.0, 58.0),
       (41, '2023-08-01', 118, 74, 36.5, 92, 163.0, 61.0),
       (42, '2023-08-01', 130, 86, 37.0, 115, 170.0, 73.0),
       (43, '2023-08-01', 124, 77, 36.6, 98, 155.0, 54.0),
       (44, '2023-08-01', 127, 82, 36.7, 103, 167.0, 67.0),
       (45, '2023-08-01', 116, 73, 36.5, 88, 161.0, 57.0),
       (46, '2023-08-01', 129, 84, 36.8, 109, 171.0, 70.0),
       (47, '2023-08-01', 122, 77, 36.7, 94, 156.0, 55.0),
       (48, '2023-08-01', 131, 87, 36.9, 118, 165.0, 62.0),
       (49, '2023-08-01', 126, 79, 36.6, 101, 168.0, 68.0),
       (50, '2023-08-01', 133, 89, 37.0, 122, 175.0, 78.0),
       (51, '2023-08-01', 120, 75, 36.5, 93, 160.0, 59.0),
       (52, '2023-08-01', 125, 80, 36.7, 104, 170.0, 71.0),
       (53, '2023-08-01', 128, 82, 36.8, 107, 159.0, 57.0),
       (54, '2023-08-01', 117, 74, 36.5, 91, 162.0, 60.0),
       (55, '2023-08-01', 129, 85, 36.9, 110, 173.0, 74.0),
       (56, '2023-08-01', 123, 76, 36.6, 95, 157.0, 56.0),
       (57, '2023-08-01', 130, 88, 37.0, 120, 166.0, 63.0),
       (58, '2023-08-01', 125, 80, 36.7, 102, 169.0, 69.0),
       (59, '2023-08-01', 132, 90, 37.1, 125, 176.0, 77.0),
       (60, '2023-08-01', 121, 75, 36.5, 94, 161.0, 59.0),
       (61, '2023-08-01', 126, 81, 36.8, 106, 172.0, 72.0),
       (62, '2023-08-01', 129, 83, 36.9, 109, 158.0, 58.0),
       (63, '2023-08-01', 118, 74, 36.5, 92, 163.0, 61.0),
       (64, '2023-08-01', 130, 86, 37.0, 115, 170.0, 73.0),
       (65, '2023-08-01', 124, 77, 36.6, 98, 155.0, 54.0);

INSERT INTO public.senior_user_relations (senior_id, user_id, role)
VALUES (1, 1, 'ADMIN'),
       (1, 2, 'EMPLOYEE'),
       (1, 3, 'GUARDIAN'),
       (2, 2, 'EMPLOYEE'),
       (2, 7, 'GUARDIAN'),
       (3, 6, 'EMPLOYEE'),
       (3, 3, 'GUARDIAN'),
       (4, 4, 'EMPLOYEE'),
       (4, 7, 'GUARDIAN'),
       (5, 2, 'EMPLOYEE'),
       (5, 5, 'GUARDIAN'),
       (6, 6, 'EMPLOYEE'),
       (6, 9, 'GUARDIAN'),
       (7, 8, 'EMPLOYEE'),
       (7, 11, 'GUARDIAN'),
       (8, 10, 'EMPLOYEE'),
       (8, 13, 'GUARDIAN'),
       (9, 2, 'EMPLOYEE'),
       (9, 3, 'GUARDIAN'),
       (10, 4, 'EMPLOYEE'),
       (10, 5, 'GUARDIAN'),
       (11, 6, 'EMPLOYEE'),
       (11, 7, 'GUARDIAN'),
       (12, 8, 'EMPLOYEE'),
       (12, 9, 'GUARDIAN'),
       (13, 10, 'EMPLOYEE'),
       (13, 11, 'GUARDIAN'),
       (14, 12, 'EMPLOYEE'),
       (14, 13, 'GUARDIAN'),
       (15, 14, 'EMPLOYEE'),
       (15, 11, 'GUARDIAN'),
-- New seniors and guardians (mostly 1:1)
       (16, 14, 'GUARDIAN'),
       (17, 16, 'GUARDIAN'),
       (18, 18, 'GUARDIAN'),
       (19, 20, 'GUARDIAN'),
       (20, 22, 'GUARDIAN'),
       (21, 24, 'GUARDIAN'),
       (22, 26, 'GUARDIAN'),
       (23, 28, 'GUARDIAN'),
       (24, 30, 'GUARDIAN'),
       (25, 32, 'GUARDIAN'),
       (26, 34, 'GUARDIAN'),
       (27, 36, 'GUARDIAN'),
       (28, 38, 'GUARDIAN'),
       (29, 40, 'GUARDIAN'),
       (30, 42, 'GUARDIAN'),
       (31, 44, 'GUARDIAN'),
       (32, 46, 'GUARDIAN'),
       (33, 48, 'GUARDIAN'),
       (34, 50, 'GUARDIAN'),
       (35, 52, 'GUARDIAN'),
       (36, 54, 'GUARDIAN'),
       (37, 56, 'GUARDIAN'),
       (38, 58, 'GUARDIAN'),
       (39, 60, 'GUARDIAN'),
-- Guardians with 2 seniors (a few cases)
       (40, 3, 'GUARDIAN'),
       (41, 7, 'GUARDIAN'),
       (42, 5, 'GUARDIAN'),
       (43, 9, 'GUARDIAN'),
       (44, 11, 'GUARDIAN'),
       (45, 13, 'GUARDIAN'),
-- Seniors with multiple guardians (a few cases)
       (16, 16, 'GUARDIAN'),
       (17, 18, 'GUARDIAN'),
       (18, 20, 'GUARDIAN'),
       (19, 22, 'GUARDIAN'),
       (20, 24, 'GUARDIAN'),
-- Additional seniors with 1:1 guardian
       (46, 25, 'GUARDIAN'),
       (47, 27, 'GUARDIAN'),
       (48, 29, 'GUARDIAN'),
       (49, 31, 'GUARDIAN'),
       (50, 33, 'GUARDIAN'),
       (51, 35, 'GUARDIAN'),
       (52, 37, 'GUARDIAN'),
       (53, 39, 'GUARDIAN'),
       (54, 41, 'GUARDIAN'),
       (55, 43, 'GUARDIAN'),
       (56, 45, 'GUARDIAN'),
       (57, 47, 'GUARDIAN'),
       (58, 49, 'GUARDIAN'),
       (59, 51, 'GUARDIAN'),
       (60, 53, 'GUARDIAN'),
       (61, 55, 'GUARDIAN'),
       (62, 57, 'GUARDIAN'),
       (63, 59, 'GUARDIAN'),
       (64, 60, 'GUARDIAN'),
       (65, 3, 'GUARDIAN');


-- INSERT INTO public.document_library (senior_id, is_deleted, document_name, original_photo_paths)
-- VALUES (1, FALSE, '건강검진 결과지 2023', 'path/to/doc1.pdf'),
--        (1, FALSE, '입소 동의서', 'path/to/doc2.pdf'),
--        (2, FALSE, '복약 지도서', 'path/to/doc3.pdf'),
--        (3, FALSE, '재활 치료 계획서', 'path/to/doc4.pdf'),
--        (4, FALSE, '개인 정보 동의서', 'path/to/doc5.pdf'),
--        (5, FALSE, '정영호 어르신 퇴소 서류', 'path/to/doc6.pdf'),
--        (6, FALSE, '김영숙 어르신 건강 기록', 'path/to/doc7.pdf'),
--        (7, FALSE, '박찬호 어르신 진료 기록', 'path/to/doc8.pdf'),
--        (8, FALSE, '이지혜 어르신 복약 정보', 'path/to/doc9.pdf'),
--        (9, FALSE, '최준영 어르신 재활 일지', 'path/to/doc10.pdf'),
--        (10, FALSE, '한미정 어르신 상담 기록', 'path/to/doc11.pdf'),
--        (11, FALSE, '송지훈 어르신 입소 서류', 'path/to/doc12.pdf'),
--        (12, FALSE, '임은혜 어르신 건강검진', 'path/to/doc13.pdf'),
--        (13, FALSE, '강동원 어르신 진료의뢰서', 'path/to/doc14.pdf'),
--        (14, FALSE, '윤아영 어르신 재활 계획', 'path/to/doc15.pdf'),
--        (15, FALSE, '서진우 어르신 가족 동의서', 'path/to/doc16.pdf'),
--        (16, FALSE, '문소리 어르신 입소 서류', 'path/to/doc17.pdf'),
--        (17, FALSE, '오정우 어르신 건강 기록', 'path/to/doc18.pdf'),
--        (18, FALSE, '이선영 어르신 진료 기록', 'path/to/doc19.pdf'),
--        (19, FALSE, '박동민 어르신 복약 정보', 'path/to/doc20.pdf'),
--        (20, FALSE, '정미경 어르신 재활 일지', 'path/to/doc21.pdf'),
--        (21, FALSE, '김영철 어르신 상담 기록', 'path/to/doc22.pdf'),
--        (22, FALSE, '이수진 어르신 입소 서류', 'path/to/doc23.pdf'),
--        (23, FALSE, '박성호 어르신 건강검진', 'path/to/doc24.pdf'),
--        (24, FALSE, '최은경 어르신 진료의뢰서', 'path/to/doc25.pdf'),
--        (25, FALSE, '한정수 어르신 재활 계획', 'path/to/doc26.pdf'),
--        (26, FALSE, '송민아 어르신 가족 동의서', 'path/to/doc27.pdf'),
--        (27, FALSE, '임재범 어르신 건강검진 결과지', 'path/to/doc28.pdf'),
--        (28, FALSE, '강혜진 어르신 입소 동의서', 'path/to/doc29.pdf'),
--        (29, FALSE, '윤상현 어르신 복약 지도서', 'path/to/doc30.pdf'),
--        (30, FALSE, '서영희 어르신 재활 치료 계획서', 'path/to/doc31.pdf'),
--        (31, FALSE, '김성수 어르신 개인 정보 동의서', 'path/to/doc32.pdf'),
--        (32, FALSE, '박지영 어르신 퇴소 서류', 'path/to/doc33.pdf'),
--        (33, FALSE, '이동욱 어르신 건강 기록', 'path/to/doc34.pdf'),
--        (34, FALSE, '최수정 어르신 진료 기록', 'path/to/doc35.pdf'),
--        (35, FALSE, '한승우 어르신 복약 정보', 'path/to/doc36.pdf'),
--        (36, FALSE, '송은진 어르신 재활 일지', 'path/to/doc37.pdf'),
--        (37, FALSE, '임동현 어르신 상담 기록', 'path/to/doc38.pdf'),
--        (38, FALSE, '강민아 어르신 입소 서류', 'path/to/doc39.pdf'),
--        (39, FALSE, '윤지훈 어르신 건강검진', 'path/to/doc40.pdf'),
--        (40, FALSE, '서혜원 어르신 진료의뢰서', 'path/to/doc41.pdf'),
--        (41, FALSE, '김태형 어르신 재활 계획', 'path/to/doc42.pdf'),
--        (42, FALSE, '박나래 어르신 가족 동의서', 'path/to/doc43.pdf'),
--        (43, FALSE, '이준영 어르신 건강검진 결과지', 'path/to/doc44.pdf'),
--        (44, FALSE, '최유리 어르신 입소 동의서', 'path/to/doc45.pdf'),
--        (45, FALSE, '한재석 어르신 복약 지도서', 'path/to/doc46.pdf'),
--        (46, FALSE, '송하윤 어르신 재활 치료 계획서', 'path/to/doc47.pdf'),
--        (47, FALSE, '임성민 어르신 개인 정보 동의서', 'path/to/doc48.pdf'),
--        (48, FALSE, '강수정 어르신 퇴소 서류', 'path/to/doc49.pdf'),
--        (49, FALSE, '윤정우 어르신 건강 기록', 'path/to/doc50.pdf'),
--        (50, FALSE, '서지혜 어르신 진료 기록', 'path/to/doc51.pdf'),
--        (51, FALSE, '김준호 어르신 복약 정보', 'path/to/doc52.pdf'),
--        (52, FALSE, '박예진 어르신 재활 일지', 'path/to/doc53.pdf'),
--        (53, FALSE, '이도현 어르신 상담 기록', 'path/to/doc54.pdf'),
--        (54, FALSE, '최윤서 어르신 입소 서류', 'path/to/doc55.pdf'),
--        (55, FALSE, '한승현 어르신 건강검진', 'path/to/doc56.pdf'),
--        (56, FALSE, '송지효 어르신 진료의뢰서', 'path/to/doc57.pdf'),
--        (57, FALSE, '임창정 어르신 재활 계획', 'path/to/doc58.pdf'),
--        (58, FALSE, '강하늘 어르신 가족 동의서', 'path/to/doc59.pdf'),
--        (59, FALSE, '윤계상 어르신 건강검진 결과지', 'path/to/doc60.pdf'),
--        (60, FALSE, '서강준 어르신 입소 동의서', 'path/to/doc61.pdf'),
--        (61, FALSE, '새로운 어르신 1 문서', 'path/to/doc62.pdf'),
--        (62, FALSE, '새로운 어르신 2 문서', 'path/to/doc63.pdf'),
--        (63, FALSE, '새로운 어르신 3 문서', 'path/to/doc64.pdf'),
--        (64, FALSE, '새로운 어르신 4 문서', 'path/to/doc65.pdf'),
--        (65, FALSE, '새로운 어르신 5 문서', 'path/to/doc66.pdf');

INSERT INTO public.observation_records (senior_id, content, level)
VALUES (1, '규칙적인 산책을 즐기시며, 활기찬 모습을 보임.', 'MEDIUM'),
       (1, '아침 식사 후 혈당이 다소 높게 측정되어 주의 필요.', 'MEDIUM'),
       (2, '손주 방문 시 매우 기뻐하시며, 정서적으로 안정된 모습.', 'LOW'),
       (2, '최근 식사량이 줄어 영양 상태 모니터링 필요.', 'HIGH'),
       (3, '특별한 특이사항 없이 일상 생활 유지 중.', 'LOW'),
       (4, '독서 활동에 적극 참여하며, 인지 기능 양호함.', 'MEDIUM'),
       (4, '밤에 잠을 잘 못 주무시는 경향이 있어 수면 패턴 관찰 필요.', 'MEDIUM'),
       (5, '퇴소 후 건강 상태 지속적으로 확인 필요.', 'MEDIUM'),
       (6, '원예 활동에 관심이 많아 관련 프로그램 참여 권유.', 'MEDIUM'),
       (7, '새로운 환경에 잘 적응하고 있으며, 다른 어르신들과 교류 활발.', 'LOW'),
       (8, '음악 감상을 즐겨 하시며, 기분 전환에 도움이 됨.', 'MEDIUM'),
       (9, '재활 운동에 꾸준히 참여하며, 회복 속도 빠름.', 'MEDIUM'),
       (10, '미술 치료 프로그램에 높은 만족도를 보임.', 'LOW'),
       (11, '식사 시 편식이 있어 영양 상담 필요.', 'MEDIUM'),
       (12, '요리 프로그램 참여를 희망하며, 적극적인 의사 표현.', 'LOW'),
       (13, '최근 혈압이 다소 높아 주기적인 측정 필요.', 'MEDIUM'),
       (14, '주간 보호 센터 적응에 시간이 필요해 보임.', 'HIGH'),
       (15, '특별한 신체적 불편함 없이 건강한 상태 유지.', 'LOW'),
       (16, '인지 활동 프로그램에 대한 집중도가 높음.', 'MEDIUM'),
       (17, '밤에 자주 깨어 수면의 질 개선 방안 모색 중.', 'MEDIUM'),
       (18, '가족 면회 시 매우 활기찬 모습을 보임.', 'LOW'),
       (19, '식사 거부 증상이 간헐적으로 나타나 관찰 중.', 'HIGH'),
       (20, '산책 시 보호자 동반이 필요하며, 낙상 주의.', 'MEDIUM'),
       (21, '규칙적인 약 복용 지도가 필요함.', 'MEDIUM'),
       (22, '새로운 어르신들과의 교류에 어려움이 있어 사회성 증진 프로그램 추천.', 'HIGH'),
       (23, '기억력 저하 증상이 관찰되어 인지 능력 향상 프로그램 필요.', 'HIGH'),
       (24, '배변 활동에 어려움이 있어 간호사의 도움이 필요함.', 'HIGH'),
       (25, '언어 표현에 어려움이 있어 언어 치료 필요.', 'HIGH'),
       (26, '정서적 지지가 필요하며, 상담을 통해 안정감을 제공.', 'MEDIUM'),
       (27, '활동량이 많아 주의가 필요하며, 안전 관리 철저.', 'MEDIUM'),
       (28, '새로운 환경에 민감하게 반응하여 적응 기간이 필요.', 'HIGH'),
       (29, '대화 시 집중력 저하가 관찰되어 반복적인 설명 필요.', 'MEDIUM'),
       (30, '식사 시 도움 필요하며, 음식물 섭취량 지속적으로 확인.', 'HIGH'),
       (31, '활동 보조 기구 사용에 익숙해지고 있음.', 'MEDIUM'),
       (32, '낙상 위험이 있어 항상 주의가 필요하며, 보호 장비 착용 권유.', 'HIGH'),
       (33, '배회 증상이 있어 보호가 필요하며, 위치 추적 장치 활용 고려.', 'HIGH'),
       (34, '수면제 복용 후에도 불면증이 지속되어 의료진 상담 필요.', 'HIGH'),
       (35, '공격적인 행동이 간헐적으로 관찰되어 심리 상담 강화.', 'HIGH'),
       (36, '휠체어 사용이 필요하며, 이동 시 도움 제공.', 'MEDIUM'),
       (37, '청각 보조 기구 사용 중이며, 의사소통 시 큰 소리로 말해야 함.', 'MEDIUM'),
       (38, '가족과의 유대감 형성이 중요하며, 정기적인 면회 독려.', 'MEDIUM'),
       (39, '최근 체중 감소가 있어 영양 상태 정밀 검사 필요.', 'HIGH'),
       (40, '발음이 불분명하여 의사소통에 어려움이 있음.', 'HIGH'),
       (41, '식사 후 졸음이 심해 낮잠 시간 조절 필요.', 'MEDIUM'),
       (42, '피부 건조증이 심해 보습 관리 필요.', 'MEDIUM'),
       (43, '손 떨림 증상이 있어 식사 시 도움 필요.', 'HIGH'),
       (44, '밤에 자주 화장실을 가 수면 방해.', 'MEDIUM'),
       (45, '기침이 잦아 호흡기 건강 관찰 필요.', 'MEDIUM'),
       (46, '독립적인 활동을 선호하며, 개인 시간 존중 필요.', 'LOW'),
       (47, '목욕 시 도움 필요하며, 미끄럼 방지 매트 사용 권유.', 'MEDIUM'),
       (48, 'TV 시청을 즐겨 하시며, 좋아하는 프로그램 시청 지원.', 'LOW'),
       (49, '이동 시 비틀거림이 있어 지팡이 사용 권유.', 'HIGH'),
       (50, '식사 중 사레가 자주 들려 음식물 섭취 시 주의.', 'HIGH'),
       (51, '규칙적인 혈당 측정 및 관리 필요.', 'MEDIUM'),
       (52, '인지 저하로 인한 반복 행동이 관찰되어 인지 프로그램 강화.', 'HIGH'),
       (53, '정기적인 건강 검진 결과 양호함.', 'LOW'),
       (54, '식사 거부 증상 관찰되어 영양 상태 집중 관리.', 'HIGH'),
       (55, '새로운 프로그램에 대한 흥미를 보임.', 'MEDIUM'),
       (56, '배회 증상 있어 보호 필요하며, 안전 관리 강화.', 'HIGH'),
       (57, '수면 패턴 불규칙하여 수면 유도 활동 필요.', 'HIGH'),
       (58, '활동량 증가로 인한 피로도 관찰.', 'MEDIUM'),
       (59, '외부 활동 시 보호자 동반 필요.', 'MEDIUM'),
       (60, '공격적인 행동 관찰되어 심리 상담 및 행동 치료 병행.', 'HIGH'),
       (61, '휠체어 사용에 불편함 없어 이동에 문제 없음.', 'MEDIUM'),
       (62, '청각 보조 기구 착용 후 의사소통 원활.', 'MEDIUM'),
       (63, '가족과의 유대 관계 양호함.', 'LOW'),
       (64, '시력 저하로 인한 불편함 호소.', 'HIGH'),
       (65, '소화 불량 증상 있어 식단 조절 필요.', 'MEDIUM');


-- INSERT INTO public.medication_schedules (
--     senior_id, medication_name, medication_startdate, medication_enddate,
--     description, medication_info, medication_times, is_deleted
-- ) VALUES
--     (1, '아스피린', '2024-01-01', '2024-02-01', '식후 복용', '항혈소판제', '09:00,21:00', FALSE),
--     (2, '메트포르민', '2024-01-15', '2024-03-15', '식후 30분', '당뇨병 치료제', '08:00,20:00', FALSE),
--     (3, '암로디핀', '2024-02-01', '2024-04-01', '아침 복용', '고혈압 치료제', '08:00', FALSE);


-- Assumes medication_schedules IDs start from 1 due to RESTART IDENTITY
-- INSERT INTO public.medications (
--     medication_schedules_id, medication_photo_path, medicated_at,
--     medication_schedule, medication_date, is_deleted
-- ) VALUES
--     (1, 'path/to/med1.jpg',  '2024-01-10 09:05:00', 'AFTER_BREAKFAST', '2024-01-10', FALSE),
--     (1, 'path/to/med1b.jpg', '2024-01-10 21:05:00', 'BEDTIME',         '2024-01-10', FALSE),
--     (2, 'path/to/med2.jpg',  '2024-02-01 08:30:00', 'AFTER_BREAKFAST', '2024-02-01', FALSE),
--     (3, 'path/to/med3.jpg',  '2024-02-10 08:10:00', 'BEFORE_BREAKFAST','2024-02-10', FALSE);


INSERT INTO public.meeting_matches (
    employee_id, guardian_id, senior_id, meeting_time,
    matched_at, status, algorithm_info, title, meeting_type,
    content, code, minio_url, classification, hospital_name,
    started_at, ended_at
) VALUES
      (2, 3, 1, '2024-04-10 10:00:00', NOW(), 'PENDING', '기본 규칙 매칭', '정기 미팅', 'withEmployee',
       '정기 상담 예정', 'MEET0001', NULL, '일반상담', '한디요양병원',
       '2024-04-10 09:50:00', '2024-04-10 11:00:00'),
      (2, 7, 2, '2024-04-11 11:00:00', NOW(), 'PENDING', '가중치 기반 매칭', '월간 미팅', 'withEmployee',
       '영양 상태 점검', 'MEET0002', NULL, '영양상담', '한디요양병원',
       '2024-04-11 10:50:00', '2024-04-11 12:00:00'),
      (6, 3, 3, '2024-04-12 14:00:00', NOW(), 'PENDING', '시간대 우선 매칭', '주간 점검', 'withEmployee',
       '활동량 점검 예정', 'MEET0003', NULL, '일반상담', '한디요양병원',
       '2024-04-12 13:50:00', '2024-04-12 15:00:00');

