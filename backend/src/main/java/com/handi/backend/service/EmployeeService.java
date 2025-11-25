package com.handi.backend.service;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.senior.SeniorResponseDto;
import com.handi.backend.dto.user.UserResponseDto;
import com.handi.backend.entity.Seniors;
import com.handi.backend.entity.Users;
import com.handi.backend.enums.Role;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.mapper.UserMapper;
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
public class EmployeeService {

    private final DateTimeConverter dateTimeConverter;
    private final UsersRepository usersRepository;
    private final SeniorsRepository seniorsRepository;
    private final UserMapper userMapper;

    /**
     * 동료 직원 목록 조회
     *
     * @param email    요청자 이메일
     * @param keyword  검색 키워드
     * @param pageable 페이지 정보
     * @return 동료 직원 목록
     */
    public Page<UserResponseDto> getColleagues(String email, String keyword, Pageable pageable) {
        log.info("동료 직원 목록 조회 서비스 시작: requestEmail={}", email);

        Users requestUser = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 직원 권한 및 승인 상태 확인
        if (!Role.EMPLOYEE.equals(requestUser.getRole())) {
            throw new IllegalArgumentException("승인된 직원만 동료 목록을 조회할 수 있습니다");
        }

        Integer organizationId = requestUser.getOrganizationId();
        if (organizationId == null) {
            throw new IllegalArgumentException("소속 기관이 설정되지 않았습니다");
        }

        Page<Users> colleagues;
        if (keyword == null || keyword.trim().isEmpty()) {
            colleagues = usersRepository.findByOrganizationIdAndRoleAndIsDeletedFalse(organizationId, Role.EMPLOYEE, pageable);
        } else {
            colleagues = usersRepository.findByOrganizationIdAndRoleAndNameContainingAndIsDeletedFalse(organizationId, Role.EMPLOYEE, keyword, pageable);
        }

        return colleagues.map(userMapper::toResponseDto);
    }

    /**
     * 동료 직원 상세 조회
     *
     * @param email 요청자 이메일
     * @param id    조회할 직원 ID
     * @return 동료 직원 정보
     */
    public UserResponseDto getColleague(String email, Integer id) {
        log.info("동료 직원 상세 조회 서비스 시작: requestEmail={}, targetId={}", email, id);

        Users requestUser = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 직원 권한 및 승인 상태 확인
        if (!Role.EMPLOYEE.equals(requestUser.getRole())) {
            throw new IllegalArgumentException("승인된 직원만 동료 정보를 조회할 수 있습니다");
        }

        Users targetUser = usersRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + id));

        // 같은 기관 직원인지 확인
        if (!requestUser.getOrganizationId().equals(targetUser.getOrganizationId()) ||
                !Role.EMPLOYEE.equals(targetUser.getRole())) {
            throw new IllegalArgumentException("같은 기관의 직원만 조회할 수 있습니다");
        }

        return userMapper.toResponseDto(targetUser);
    }

    /**
     * 담당 환자 목록 조회
     *
     * @param email    직원 이메일
     * @param keyword  검색 키워드
     * @param pageable 페이지 정보
     * @return 담당 환자 목록
     */
    public PageResponseDto<SeniorResponseDto> getAssignedSeniors(String email, String keyword, Pageable pageable) {
        log.info("담당 환자 목록 조회 서비스 시작: email={}", email);

        Users user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 직원 권한 및 승인 상태 확인
        if (!Role.EMPLOYEE.equals(user.getRole())) {
            throw new IllegalArgumentException("승인된 직원만 환자 목록을 조회할 수 있습니다");
        }

        // 사용자 관련 활성 시니어 목록 조회 (SeniorsRepository의 기존 메서드 활용)
        Page<com.handi.backend.entity.Seniors> seniorPage = seniorsRepository.findByRelatedUserIdAndIsActiveTrue(user.getId(), pageable);

        // 키워드 검색이 있는 경우 추가 필터링 (현재는 간단히 구현)
        // TODO: 더 효율적인 쿼리로 개선 가능

        // Entity를 DTO로 변환
        List<SeniorResponseDto> seniors = seniorPage.getContent().stream()
                .map(this::convertToSeniorResponseDto)
                .collect(java.util.stream.Collectors.toList());

        return PageResponseDto.from("담당 환자 목록이 성공적으로 조회되었습니다", seniorPage, seniors);
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

    // getOrganizationInfo 메서드는 UserService로 이동됨 (직원, 보호자 공용)

    /**
     * 직원 일정 조회 (임시 구현)
     *
     * @param email     직원 이메일
     * @param startDate 시작일
     * @param endDate   종료일
     * @param pageable  페이지 정보
     * @return 일정 목록
     */
    public Page<Object> getMySchedule(String email, String startDate, String endDate, Pageable pageable) {
        log.info("직원 일정 조회 서비스 시작: email={}, startDate={}, endDate={}", email, startDate, endDate);

        Users user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 직원 권한 확인
        if (!Role.EMPLOYEE.equals(user.getRole())) {
            throw new IllegalArgumentException("직원 권한이 없습니다");
        }

        // TODO: Schedule 엔티티 생성 후 실제 구현
        // 현재는 빈 페이지 반환
        return Page.empty(pageable);
    }

}