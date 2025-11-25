package com.handi.backend.service;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.admin.AdminUserCreateRequestDto;
import com.handi.backend.dto.admin.AdminUserResponseDto;
import com.handi.backend.dto.admin.AdminUserUpdateRequestDto;
import com.handi.backend.dto.organization.OrganizationResponseSimpleDto;
import com.handi.backend.dto.admin.AdminOrganizationResponseDto;
import com.handi.backend.entity.Organizations;
import com.handi.backend.entity.Users;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.mapper.UserMapper;
import com.handi.backend.repository.OrganizationsRepository;
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
public class AdminService {

    private final UsersRepository usersRepository;
    private final UserMapper userMapper;
    private final OrganizationsRepository organizationsRepository;
    private final DateTimeConverter dateTimeConverter;

    /**
     * 관리자가 사용자를 생성
     *
     * @param requestDto 사용자 생성 요청 DTO
     * @return 생성된 사용자
     */
    public AdminUserResponseDto createUser(AdminUserCreateRequestDto requestDto) {
        log.info("관리자 사용자 생성 서비스 시작: 이메일={}", requestDto.getEmail());

        // 이메일 중복 검증
        if (usersRepository.existsByEmail(requestDto.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + requestDto.getEmail());
        }

        // 휴대폰 번호 중복 검증
        if (requestDto.getPhoneNumber() != null && usersRepository.existsByPhoneNumber(requestDto.getPhoneNumber())) {
            throw new IllegalArgumentException("이미 존재하는 휴대폰 번호입니다: " + requestDto.getPhoneNumber());
        }

        // DTO -> Entity 변환
        Users user = userMapper.toEntity(requestDto);

        // 데이터베이스에 저장
        Users savedUser = usersRepository.save(user);

        log.info("관리자 사용자 생성 완료: ID={}, 이메일={}", savedUser.getId(), savedUser.getEmail());
        return userMapper.toAdminResponseDto(savedUser);
    }

    /**
     * 관리자가 전체 사용자 목록 조회 (삭제된 사용자 포함 가능)
     *
     * @param keyword        검색 키워드
     * @param pageable       페이지 정보
     * @param includeDeleted 삭제된 사용자 포함 여부
     * @return 사용자 목록
     */
    public Page<AdminUserResponseDto> getAllUsers(String keyword, Pageable pageable, boolean includeDeleted) {
        log.info("관리자 전체 사용자 목록 조회 서비스 시작: includeDeleted={}", includeDeleted);

        Page<Users> usersPage;

        if (includeDeleted) {
            // 삭제된 사용자도 포함하여 조회
            if (keyword == null || keyword.trim().isEmpty()) {
                usersPage = usersRepository.findAll(pageable);
            } else {
                usersPage = usersRepository.findByNameContainingOrEmailContaining(keyword, keyword, pageable);
            }
        } else {
            // 삭제되지 않은 사용자만 조회
            if (keyword == null || keyword.trim().isEmpty()) {
                usersPage = usersRepository.findByIsDeletedFalse(pageable);
            } else {
                usersPage = usersRepository.findByNameContainingOrEmailContainingAndIsDeletedFalse(keyword, keyword, pageable);
            }
        }

        return usersPage.map(userMapper::toAdminResponseDto);
    }

