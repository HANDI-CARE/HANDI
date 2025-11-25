package com.handi.backend.service;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.meeting.*;
import com.handi.backend.dto.observation.record.Guardian;
import com.handi.backend.dto.observation.record.Nurse;
import com.handi.backend.dto.observation.record.Senior;
import com.handi.backend.entity.MeetingMatches;
import com.handi.backend.entity.Seniors;
import com.handi.backend.entity.Users;
import com.handi.backend.enums.ConsultationStatus;
import com.handi.backend.enums.Role;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.repository.MeetingMatchesRepository;
import com.handi.backend.repository.SeniorsRepository;
import com.handi.backend.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeetingMatchesService {
    private final DateTimeConverter dateTimeConverter;
    private final MeetingMatchesRepository meetingMatchesRepository;
    private final UsersRepository usersRepository;
    private final SeniorsRepository seniorsRepository;

    public MeetingMatchesResponseDto findById(Integer id, Users user) {
        MeetingMatches meetingMatches = meetingMatchesRepository.findById(id).orElseThrow(
                () -> new NotFoundException("해당 상담 정보가 없습니다."));

        boolean hasPermission = meetingMatches.getEmployee().getId().equals(user.getId()) ||
                meetingMatches.getGuardian().getId().equals(user.getId());

        if (!hasPermission) {
            throw new NotFoundException("해당 상담에 대한 접근 권한이 없습니다.");
        }

        Seniors nowSeniors = seniorsRepository.findById(meetingMatches.getSenior().getId()).orElseThrow(
                () -> new NotFoundException("해당 환자가 없습니다."));
        Users nowGuardian = usersRepository.findById(meetingMatches.getGuardian().getId()).orElseThrow(
                () -> new NotFoundException("해당 보호자가 없습니다."));
        Users nowNurse = usersRepository.findById(meetingMatches.getEmployee().getId()).orElseThrow(
                () -> new NotFoundException("해당 간호사가 없습니다."));

        Senior senior = new Senior();
        senior.setId(nowSeniors.getId());
        senior.setName(nowSeniors.getName());
        senior.setGender(nowSeniors.getGender());
        senior.setNote(nowSeniors.getNote());
        senior.setAge(LocalDateTime.now().getYear() - nowSeniors.getBirthDate().getYear() + 1);

        Nurse nurse = new Nurse();
        nurse.setId(nowNurse.getId());
        nurse.setName(nowNurse.getName());
        nurse.setEmail(nowNurse.getEmail());
        nurse.setPhoneNumber(nowNurse.getPhoneNumber());

        Guardian guardian = new Guardian();
        guardian.setId(nowGuardian.getId());
        guardian.setName(nowGuardian.getName());
        guardian.setEmail(nowGuardian.getEmail());
        guardian.setPhoneNumber(nowGuardian.getPhoneNumber());

        MeetingMatchesResponseDto dto = new MeetingMatchesResponseDto();
        dto.setId(meetingMatches.getId());
        dto.setNurse(nurse);
        dto.setGuardian(guardian);
        dto.setSenior(senior);
        dto.setMeetingTime(dateTimeConverter.localDateTimeToString(meetingMatches.getMeetingTime()));
        dto.setStatus(meetingMatches.getStatus().toString());
        dto.setTitle(meetingMatches.getTitle());
        dto.setMeetingType(meetingMatches.getMeetingType());
        dto.setContent(meetingMatches.getContent());
        dto.setClassification(meetingMatches.getClassification());
        dto.setHospitalName(meetingMatches.getHospitalName());
        dto.setDoctorName(meetingMatches.getDoctorName());
        dto.setStartedAt(dateTimeConverter.localDateTimeToString(meetingMatches.getStartedAt()));
        dto.setEndedAt(dateTimeConverter.localDateTimeToString(meetingMatches.getEndedAt()));

        return dto;
    }

    public MeetingMatchesResponseDto updateById(Integer id, MeetingUpdateRequestDto requestDto) {
        MeetingMatches mm = meetingMatchesRepository.findById(id).orElseThrow(
                () -> new NotFoundException("해당 상담 정보가 없습니다."));

        if(requestDto.getTitle() != null ) mm.setTitle(requestDto.getTitle());
        if(requestDto.getContent() != null ) mm.setContent(requestDto.getContent());
        if(requestDto.getClassification() != null ) mm.setClassification(requestDto.getClassification());
        if(requestDto.getHospitalName() != null ) mm.setHospitalName(requestDto.getHospitalName());
        if(requestDto.getDoctorName() != null ) mm.setDoctorName(requestDto.getDoctorName());

        mm.setUpdatedAt(LocalDateTime.now());

        MeetingMatches meetingMatches = meetingMatchesRepository.save(mm);

        Seniors nowSeniors = seniorsRepository.findById(meetingMatches.getSenior().getId()).orElseThrow(
                () -> new NotFoundException("해당 환자가 없습니다."));
        Users nowGuardian = usersRepository.findById(meetingMatches.getGuardian().getId()).orElseThrow(
                () -> new NotFoundException("해당 보호자가 없습니다."));
        Users nowNurse = usersRepository.findById(meetingMatches.getEmployee().getId()).orElseThrow(
                () -> new NotFoundException("해당 간호사가 없습니다."));

        Senior senior = new Senior();
        senior.setId(nowSeniors.getId());
        senior.setName(nowSeniors.getName());
        senior.setGender(nowSeniors.getGender());
        senior.setNote(nowSeniors.getNote());
        senior.setAge(LocalDateTime.now().getYear() - nowSeniors.getBirthDate().getYear() + 1);

        Nurse nurse = new Nurse();
        nurse.setId(nowNurse.getId());
        nurse.setName(nowNurse.getName());
        nurse.setEmail(nowNurse.getEmail());
        nurse.setPhoneNumber(nowNurse.getPhoneNumber());

        Guardian guardian = new Guardian();
        guardian.setId(nowGuardian.getId());
        guardian.setName(nowGuardian.getName());
        guardian.setEmail(nowGuardian.getEmail());
        guardian.setPhoneNumber(nowGuardian.getPhoneNumber());

        MeetingMatchesResponseDto dto = new MeetingMatchesResponseDto();
        dto.setId(meetingMatches.getId());
        dto.setNurse(nurse);
        dto.setGuardian(guardian);
        dto.setSenior(senior);
        dto.setMeetingTime(dateTimeConverter.localDateTimeToString(meetingMatches.getMeetingTime()));
        dto.setStatus(meetingMatches.getStatus().toString());
        dto.setTitle(meetingMatches.getTitle());
        dto.setMeetingType(meetingMatches.getMeetingType());
        dto.setContent(meetingMatches.getContent());
        dto.setClassification(meetingMatches.getClassification());
        dto.setHospitalName(meetingMatches.getHospitalName());
        dto.setDoctorName(meetingMatches.getDoctorName());
        dto.setStartedAt(dateTimeConverter.localDateTimeToString(meetingMatches.getStartedAt()));
        dto.setEndedAt(dateTimeConverter.localDateTimeToString(meetingMatches.getEndedAt()));

        return dto;

    }

    public MeetingMatchesStatusDto updateStatusById(Integer id, MeetingMatchesStatusDto requestDto) {
        MeetingMatches meetingMatches = meetingMatchesRepository.findById(id).orElseThrow(
                ()-> new NotFoundException("해당 상담 정보가 없습니다."));

        meetingMatches.setStatus(requestDto.getStatus());
        meetingMatches.setUpdatedAt(LocalDateTime.now());
        MeetingMatches mm = meetingMatchesRepository.save(meetingMatches);

        MeetingMatchesStatusDto dto = new MeetingMatchesStatusDto();
        dto.setId(mm.getId());
        dto.setStatus(mm.getStatus());
        return dto;
    }

    public MeetingMatchesResponseDto createMeetingMatches(MeetingMatchesCreateRequestDto requestDto) {
        Users nowNurse = usersRepository.findById(requestDto.getEmployeeId()).orElseThrow(
                () -> new NotFoundException("해당 간호사가 존재하지 않습니다."));

        Users nowGuardian = usersRepository.findById(requestDto.getGuardianId()).orElseThrow(
                () -> new NotFoundException("해당 보호자가 존재하지 않습니다."));

        Seniors nowSeniors = seniorsRepository.findById(requestDto.getSeniorId()).orElseThrow(
                () -> new NotFoundException("해당 환자가 존재하지 않습니다."));

        LocalDateTime meetingTime = dateTimeConverter.stringToLocalDateTime(requestDto.getMeetingTime());

        // 이미 상담이 있는지 확인
        MeetingMatches existMeeting = meetingMatchesRepository.findByEmployeeAndMeetingTime(nowNurse, meetingTime);
        if(existMeeting != null) {
            throw new IllegalArgumentException("해당 간호사는 해당 날짜에 이미 상담이 있습니다");
        }

        MeetingMatches NewmeetingMatches = new MeetingMatches();
        NewmeetingMatches.setEmployee(nowNurse);
        NewmeetingMatches.setGuardian(nowGuardian);
        NewmeetingMatches.setSenior(nowSeniors);
        NewmeetingMatches.setMeetingTime(meetingTime);
        NewmeetingMatches.setTitle(requestDto.getTitle());
        NewmeetingMatches.setMeetingType(requestDto.getMeetingType());
        NewmeetingMatches.setCreatedAt(LocalDateTime.now());
        NewmeetingMatches.setStatus(ConsultationStatus.CONDUCTED);
        NewmeetingMatches.setUpdatedAt(LocalDateTime.now());
        NewmeetingMatches.setStartedAt(meetingTime.minusMinutes(20));
        NewmeetingMatches.setEndedAt(meetingTime.plusMinutes(40));

        MeetingMatches meetingMatches = meetingMatchesRepository.save(NewmeetingMatches);


        Senior senior = new Senior();
        senior.setId(nowSeniors.getId());
        senior.setName(nowSeniors.getName());
        senior.setGender(nowSeniors.getGender());
        senior.setNote(nowSeniors.getNote());
        senior.setAge(LocalDateTime.now().getYear() - nowSeniors.getBirthDate().getYear() + 1);

        Nurse nurse = new Nurse();
        nurse.setId(nowNurse.getId());
        nurse.setName(nowNurse.getName());
        nurse.setEmail(nowNurse.getEmail());
        nurse.setPhoneNumber(nowNurse.getPhoneNumber());

        Guardian guardian = new Guardian();
        guardian.setId(nowGuardian.getId());
        guardian.setName(nowGuardian.getName());
        guardian.setEmail(nowGuardian.getEmail());
        guardian.setPhoneNumber(nowGuardian.getPhoneNumber());

        MeetingMatchesResponseDto dto = new MeetingMatchesResponseDto();
        dto.setId(meetingMatches.getId());
        dto.setNurse(nurse);
        dto.setGuardian(guardian);
        dto.setSenior(senior);
        dto.setMeetingTime(dateTimeConverter.localDateTimeToString(meetingMatches.getMeetingTime()));
        dto.setStatus(meetingMatches.getStatus().toString());
        dto.setTitle(meetingMatches.getTitle());
        dto.setMeetingType(meetingMatches.getMeetingType());
        dto.setContent(meetingMatches.getContent());
        dto.setClassification(meetingMatches.getClassification());
        dto.setHospitalName(meetingMatches.getHospitalName());
        dto.setDoctorName(meetingMatches.getDoctorName());
        dto.setStartedAt(dateTimeConverter.localDateTimeToString(meetingMatches.getStartedAt()));
        dto.setEndedAt(dateTimeConverter.localDateTimeToString(meetingMatches.getEndedAt()));

        return dto;
    }

    public void updateClassificationById(Integer id, UpdateMeetingMatchesDoctorRequestDto requestDto) {
        MeetingMatches meetingMatches = meetingMatchesRepository.findById(id).orElseThrow(
                ()->new NotFoundException("해당 상담이 존재하지 않습니다."));
        meetingMatches.setClassification(requestDto.getClassification());
        meetingMatches.setHospitalName(requestDto.getHospitalName());
        meetingMatches.setDoctorName(requestDto.getDoctorName());
        meetingMatchesRepository.save(meetingMatches);
    }

    public PageResponseDto<MeetingMatchesResponseDto> findByMeetingType(Users user, String meetingType, Pageable pageable, String startDate, String endDate) {
        LocalDateTime start;
        LocalDate startLocalDate = dateTimeConverter.stringToLocalDate(startDate);
        if(startLocalDate != null) start = startLocalDate.atStartOfDay();
        else start = LocalDateTime.now().minusYears(100);

        LocalDateTime end;
        LocalDate endLocalDate = dateTimeConverter.stringToLocalDate(endDate);
        if(endLocalDate != null) end = endLocalDate.atTime(23,59,59);
        else end = LocalDateTime.now().plusYears(100);

        Page<MeetingMatches> page;
        if(user.getRole().equals(Role.EMPLOYEE)) page = meetingMatchesRepository.findByEmployeeAndMeetingTypeAndMeetingTimeBetweenOrderByMeetingTimeAsc(user, meetingType, start, end, pageable);
        else if(user.getRole().equals(Role.GUARDIAN)) page = meetingMatchesRepository.findByGuardianAndMeetingTypeAndMeetingTimeBetweenOrderByMeetingTimeAsc(user,meetingType, start, end, pageable);
        else throw new IllegalArgumentException("지원되지 않는 역할입니다.");

        List<MeetingMatchesResponseDto> dtoList = page.getContent().stream().map(meetingMatches -> {
            Users nowNurse = meetingMatches.getEmployee();
            Users nowGuardian = meetingMatches.getGuardian();
            Seniors nowSeniors = meetingMatches.getSenior();

            Senior senior = new Senior();
            senior.setId(nowSeniors.getId());
            senior.setName(nowSeniors.getName());
            senior.setGender(nowSeniors.getGender());
            senior.setNote(nowSeniors.getNote());
            senior.setAge(LocalDateTime.now().getYear() - nowSeniors.getBirthDate().getYear() + 1);

            Nurse nurse = new Nurse();
            nurse.setId(nowNurse.getId());
            nurse.setName(nowNurse.getName());
            nurse.setEmail(nowNurse.getEmail());
            nurse.setPhoneNumber(nowNurse.getPhoneNumber());

            Guardian guardian = new Guardian();
            guardian.setId(nowGuardian.getId());
            guardian.setName(nowGuardian.getName());
            guardian.setEmail(nowGuardian.getEmail());
            guardian.setPhoneNumber(nowGuardian.getPhoneNumber());

            MeetingMatchesResponseDto dto = new MeetingMatchesResponseDto();
            dto.setId(meetingMatches.getId());
            dto.setNurse(nurse);
            dto.setGuardian(guardian);
            dto.setSenior(senior);
            dto.setMeetingTime(dateTimeConverter.localDateTimeToString(meetingMatches.getMeetingTime()));
            dto.setStatus(meetingMatches.getStatus().toString());
            dto.setTitle(meetingMatches.getTitle());
            dto.setMeetingType(meetingMatches.getMeetingType());
            dto.setContent(meetingMatches.getContent());
            dto.setClassification(meetingMatches.getClassification());
            dto.setHospitalName(meetingMatches.getHospitalName());
            dto.setDoctorName(meetingMatches.getDoctorName());
            dto.setStartedAt(dateTimeConverter.localDateTimeToString(meetingMatches.getStartedAt()));
            dto.setEndedAt(dateTimeConverter.localDateTimeToString(meetingMatches.getEndedAt()));

            return dto;
        }).toList();

        return PageResponseDto.from("상담 목록을 성공적으로 조회했습니다.", page, dtoList);
    }


}
