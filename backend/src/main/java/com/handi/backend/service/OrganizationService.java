package com.handi.backend.service;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.organization.OrganizationRequestDto;
import com.handi.backend.dto.organization.OrganizationResponseDto;
import com.handi.backend.dto.organization.OrganizationResponseSimpleDto;
import com.handi.backend.dto.senior.SeniorResponseDto;
import com.handi.backend.dto.user.UserResponseDto;
import com.handi.backend.entity.Organizations;
import com.handi.backend.enums.Role;
import com.handi.backend.mapper.OrganizationMapper;
import com.handi.backend.entity.Seniors;
import com.handi.backend.entity.Users;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.mapper.UserMapper;
import com.handi.backend.repository.OrganizationsRepository;
import com.handi.backend.repository.SeniorsRepository;
import com.handi.backend.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Period;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrganizationService {

    private final DateTimeConverter dateTimeConverter;
    private final OrganizationsRepository organizationsRepository;
    private final UsersRepository usersRepository;
    private final SeniorsRepository seniorsRepository;
    private final OrganizationMapper organizationMapper;
    private final UserMapper userMapper;

    /**
     * 기관 생성 (Admin 전용)
     * Controller에서 @PreAuthorize("hasRole('ADMIN')") 로 접근 제한
     *
     * @param requestDto 기관 생성 요청 DTO
     * @return 생성된 기관
     */
    public OrganizationResponseDto createOne(OrganizationRequestDto requestDto) {
        log.info("기관 생성 서비스 시작: 기관명={}", requestDto.getName());

        // 중복 기관명 검증
        validateUniqueName(requestDto.getName());

        // 시간 유효성 검증
        if (requestDto.getBreakfastTime() != null) {
            validateMealTimeRange(dateTimeConverter.stringToLocalTime(requestDto.getBreakfastTime()));
        }
        if (requestDto.getLunchTime() != null) {
            validateMealTimeRange(dateTimeConverter.stringToLocalTime(requestDto.getLunchTime()));
        }
        if (requestDto.getDinnerTime() != null) {
            validateMealTimeRange(dateTimeConverter.stringToLocalTime(requestDto.getDinnerTime()));
        }

        // DTO → Entity 변환
        Organizations org = organizationMapper.toEntity(requestDto);

        // 데이터베이스에 저장
        Organizations savedOrganization = organizationsRepository.save(org);

        log.info("기관 생성 완료: ID={}, 기관명={}", savedOrganization.getId(), savedOrganization.getName());

        return organizationMapper.toResponseDto(savedOrganization);
    }

    /**
     * 기관 조회 (공개)
     * 인증없이 접근 가능
     *
     * @param id 기관 ID
     * @return 조회된 기관
     */
    public OrganizationResponseDto getOne(Integer id) {
        log.info("기관 조회 서비스 시작: ID={}", id);
        Organizations org = organizationsRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("기관을 찾을 수 없습니다: " + id));
        log.info("기관 조회 완료: ID={}, 기관명={}", id, org.getName());
        return organizationMapper.toResponseDto(org);
    }

    /**
     * 기관 조회 (공개)
     * 인증없이 접근 가능
     *
     * @param id 기관 ID
     * @return 조회된 기관
     */
    public OrganizationResponseSimpleDto getSimpleOne(Integer id) {
        log.info("기관 조회 서비스 시작: ID={}", id);
        Organizations org = organizationsRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("기관을 찾을 수 없습니다: " + id));
        log.info("기관 조회 완료: ID={}, 기관명={}", id, org.getName());
        return organizationMapper.toResponseSimpleDto(org);
    }

    /**
     * 기관 수정
     *
     * @param id         기관 ID
     * @param requestDto 기관 수정 요청 DTO
     * @return 생성된 기관
     */
    public OrganizationResponseDto updateOne(Integer id, OrganizationRequestDto requestDto) {
        log.info("기관 수정 서비스 시작: ID={}, 기관명={}", id, requestDto.getName());

        // 1. 기관 조회
        Organizations org = organizationsRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("기관을 찾을 수 없습니다: " + id));

        // 2. 중복 기관명 검증
        if (!org.getName().equals(requestDto.getName())) {
            validateUniqueName(requestDto.getName());
        }

        // 3. 시간 유효성 검증
        if (requestDto.getBreakfastTime() != null) {
            validateMealTimeRange(dateTimeConverter.stringToLocalTime(requestDto.getBreakfastTime()));
        }
        if (requestDto.getLunchTime() != null) {
            validateMealTimeRange(dateTimeConverter.stringToLocalTime(requestDto.getLunchTime()));
        }
        if (requestDto.getDinnerTime() != null) {
            validateMealTimeRange(dateTimeConverter.stringToLocalTime(requestDto.getDinnerTime()));
        }

        // 4. 엔티티 업데이트
        organizationMapper.updateEntity(org, requestDto);

        // 4. 데이터베이스에 수정
        Organizations savedOrganization = organizationsRepository.save(org);

        log.info("기관 수정 완료: ID={}, 기관명={}", savedOrganization.getId(), savedOrganization.getName());

        return organizationMapper.toResponseDto(savedOrganization);
    }

    /**
     * 기관 삭제 (Admin 전용)
     * Controller에서 @PreAuthorize("hasRole('ADMIN')") 로 접근 제한
     *
     * @param id 기관 ID
     */
    public void deleteOne(Integer id) {
        log.info("기관 삭제 서비스 시작: id={}", id);

        // 삭제 전 존재 여부 확인
        Organizations org = organizationsRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("기관을 찾을 수 없습니다: " + id));

        // 소프트 삭제 적용
        org.setIsDeleted(true);
        organizationsRepository.save(org);
        log.info("기관 소프트 삭제 완료: ID={}, 기관명={}", org.getId(), org.getName());
    }


    /**
     * 키워드를 포함하는 기관 목록 조회
     *
     * @param keyword  문자열
     * @param pageable page 정보
     * @return 기관 목록
     */
    public Page<OrganizationResponseDto> getList(String keyword, Pageable pageable) {
        log.info("기관 목록 조회 서비스 시작");

        if (keyword == null || keyword.trim().isEmpty()) {
            return organizationsRepository.findAllByIsDeletedFalse(pageable)
                    .map(organizationMapper::toResponseDto);
        }
        return organizationsRepository.findByNameContainingAndIsDeletedFalse(keyword, pageable)
                .map(organizationMapper::toResponseDto);
    }

    /**
     * 기관 사용자 목록 조회
     *
     * @param id       기관 ID
     * @param keyword  문자열
     * @param pageable page 정보
     * @return 사용자 목록
     */
    public Page<UserResponseDto> getUserList(Integer id, String keyword, Pageable pageable, Boolean includeDeleted, Role role) {
        log.info("기관 사용자 목록 조회 서비스 시작");
        
        Page<Users> page;
        if (keyword == null || keyword.trim().isEmpty()) {
            if (includeDeleted) {
                if(role == null) page = usersRepository.findByOrganizationId(id, pageable);
                else page = usersRepository.findByOrganizationIdAndRole(id,role,pageable);
            } else {
                if(role == null) page = usersRepository.findByOrganizationIdAndIsDeletedFalse(id, pageable);
                else page = usersRepository.findByOrganizationIdAndRoleAndIsDeletedFalse(id,role,pageable);
            }
        } else {
            if (includeDeleted) {
                if(role == null) page = usersRepository.findByOrganizationIdAndNameContaining(id, keyword, pageable);
                else page = usersRepository.findByOrganizationIdAndRoleAndNameContaining(id,role,keyword,pageable);
            } else {
                if(role==null) page = usersRepository.findByOrganizationIdAndNameContainingAndIsDeletedFalse(id, keyword, pageable);
                else page = usersRepository.findByOrganizationIdAndRoleAndNameContainingAndIsDeletedFalse(id,role,keyword,pageable);
            }
        }

        return page.map(userMapper::toResponseDto);
    }

    /**
     * 기관 환자 목록 조회
     *
     * @param id       기관 ID
     * @param keyword  문자열
     * @param pageable page 정보
     * @return Page<Seniors>
     */
    public Page<SeniorResponseDto> getSeniorList(Integer id, String keyword, Pageable pageable, Boolean includeDeleted) {
        log.info("기관 환자 목록 조회 서비스 시작 (활성 환자만)");

        Page<Seniors> page;
        if (keyword == null || keyword.trim().isEmpty()) {
            if (includeDeleted) {
                page = seniorsRepository.findByOrganizationIdAndIsActiveTrue(id, pageable);
            } else {
                page = seniorsRepository.findByOrganizationIdAndIsActiveTrueAndIsDeletedFalse(id, pageable);
            }
        } else {
            if (includeDeleted) {
                page = seniorsRepository.findByOrganizationIdAndNameContainingAndIsActiveTrue(id, keyword, pageable);
            } else {
                page = seniorsRepository.findByOrganizationIdAndNameContainingAndIsActiveTrueAndIsDeletedFalse(id, keyword, pageable);
            }
        }

        return page.map(this::convertToResponseDto);
    }

    /**
     * 기관명 중복 검증
     *
     * @param name 기관명
     */
    private void validateUniqueName(String name) {
        Organizations existing = organizationsRepository.findByName(name);
        if (existing != null) {
            throw new IllegalArgumentException("이미 존재하는 기관명입니다: " + name);
        }
    }

    /**
     * 식사시간 유효성 체크
     *
     * @param mealTime 식사시간
     */
    private void validateMealTimeRange(LocalTime mealTime) {
        // 식사시간 범위 체크 (예: 06:00 ~ 22:00)
        if (mealTime.isBefore(LocalTime.of(5, 0)) || mealTime.isAfter(LocalTime.of(22, 0))) {
            throw new IllegalArgumentException("식사시간은 05:00~22:00 사이여야 합니다: " + mealTime);
        }
    }

    private Integer calculateAge(LocalDate birthDate) {
        if (birthDate == null) return null;
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    private SeniorResponseDto convertToResponseDto(Seniors senior) {
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
}
