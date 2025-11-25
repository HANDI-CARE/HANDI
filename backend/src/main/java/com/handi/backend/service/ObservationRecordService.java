package com.handi.backend.service;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.observation.record.*;
import com.handi.backend.entity.*;
import com.handi.backend.enums.Role;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ObservationRecordService {
    private final DateTimeConverter dateTimeConverter;
    private final ObservationRecordsRepository observationRecordsRepository;
    private final SeniorsRepository seniorsRepository;
    private final SeniorUserRelationsRepository seniorUserRelationsRepository;
    private final MeetingMatchesRepository meetingMatchesRepository;
    private final UsersRepository usersRepository;

    public ObservationRecordResponseFullDto createOne(Integer seniorId, ObservationRecordRequestDto requestDto, Users user) {
        // 환자 정보를 찾을 수 없는 경우
        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId).orElseThrow(() ->
                new NotFoundException("환자를 찾을 수 없습니다."));

        // 해당 사용자가 담당하는 환자가 맞는지 확인
        boolean hasPermission = seniorUserRelationsRepository.existsByUserIdAndSeniorIdAndIsDeletedFalse(user.getId(), seniorId);
        if(!hasPermission) throw new NotFoundException("해당 간호사는 해당 환자에 연관되어 있지 않습니다.");

        //환자 정보가 있는 경우 추가
        ObservationRecords observationRecords = new ObservationRecords();
        observationRecords.setSenior(senior);
        observationRecords.setContent(requestDto.getContent());
        observationRecords.setLevel(requestDto.getLevel());
        observationRecords.setIsDeleted(false);
        observationRecords.setCreatedAt(LocalDateTime.now());
        observationRecords.setUpdatedAt(LocalDateTime.now());

        ObservationRecords observationLog = observationRecordsRepository.save(observationRecords);


        Senior nowSenior = new Senior();
        nowSenior.setId(seniorId);
        nowSenior.setName(senior.getName());
        nowSenior.setGender(senior.getGender());
        nowSenior.setNote(senior.getNote());
        nowSenior.setAge(LocalDate.now().getYear() - senior.getBirthDate().getYear() + 1);


        ObservationRecordResponseFullDto dto = new ObservationRecordResponseFullDto();
        dto.setId(observationLog.getId());
        dto.setSenior(nowSenior);
        dto.setContent(observationLog.getContent());
        dto.setLevel(observationLog.getLevel());
        dto.setCreatedAt(dateTimeConverter.localDateTimeToString(observationLog.getCreatedAt()));
        dto.setUpdatedAt(dateTimeConverter.localDateTimeToString(observationLog.getUpdatedAt()));
        dto.setIsDeleted(observationLog.getIsDeleted());


        Users nurse = findRelatedUser(observationLog.getSenior(), Role.EMPLOYEE);
        Nurse nowNurse = new Nurse();
        nowNurse.setId(nurse.getId());
        nowNurse.setName(nurse.getName());
        nowNurse.setEmail(nurse.getEmail());
        nowNurse.setPhoneNumber(nurse.getPhoneNumber());
        dto.setNurse(nowNurse);

        Users guardian = findRelatedUser(observationLog.getSenior(), Role.GUARDIAN);
        Guardian nowGuardian = new Guardian();
        nowGuardian.setId(guardian.getId());
        nowGuardian.setName(guardian.getName());
        nowGuardian.setEmail(guardian.getEmail());
        nowGuardian.setPhoneNumber(guardian.getPhoneNumber());
        dto.setGuardian(nowGuardian);

        return dto;
    }


    public ObservationRecordResponseSimpleDto updateOne(Integer id, ObservationRecordRequestDto requestDto) {
        ObservationRecords observationRecords = observationRecordsRepository.findById(id).orElseThrow(() ->
                new NotFoundException("해당 관찰일지을 찾을 수 없습니다."));

        // 삭제되었는지 확인
        if (observationRecords.getIsDeleted()) {
            throw new NotFoundException("삭제된 관찰일지 입니다.");
        }

        observationRecords.setLevel(requestDto.getLevel());

        if (requestDto.getContent() != null)
            observationRecords.setContent(requestDto.getContent());

        ObservationRecords now = observationRecordsRepository.save(observationRecords);


        ObservationRecordResponseSimpleDto result = new ObservationRecordResponseSimpleDto();
        result.setId(now.getId());
        result.setLevel(now.getLevel());
        result.setContent(now.getContent());

        return result;

    }

    public void deleteOne(Integer id) {
        ObservationRecords observationRecords = observationRecordsRepository.findById(id).orElseThrow(() ->
                new NotFoundException("해당 관찰일지을 찾을 수 없습니다."));

        observationRecords.setIsDeleted(true);
        observationRecordsRepository.save(observationRecords);
    }


    public ObservationRecordResponseFullDto getOne(Integer id) {
        ObservationRecords observation = observationRecordsRepository.findById(id).orElseThrow(() ->
                new NotFoundException("해당 관찰일지을 찾을 수 없습니다."));

        Seniors seniors = seniorsRepository.findByIdAndIsDeletedFalse(observation.getSenior().getId()).orElseThrow(
                () -> new NotFoundException("해당 환자가 존재하지 않습니다."));

        Senior nowSenior = new Senior();
        nowSenior.setId(seniors.getId());
        nowSenior.setName(seniors.getName());
        nowSenior.setGender(seniors.getGender());
        nowSenior.setNote(seniors.getNote());
        nowSenior.setAge(LocalDate.now().getYear() - seniors.getBirthDate().getYear() + 1);

        ObservationRecordResponseFullDto dto = new ObservationRecordResponseFullDto();
        dto.setId(observation.getId());
        dto.setSenior(nowSenior);
        dto.setContent(observation.getContent());
        dto.setLevel(observation.getLevel());
        dto.setCreatedAt(dateTimeConverter.localDateTimeToString(observation.getCreatedAt()));
        dto.setUpdatedAt(dateTimeConverter.localDateTimeToString(observation.getUpdatedAt()));
        dto.setIsDeleted(observation.getIsDeleted());


        Users nurse = findRelatedUser(observation.getSenior(), Role.EMPLOYEE);
        Nurse nowNurse = new Nurse();
        nowNurse.setId(nurse.getId());
        nowNurse.setName(nurse.getName());
        nowNurse.setEmail(nurse.getEmail());
        nowNurse.setPhoneNumber(nurse.getPhoneNumber());
        dto.setNurse(nowNurse);

        Users guardian = findRelatedUser(observation.getSenior(), Role.GUARDIAN);
        Guardian nowGuardian = new Guardian();
        nowGuardian.setId(guardian.getId());
        nowGuardian.setName(guardian.getName());
        nowGuardian.setEmail(guardian.getEmail());
        nowGuardian.setPhoneNumber(guardian.getPhoneNumber());
        dto.setGuardian(nowGuardian);

        return dto;
    }


    public PageResponseDto<ObservationRecordResponseFullDto> getList(Integer seniorId, Pageable pageable) {
        Page<ObservationRecords> page = observationRecordsRepository.findBySeniorIdAndIsDeletedFalse(seniorId, pageable);

        Seniors seniors = seniorsRepository.findByIdAndIsDeletedFalse(seniorId).orElseThrow(
                () -> new NotFoundException("해당 환자가 존재하지 않습니다."));

        Senior nowSenior = new Senior();
        nowSenior.setId(seniorId);
        nowSenior.setName(seniors.getName());
        nowSenior.setGender(seniors.getGender());
        nowSenior.setNote(seniors.getNote());
        nowSenior.setAge(LocalDate.now().getYear() - seniors.getBirthDate().getYear() + 1);


        List<ObservationRecordResponseFullDto> convertList = page.getContent().stream().map(observationLog -> {
            ObservationRecordResponseFullDto dto = new ObservationRecordResponseFullDto();
            dto.setId(observationLog.getId());
            dto.setSenior(nowSenior);
            dto.setContent(observationLog.getContent());
            dto.setLevel(observationLog.getLevel());
            dto.setCreatedAt(dateTimeConverter.localDateTimeToString(observationLog.getCreatedAt()));
            dto.setUpdatedAt(dateTimeConverter.localDateTimeToString(observationLog.getUpdatedAt()));
            dto.setIsDeleted(observationLog.getIsDeleted());


            Users nurse = findRelatedUser(observationLog.getSenior(), Role.EMPLOYEE);
            Nurse nowNurse = new Nurse();
            nowNurse.setId(nurse.getId());
            nowNurse.setName(nurse.getName());
            nowNurse.setEmail(nurse.getEmail());
            nowNurse.setPhoneNumber(nurse.getPhoneNumber());
            dto.setNurse(nowNurse);

            Users guardian = findRelatedUser(observationLog.getSenior(), Role.GUARDIAN);
            Guardian nowGuardian = new Guardian();
            nowGuardian.setId(guardian.getId());
            nowGuardian.setName(guardian.getName());
            nowGuardian.setEmail(guardian.getEmail());
            nowGuardian.setPhoneNumber(guardian.getPhoneNumber());
            dto.setGuardian(nowGuardian);

            return dto;
        }).toList();

        return PageResponseDto.from("관찰일지 목록 조회 완료", page, convertList);

    }

    private Users findRelatedUser(Seniors senior, Role role) {
        return senior.getSeniorUserRelations().stream()
                .filter(rel -> rel.getRole() == role && !rel.getIsDeleted())
                .map(SeniorUserRelations::getUser)
                .findFirst()
                .orElseThrow(() -> new NotFoundException(
                        role == Role.EMPLOYEE ? "담당 간호사를 찾을 수 없습니다."
                                : "담당 보호자를 찾을 수 없습니다."));
    }


    // 7일 조회
    public List<RecentObservationRecordResponseDto> getRecentList(Users user) {
        List<Integer> seniorIds = seniorUserRelationsRepository.findSeniorIdsByUserId(user.getId());

        if (seniorIds.isEmpty()) {
            log.info("사용자와 연결된 환자가 없습니다. : userId={}", user.getId());
            return new ArrayList<>();
        }

        log.info("연결된 환자 수 : {}", seniorIds.size());

        // 7일전 ~ 현재
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusDays(7);

        log.info("조회 기간 : {} ~ {}", startDate, endDate);

        List<RecentObservationRecordResponseDto> result = new ArrayList<>();
        for(Integer seniorId : seniorIds) {
            Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId).orElse(null);
            if(senior == null) {
                log.info("해당 시니어 ID에 해당하는 환자가 존재하지 않습니다.");
            }

            // 조건에 맞는 일지 조회
            ObservationRecords observationRecords = observationRecordsRepository.findFirstBySeniorAndCreatedAtBetweenAndIsDeletedFalseOrderByLevelAscCreatedAtDesc(senior, startDate, endDate);

            // 환자 dto 넣기
            Senior nowSenior = new Senior();
            nowSenior.setId(senior.getId());
            nowSenior.setName(senior.getName());
            nowSenior.setGender(senior.getGender());
            nowSenior.setNote(senior.getNote());
            nowSenior.setAge(LocalDate.now().getYear() - senior.getBirthDate().getYear() + 1);

            // 간호사 조회
            Users nurse =  findRelatedUser(senior, Role.EMPLOYEE);
            Nurse nowNurse = new Nurse();
            nowNurse.setId(nurse.getId());
            nowNurse.setName(nurse.getName());
            nowNurse.setEmail(nurse.getEmail());
            nowNurse.setPhoneNumber(nurse.getPhoneNumber());

            // 보호자 조회
            Users guardian = findRelatedUser(senior, Role.GUARDIAN);
            Guardian nowGuardian = new Guardian();
            nowGuardian.setId(guardian.getId());
            nowGuardian.setName(guardian.getName());
            nowGuardian.setEmail(guardian.getEmail());
            nowGuardian.setPhoneNumber(guardian.getPhoneNumber());

            // dto 만들기
            RecentObservationRecordResponseDto dto = new  RecentObservationRecordResponseDto();
            dto.setNurse(nowNurse);
            dto.setGuardian(nowGuardian);
            dto.setSenior(nowSenior);
            if(observationRecords != null){
                dto.setId(observationRecords.getId());
                dto.setContent(observationRecords.getContent());
                dto.setLevel(observationRecords.getLevel());
                dto.setCreatedAt(dateTimeConverter.localDateTimeToString(observationRecords.getCreatedAt()));
                dto.setUpdatedAt(dateTimeConverter.localDateTimeToString(observationRecords.getUpdatedAt()));
                dto.setIsDeleted(observationRecords.getIsDeleted());
            }
            // 최근 의사 진료 시간
            MeetingMatches recentMatch = meetingMatchesRepository.findTopBySeniorAndMeetingTypeOrderByMeetingTimeDesc(senior, "withDoctor");
            if (recentMatch != null) dto.setLastHospitalVisit(dateTimeConverter.localDateTimeToString(recentMatch.getMeetingTime()));
            else dto.setLastHospitalVisit(null);
            result.add(dto);
        }

        return result;
    }

    // startDate - endDate 조회
    public PageResponseDto<ObservationRecordResponseFullDto> getListByDate(Integer seniorId, String startDate, String endDate, Pageable pageable) {
        LocalDate start;
        if(startDate != null) start = dateTimeConverter.stringToLocalDate(startDate);
        else start = LocalDate.now().minusYears(100);

        LocalDate end;
        if(endDate != null) end = dateTimeConverter.stringToLocalDate(endDate);
        else end = LocalDate.now().plusYears(100);

        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(23, 59, 59);

        Page<ObservationRecords> page = observationRecordsRepository.findBySeniorIdAndCreatedAtBetweenAndIsDeletedFalse(seniorId, startDateTime, endDateTime, pageable);

        Seniors seniors = seniorsRepository.findByIdAndIsDeletedFalse(seniorId).orElseThrow(
                () -> new NotFoundException("해당 환자가 존재하지 않습니다."));

        Senior nowSenior = new Senior();
        nowSenior.setId(seniorId);
        nowSenior.setName(seniors.getName());
        nowSenior.setGender(seniors.getGender());
        nowSenior.setNote(seniors.getNote());
        nowSenior.setAge(LocalDate.now().getYear() - seniors.getBirthDate().getYear() + 1);

        List<ObservationRecordResponseFullDto> result = page.getContent().stream().map(observation -> {
            ObservationRecordResponseFullDto dto = new ObservationRecordResponseFullDto();
            dto.setId(observation.getId());
            dto.setSenior(nowSenior);
            dto.setContent(observation.getContent());
            dto.setLevel(observation.getLevel());
            dto.setCreatedAt(dateTimeConverter.localDateTimeToString(observation.getCreatedAt()));
            dto.setUpdatedAt(dateTimeConverter.localDateTimeToString(observation.getUpdatedAt()));
            dto.setIsDeleted(observation.getIsDeleted());

            Users nurse = findRelatedUser(observation.getSenior(), Role.EMPLOYEE);
            Nurse nowNurse = new Nurse();
            nowNurse.setId(nurse.getId());
            nowNurse.setName(nurse.getName());
            nowNurse.setEmail(nurse.getEmail());
            nowNurse.setPhoneNumber(nurse.getPhoneNumber());
            dto.setNurse(nowNurse);

            Users guardian = findRelatedUser(observation.getSenior(), Role.GUARDIAN);
            Guardian nowGuardian = new Guardian();
            nowGuardian.setId(guardian.getId());
            nowGuardian.setName(guardian.getName());
            nowGuardian.setEmail(guardian.getEmail());
            nowGuardian.setPhoneNumber(guardian.getPhoneNumber());
            dto.setGuardian(nowGuardian);

            return dto;
        }).toList();

        return PageResponseDto.from("관찰일지 목록 조회 완료", page, result);
    }
}
