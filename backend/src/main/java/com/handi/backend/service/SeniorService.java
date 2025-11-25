package com.handi.backend.service;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.senior.*;
import com.handi.backend.entity.Organizations;
import com.handi.backend.entity.SeniorUserRelations;
import com.handi.backend.entity.Seniors;
import com.handi.backend.entity.Users;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.repository.OrganizationsRepository;
import com.handi.backend.repository.SeniorUserRelationsRepository;
import com.handi.backend.repository.SeniorsRepository;
import com.handi.backend.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeniorService {

    private final DateTimeConverter dateTimeConverter;
    private final SeniorsRepository seniorsRepository;
    private final SeniorUserRelationsRepository seniorUserRelationsRepository;
    private final OrganizationsRepository organizationsRepository;
    private final UsersRepository usersRepository;

    /**
     * 시니어 생성
     */
    @Transactional
    public SeniorResponseDto createSenior(SeniorCreateRequestDto request) {
        log.info("시니어 생성 요청: {}", request.getName());

        // 소속기관 확인
        Organizations organization = organizationsRepository.findById(request.getOrganizationId())
                .orElseThrow(() -> new NotFoundException("소속기관을 찾을 수 없습니다."));

        // Entity 생성
        Seniors senior = new Seniors();
        senior.setOrganization(organization);
        senior.setName(request.getName());
        senior.setBirthDate(request.getBirthDate());
        senior.setGender(request.getGender());
        senior.setAdmissionDate(request.getAdmissionDate());
        senior.setNote(request.getNote());

        // 기본 상태 설정
        senior.setIsActive(true);
        senior.setIsDeleted(false);
        Seniors savedSenior = seniorsRepository.save(senior);
        log.info("시니어 생성 완료: ID={}, 이름={}", savedSenior.getId(), savedSenior.getName());

        return convertToResponseDto(savedSenior);
    }

    /**
     * 시니어 수정
     */
    @Transactional
    public SeniorResponseDto updateSenior(Integer seniorId, SeniorUpdateRequestDto request) {
        log.info("시니어 수정 요청: ID={}", seniorId);

        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId)
                .orElseThrow(() -> new NotFoundException("시니어를 찾을 수 없습니다."));

        // 수정 가능한 필드들 업데이트
        if (request.getName() != null) senior.setName(request.getName());
        if (request.getDischargeDate() != null) senior.setDischargeDate(dateTimeConverter.stringToLocalDate(request.getDischargeDate()));
        if (request.getNote() != null) senior.setNote(request.getNote());
        if (request.getIsActive() != null) senior.setIsActive(request.getIsActive());

        Seniors updatedSenior = seniorsRepository.save(senior);
        log.info("시니어 수정 완료: ID={}, 이름={}", updatedSenior.getId(), updatedSenior.getName());

        return convertToResponseDto(updatedSenior);
    }

    /**
     * 시니어 조회
     */
    public SeniorResponseDto getSenior(Integer seniorId) {
        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId)
                .orElseThrow(() -> new NotFoundException("시니어를 찾을 수 없습니다."));

        return convertToResponseDto(senior);
    }

    /**
     * 시니어 상세 조회 (관계 정보 포함)
     */
    public SeniorDetailResponseDto getSeniorDetail(Integer seniorId) {
        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId)
                .orElseThrow(() -> new NotFoundException("시니어를 찾을 수 없습니다."));

        List<SeniorUserRelations> relations = seniorUserRelationsRepository.findBySeniorIdAndIsDeletedFalse(seniorId);

        return convertToDetailResponseDto(senior, relations);
    }

    /**
     * 시니어 상세 조회 (특정 역할의 관계 정보만 포함)
     */
    public SeniorDetailResponseDto getSeniorDetailByRole(Integer seniorId, com.handi.backend.enums.Role role) {
        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId)
                .orElseThrow(() -> new NotFoundException("시니어를 찾을 수 없습니다."));

        List<SeniorUserRelations> relations = seniorUserRelationsRepository.findBySeniorIdAndRoleAndIsDeletedFalse(seniorId, role);

        return convertToDetailResponseDto(senior, relations);
    }

    /**
     * 시니어 목록 조회 (기관별)
     */
    public PageResponseDto<SeniorResponseDto> getSeniorsByOrganization(Integer organizationId, Pageable pageable) {
        Page<Seniors> seniorPage = seniorsRepository.findByOrganizationIdAndIsActiveTrueAndIsDeletedFalse(organizationId, pageable);
        
        List<SeniorResponseDto> seniors = seniorPage.getContent().stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());

        return PageResponseDto.from(seniorPage, seniors);
    }

    /**
     * 시니어 검색
     */
    public PageResponseDto<SeniorResponseDto> searchSeniors(Integer organizationId, String name, 
                                                           Boolean isActive, Pageable pageable) {
        Page<Seniors> seniorPage = seniorsRepository.findBySearchCriteria(organizationId, name, isActive, pageable);
        
        List<SeniorResponseDto> seniors = seniorPage.getContent().stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());

        return PageResponseDto.from(seniorPage, seniors);
    }

    /**
     * 사용자 관련 시니어 목록 조회
     */
    public PageResponseDto<SeniorResponseDto> getSeniorsByUser(Integer userId, Pageable pageable) {
        Page<Seniors> seniorPage = seniorsRepository.findByRelatedUserId(userId, pageable);
        
        List<SeniorResponseDto> seniors = seniorPage.getContent().stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());

        return PageResponseDto.from(seniorPage, seniors);
    }

    /**
     * 시니어 삭제 (soft delete)
     */
    @Transactional
    public void deleteSenior(Integer seniorId) {
        log.info("시니어 삭제 요청: ID={}", seniorId);

        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId)
                .orElseThrow(() -> new NotFoundException("시니어를 찾을 수 없습니다."));

        senior.setIsActive(false);
        senior.setDischargeDate(LocalDate.now());
        senior.setIsDeleted(true);
        seniorsRepository.save(senior);

        log.info("시니어 삭제 완료: ID={}", seniorId);
    }

    /**
     * 시니어-직원 관계 생성
     */
    @Transactional
    public void createSeniorEmployeeRelation(Integer seniorId, SeniorEmployeeRelationRequestDto request) {
        log.info("시니어-직원 관계 생성: seniorId={}, employeeIds={}", 
                seniorId, request.getEmployeeIds());

        createSeniorUserRelations(seniorId, request.getEmployeeIds(), com.handi.backend.enums.Role.EMPLOYEE);
    }

    /**
     * 시니어-보호자 관계 생성
     */
    @Transactional
    public void createSeniorGuardianRelation(Integer seniorId, SeniorGuardianRelationRequestDto request) {
        log.info("시니어-보호자 관계 생성: seniorId={}, guardianIds={}", 
                seniorId, request.getGuardianIds());

        createSeniorUserRelations(seniorId, request.getGuardianIds(), com.handi.backend.enums.Role.GUARDIAN);
    }

    /**
     * 시니어-사용자 관계 생성 공통 로직
     */
    private void createSeniorUserRelations(Integer seniorId, List<Integer> userIds, com.handi.backend.enums.Role role) {
        // 시니어 존재 확인
        Seniors senior = seniorsRepository.findById(seniorId)
                .orElseThrow(() -> new NotFoundException("시니어를 찾을 수 없습니다."));

        // 각 사용자에 대해 관계 생성
        for (Integer userId : userIds) {
            // 사용자 존재 확인
            Users user = usersRepository.findById(userId)
                    .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + userId));

            // 이미 관계가 있는지 확인
            if (seniorUserRelationsRepository.existsByUserIdAndSeniorIdAndIsDeletedFalse(userId, seniorId)) {
                log.warn("이미 관계가 존재합니다: seniorId={}, userId={}, role={}", seniorId, userId, role);
                continue; // 이미 있는 관계는 스킵
            }

            // 관계 생성
            SeniorUserRelations relation = new SeniorUserRelations(user, senior, role);
            seniorUserRelationsRepository.save(relation);
            
            log.info("시니어-사용자 관계 생성 완료: seniorId={}, userId={}, role={}", seniorId, userId, role);
        }
    }

    /**
     * 시니어-사용자 관계 삭제
     */
    @Transactional
    public void deleteSeniorUserRelation(Integer seniorId, Integer userId) {
        log.info("시니어-사용자 관계 삭제: seniorId={}, userId={}", seniorId, userId);

        SeniorUserRelations relation = seniorUserRelationsRepository.findByUserIdAndSeniorIdAndIsDeletedFalse(userId, seniorId)
                .orElseThrow(() -> new NotFoundException("관계를 찾을 수 없습니다."));
        relation.setIsDeleted(true);
        seniorUserRelationsRepository.save(relation);
        log.info("시니어-사용자 관계 삭제 완료: seniorId={}, userId={}", seniorId, userId);
    }

    // DTO 변환 메서드들
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

    private SeniorDetailResponseDto convertToDetailResponseDto(Seniors senior, List<SeniorUserRelations> relations) {
        List<SeniorDetailResponseDto.RelatedUserDto> relatedUsers = relations.stream()
                .map(relation -> SeniorDetailResponseDto.RelatedUserDto.builder()
                        .userId(relation.getUser().getId())
                        .userName(relation.getUser().getName())
                        .userEmail(relation.getUser().getEmail())
                        .phoneNumber(relation.getUser().getPhoneNumber())
                        .role(relation.getRole())
                        .profileImageUrl(relation.getUser().getProfileImageUrl())
                        .relationCreatedAt(dateTimeConverter.localDateTimeToString(relation.getCreatedAt()))
                        .build())
                .collect(Collectors.toList());

        return SeniorDetailResponseDto.builder()
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
                .relatedUsers(relatedUsers)
                .build();
    }

    private Integer calculateAge(LocalDate birthDate) {
        if (birthDate == null) return null;
        return Period.between(birthDate, LocalDate.now()).getYears();
    }


    public SeniorMemoDto getSeniorMemoById(Integer seniorId) {
        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId).orElseThrow(() -> new NotFoundException("해당 시니어를 찾을 수 없습니다."));
        SeniorMemoDto result = new SeniorMemoDto();
        result.setSeniorId(senior.getId());
        result.setNote(senior.getNote());
        return result;
    }


    public SeniorMemoDto updateSeniorMemoById(Integer seniorId, SeniorMemoRequestDto seniorMemoDto) {
        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId).orElseThrow(() -> new NotFoundException("해당 시니어를 찾을 수 없습니다."));
        senior.setNote(seniorMemoDto.getNote());
        seniorsRepository.save(senior);

        Seniors nowSenior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId).orElseThrow(() -> new NotFoundException("해당 시니어를 찾을 수 없습니다."));

        SeniorMemoDto result = new SeniorMemoDto();
        result.setSeniorId(nowSenior.getId());
        result.setNote(nowSenior.getNote());

        return result;
    }


}