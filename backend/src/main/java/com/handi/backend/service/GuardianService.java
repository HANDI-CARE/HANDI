package com.handi.backend.service;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.senior.SeniorResponseDto;
import com.handi.backend.dto.user.UserCreateRequestDto;
import com.handi.backend.dto.user.UserResponseDto;
import com.handi.backend.entity.Seniors;
import com.handi.backend.entity.Users;
import com.handi.backend.enums.Role;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.mapper.UserMapper;
import com.handi.backend.repository.SeniorUserRelationsRepository;
import com.handi.backend.repository.SeniorsRepository;
import com.handi.backend.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GuardianService {

    private final DateTimeConverter dateTimeConverter;
    private final UsersRepository usersRepository;
    private final SeniorsRepository seniorsRepository;
    private final SeniorUserRelationsRepository seniorUserRelationsRepository;
    private final UserMapper userMapper;

    /**
     * 보호자 등록 신청
     *
     * @param email      보호자 이메일
     * @param requestDto 보호자 등록 요청 DTO
     * @return 생성된 보호자 정보
     */
    public UserResponseDto applyAsGuardian(String email, UserCreateRequestDto requestDto) {
        log.info("보호자 등록 신청 서비스 시작: email={}", email);

        // 휴대폰 번호 중복 검증
        if (requestDto.getPhoneNumber() != null && usersRepository.existsByPhoneNumber(requestDto.getPhoneNumber())) {
            throw new IllegalArgumentException("이미 존재하는 휴대폰 번호입니다: " + requestDto.getPhoneNumber());
        }

        // DTO -> Entity 변환
        Users user = userMapper.toEntity(requestDto);

        // 보호자로 역할 설정
        user.setRole(Role.GUARDIAN);

        // 데이터베이스에 저장
        Users savedUser = usersRepository.save(user);

        log.info("보호자 등록 신청 완료: ID={}, email={}", savedUser.getId(), savedUser.getEmail());

        return userMapper.toResponseDto(savedUser);
    }

    /**
     * 보호자 본인 정보 조회
     *
     * @param email 이메일
     * @return 사용자 정보
     */
    public UserResponseDto getMyInfo(String email) {
        log.info("보호자 본인 정보 조회 서비스 시작: email={}", email);

        Users user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 보호자 권한 확인
        if (!Role.GUARDIAN.equals(user.getRole())) {
            throw new IllegalArgumentException("보호자 권한이 없습니다");
        }

        log.info("보호자 본인 정보 조회 완료: ID={}, 이메일={}", user.getId(), email);
        return userMapper.toResponseDto(user);
    }

    /**
     * 보호자 본인 정보 수정
     *
     * @param email      이메일
     * @param requestDto 수정 요청 DTO
     * @return 수정된 사용자 정보
     */
    public UserResponseDto updateMyInfo(String email, UserCreateRequestDto requestDto) {
        log.info("보호자 본인 정보 수정 서비스 시작: email={}", email);

        Users user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 보호자 권한 확인
        if (!Role.GUARDIAN.equals(user.getRole())) {
            throw new IllegalArgumentException("보호자 권한이 없습니다");
        }

        // 휴대폰 번호 중복 검증
        if (requestDto.getPhoneNumber() != null && !user.getPhoneNumber().equals(requestDto.getPhoneNumber()) && usersRepository.existsByPhoneNumber(requestDto.getPhoneNumber())) {
            throw new IllegalArgumentException("이미 존재하는 휴대폰 번호입니다: " + requestDto.getPhoneNumber());
        }

        // 엔티티 업데이트 (역할은 변경하지 않음)
        Role originalRole = user.getRole();
        Integer originalOrganizationId = user.getOrganizationId();

        userMapper.updateEntity(user, requestDto);

        // 중요한 필드는 변경되지 않도록 보장
        user.setRole(originalRole);
        user.setOrganizationId(originalOrganizationId);

        Users savedUser = usersRepository.save(user);

        log.info("보호자 본인 정보 수정 완료: ID={}, 이메일={}", savedUser.getId(), savedUser.getEmail());

        return userMapper.toResponseDto(savedUser);
    }

    /**
     * 가족 구성원 조회 (임시 구현)
     *
     * @param email    보호자 이메일
     * @param keyword  검색 키워드
     * @param pageable 페이지 정보
     * @return 가족 구성원 목록
     */
    public Page<Object> getFamilyMembers(String email, String keyword, Pageable pageable) {
        log.info("가족 구성원 조회 서비스 시작: email={}", email);

        Users user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 보호자 권한 및 승인 상태 확인
        if (!Role.GUARDIAN.equals(user.getRole())) {
            throw new IllegalArgumentException("승인된 보호자만 가족 구성원을 조회할 수 있습니다");
        }

        // TODO: Guardian-Senior 연관관계 테이블 생성 후 실제 구현
        // 현재는 빈 페이지 반환
        return Page.empty(pageable);
    }

    /**
     * 가족 구성원 상세 조회 (임시 구현)
     *
     * @param email    보호자 이메일
     * @param seniorId 환자 ID
     * @return 가족 구성원 정보
     */
    public Object getFamilyMember(String email, Integer seniorId) {
        log.info("가족 구성원 상세 조회 서비스 시작: email={}, seniorId={}", email, seniorId);

        Users user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 보호자 권한 및 승인 상태 확인
        if (!Role.GUARDIAN.equals(user.getRole())) {
            throw new IllegalArgumentException("승인된 보호자만 가족 구성원 정보를 조회할 수 있습니다");
        }

        // TODO: Guardian-Senior 연관관계 확인 후 실제 구현
        return "가족 구성원 상세 조회 기능은 추후 구현 예정입니다";
    }

    /**
     * 가족 돌봄 기록 조회 (임시 구현)
     *
     * @param email     보호자 이메일
     * @param seniorId  환자 ID
     * @param startDate 시작일
     * @param endDate   종료일
     * @param pageable  페이지 정보
     * @return 돌봄 기록 목록
     */
    public Page<Object> getCareRecords(String email, Integer seniorId, String startDate, String endDate, Pageable pageable) {
        log.info("가족 돌봄 기록 조회 서비스 시작: email={}, seniorId={}, startDate={}, endDate={}",
                email, seniorId, startDate, endDate);

        Users user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 보호자 권한 및 승인 상태 확인
        if (!Role.GUARDIAN.equals(user.getRole())) {
            throw new IllegalArgumentException("승인된 보호자만 돌봄 기록을 조회할 수 있습니다");
        }

        // TODO: CareRecord 엔티티 생성 후 실제 구현
        // 현재는 빈 페이지 반환
        return Page.empty(pageable);
    }

    /**
     * 방문 일정 조회 (임시 구현)
     *
     * @param email     보호자 이메일
     * @param startDate 시작일
     * @param endDate   종료일
     * @param pageable  페이지 정보
     * @return 방문 일정 목록
     */
    public Page<Object> getVisitSchedule(String email, String startDate, String endDate, Pageable pageable) {
        log.info("방문 일정 조회 서비스 시작: email={}, startDate={}, endDate={}", email, startDate, endDate);

        Users user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 보호자 권한 확인
        if (!Role.GUARDIAN.equals(user.getRole())) {
            throw new IllegalArgumentException("보호자 권한이 없습니다");
        }

        // TODO: VisitSchedule 엔티티 생성 후 실제 구현
        // 현재는 빈 페이지 반환
        return Page.empty(pageable);
    }

    /**
     * 방문 일정 등록 (임시 구현)
     *
     * @param email                보호자 이메일
     * @param visitScheduleRequest 방문 일정 요청
     * @return 생성된 방문 일정
     */
    public Object createVisitSchedule(String email, Object visitScheduleRequest) {
        log.info("방문 일정 등록 서비스 시작: email={}", email);

        Users user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 보호자 권한 및 승인 상태 확인
        if (!Role.GUARDIAN.equals(user.getRole())) {
            throw new IllegalArgumentException("승인된 보호자만 방문 일정을 등록할 수 있습니다");
        }

        // TODO: VisitSchedule 엔티티 생성 후 실제 구현
        return "방문 일정 등록 기능은 추후 구현 예정입니다";
    }

    /**
     * 알림 조회 (임시 구현)
     *
     * @param email    보호자 이메일
     * @param isRead   읽음 상태 필터
     * @param pageable 페이지 정보
     * @return 알림 목록
     */
    public Page<Object> getNotifications(String email, Boolean isRead, Pageable pageable) {
        log.info("알림 조회 서비스 시작: email={}, isRead={}", email, isRead);

        Users user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 보호자 권한 확인
        if (!Role.GUARDIAN.equals(user.getRole())) {
            throw new IllegalArgumentException("보호자 권한이 없습니다");
        }

        // TODO: Notification 엔티티 생성 후 실제 구현
        // 현재는 빈 페이지 반환
        return Page.empty(pageable);
    }

    /**
     * 알림 읽음 처리 (임시 구현)
     *
     * @param email          보호자 이메일
     * @param notificationId 알림 ID
     */
    public void markNotificationAsRead(String email, Integer notificationId) {
        log.info("알림 읽음 처리 서비스 시작: email={}, notificationId={}", email, notificationId);

        Users user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 보호자 권한 확인
        if (!Role.GUARDIAN.equals(user.getRole())) {
            throw new IllegalArgumentException("보호자 권한이 없습니다");
        }

        // TODO: Notification 엔티티 생성 후 실제 구현
        log.info("알림 읽음 처리 완료 (추후 구현 예정): email={}, notificationId={}", email, notificationId);
    }

    /**
     * 보호자 시니어 목록 조회
     *
     * @param requestEmail 요청자 이메일
     * @param guardianId   보호자 ID
     * @param keyword      검색 키워드
     * @param pageable     페이지 정보
     * @return 보호자 시니어 목록
     */
    public PageResponseDto<SeniorResponseDto> getGuardianSeniors(String requestEmail, Integer guardianId, String keyword, Pageable pageable) {
        log.info("보호자 시니어 목록 조회 서비스 시작: requestEmail={}, guardianId={}, keyword={}", requestEmail, guardianId, keyword);

        // 요청자 조회 및 권한 확인
        Users requestUser = usersRepository.findByEmail(requestEmail)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + requestEmail));

        // 대상 보호자 조회
        Users guardianUser = usersRepository.findById(guardianId)
                .orElseThrow(() -> new NotFoundException("보호자를 찾을 수 없습니다: " + guardianId));

        // 보호자 역할 확인
        if (!Role.GUARDIAN.equals(guardianUser.getRole())) {
            throw new IllegalArgumentException("대상 사용자가 보호자가 아닙니다");
        }

        // 접근 권한 확인: 본인이거나 동일 기관의 직원(관리자 포함)이어야 함
        boolean hasAccess = false;
        if (requestUser.getId().equals(guardianId)) {
            // 본인인 경우
            hasAccess = true;
        } else if (requestUser.getOrganizationId() != null &&
                requestUser.getOrganizationId().equals(guardianUser.getOrganizationId()) &&
                (Role.EMPLOYEE.equals(requestUser.getRole()) || Role.ADMIN.equals(requestUser.getRole()))) {
            // 동일 기관의 직원/관리자인 경우
            hasAccess = true;
        }

        if (!hasAccess) {
            throw new IllegalArgumentException("해당 보호자의 시니어 목록을 조회할 권한이 없습니다");
        }

        // 보호자와 연결된 활성 시니어 목록 조회 (GUARDIAN 역할로 연결된 시니어만)
        Page<Seniors> seniorPage = seniorsRepository.findByRelatedUserIdAndIsActiveTrue(guardianId, pageable);

        // Entity를 DTO로 변환
        List<SeniorResponseDto> seniors = seniorPage.getContent().stream()
                .map(this::convertToSeniorResponseDto)
                .collect(java.util.stream.Collectors.toList());

        log.info("보호자 시니어 목록 조회 완료: guardianId={}, 조회된 시니어 수={}", guardianId, seniors.size());

        return PageResponseDto.from("보호자 시니어 목록이 성공적으로 조회되었습니다", seniorPage, seniors);
    }

    /**
     * Senior Entity를 DTO로 변환
     */
    private SeniorResponseDto convertToSeniorResponseDto(Seniors senior) {
        return SeniorResponseDto.builder()
                .id(senior.getId())
                .organizationId(senior.getOrganization() != null ? senior.getOrganization().getId() : null)
                .organizationName(senior.getOrganization() != null ? senior.getOrganization().getName() : null)
                .name(senior.getName())
                .birthDate(dateTimeConverter.localDateToString(senior.getBirthDate()))
                .gender(senior.getGender())
                .admissionDate(dateTimeConverter.localDateToString(senior.getAdmissionDate()))
                .dischargeDate(dateTimeConverter.localDateToString(senior.getDischargeDate()))
                .note(senior.getNote())
                .isActive(senior.getIsActive())
                .createdAt(dateTimeConverter.localDateTimeToString(senior.getCreatedAt()))
                .updatedAt(dateTimeConverter.localDateTimeToString(senior.getUpdatedAt()))
                .age(calculateAge(senior.getBirthDate()))
                .build();
    }

    /**
     * 나이 계산
     */
    private Integer calculateAge(java.time.LocalDate birthDate) {
        if (birthDate == null) return null;
        return java.time.Period.between(birthDate, java.time.LocalDate.now()).getYears();
    }

}