    /**
     * 관리자가 특정 사용자 상세 조회
     *
     * @param id 사용자 ID
     * @return 조회된 사용자
     */
    public AdminUserResponseDto getUserById(Integer id) {
        log.info("관리자 사용자 상세 조회 서비스 시작: ID={}", id);
        Users user = usersRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + id));
        log.info("관리자 사용자 상세 조회 완료: ID={}, 이메일={}", id, user.getEmail());
        return userMapper.toAdminResponseDto(user);
    }

    /**
     * 관리자가 사용자 정보 수정
     *
     * @param id         사용자 ID
     * @param requestDto 사용자 수정 요청 DTO
     * @return 수정된 사용자
     */
    public AdminUserResponseDto updateUser(Integer id, AdminUserUpdateRequestDto requestDto) {
//        log.info("관리자 사용자 수정 서비스 시작: ID={}, 이메일={}", id, requestDto.getEmail());

        // 사용자 조회
        Users user = usersRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + id));

        // 이메일 중복 검증 (다른 사용자와 중복되는 경우만)
        if (!user.getEmail().equals(requestDto.getEmail()) && usersRepository.existsByEmail(requestDto.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + requestDto.getEmail());
        }

        // 휴대폰 번호 중복 검증
        if (requestDto.getPhoneNumber() != null && !user.getPhoneNumber().equals(requestDto.getPhoneNumber()) && usersRepository.existsByPhoneNumber(requestDto.getPhoneNumber())) {
            throw new IllegalArgumentException("이미 존재하는 휴대폰 번호입니다: " + requestDto.getPhoneNumber());
        }

        // 엔티티 업데이트
        userMapper.updateEntity(user, requestDto);

        // 데이터베이스에 수정
        Users savedUser = usersRepository.save(user);

        log.info("관리자 사용자 수정 완료: ID={}, 이메일={}", savedUser.getId(), savedUser.getEmail());

        return userMapper.toAdminResponseDto(savedUser);
    }

    /**
     * 관리자가 사용자 삭제
     *
     * @param id 사용자 ID
     */
    public void deleteUser(Integer id) {
        log.info("관리자 사용자 삭제 서비스 시작: id={}", id);

        // 삭제 전 존재 여부 확인
        Users user = usersRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + id));

        // 논리 삭제 (실제로는 isDeleted 플래그를 true로 설정)
        user.setIsDeleted(true);
        usersRepository.save(user);

        log.info("관리자 사용자 삭제 완료: ID={}, 이메일={}", user.getId(), user.getEmail());
    }


    /**
     * 관리자가 특정 기관의 사용자 목록 조회
     *
     * @param organizationId 기관 ID
     * @param keyword        검색 키워드
     * @param pageable       페이지 정보
     * @return 기관별 사용자 목록
     */
    public Page<AdminUserResponseDto> getUsersByOrganization(Integer organizationId, String keyword, Pageable pageable) {
        log.info("관리자 기관별 사용자 목록 조회 서비스 시작: organizationId={}", organizationId);

        Page<Users> usersPage;
        if (keyword == null || keyword.trim().isEmpty()) {
            usersPage = usersRepository.findByOrganizationIdAndIsDeletedFalse(organizationId, pageable);
        } else {
            usersPage = usersRepository.findByOrganizationIdAndNameContainingAndIsDeletedFalse(organizationId, keyword, pageable);
        }

        return usersPage.map(userMapper::toAdminResponseDto);
    }

    /**
     * 관리자가 삭제된 사용자 복구
     *
     * @param id 사용자 ID
     * @return 복구된 사용자
     */
    public AdminUserResponseDto restoreUser(Integer id) {
        log.info("관리자 사용자 복구 서비스 시작: ID={}", id);

        Users user = usersRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + id));

        if (!Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new IllegalArgumentException("삭제되지 않은 사용자입니다: " + id);
        }

        user.setIsDeleted(false);
        Users savedUser = usersRepository.save(user);

        log.info("관리자 사용자 복구 완료: ID={}, 이메일={}", savedUser.getId(), savedUser.getEmail());

        return userMapper.toAdminResponseDto(savedUser);
    }

    public AdminOrganizationResponseDto getOrganizations() {
        List<Organizations> organizations = organizationsRepository.findAll();
        List<OrganizationResponseSimpleDto> simpleOrgs = organizations.stream()
                .map(org -> new OrganizationResponseSimpleDto(org.getId(), org.getName(), dateTimeConverter.localDateTimeToString(org.getCreatedAt()),
                        dateTimeConverter.localDateTimeToString(org.getUpdatedAt())))
                .toList();
        AdminOrganizationResponseDto dto = new AdminOrganizationResponseDto();
        dto.setOrganizations(simpleOrgs);
        return dto;
    }
}
