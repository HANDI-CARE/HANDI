package com.handi.backend.service;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.ai.drug.DrugSummaryRequest;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.medicationSchedules.CreateMedicationSchedulesRequestDto;
import com.handi.backend.dto.medicationSchedules.UpdateMedicationSchedulesRequestDto;
import com.handi.backend.dto.medicationSchedules.MedicationSchedulesResponseDto;
import com.handi.backend.entity.MedicationSchedules;
import com.handi.backend.entity.Seniors;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.repository.MedicationSchedulesRepository;
import com.handi.backend.repository.SeniorsRepository;
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
public class MedicationSchedulesService {
    private final DateTimeConverter dateTimeConverter;
    private final MedicationsService medicationsService;
    private final MedicationSchedulesRepository medicationSchedulesRepository;
    private final SeniorsRepository seniorsRepository;
    private final RabbitMQService rabbitMQService;

    public List<MedicationSchedulesResponseDto> findBySeniorId(Integer seniorId) {
        Seniors senior =  seniorsRepository.findByIdAndIsDeletedFalse(seniorId).orElseThrow(
                () -> new NotFoundException("해당 환자를 찾을 수 없습니다."));

        List<MedicationSchedules> medList = medicationSchedulesRepository.findBySenior(senior);

        if (medList == null || medList.isEmpty()) {
            throw new NotFoundException("해당 환자의 투약 스케줄이 없습니다.");
        }

        List<MedicationSchedulesResponseDto> result = new ArrayList<>();
        for (MedicationSchedules med : medList) {
            MedicationSchedulesResponseDto dto = new MedicationSchedulesResponseDto();
            dto.setId(med.getId());
            dto.setSeniorId(senior.getId());
            dto.setSeniorName(senior.getName());
            dto.setMedicationName(med.getMedicationName());
            dto.setStartDate(dateTimeConverter.localDateToString(med.getMedicationStartdate()));
            dto.setEndDate(dateTimeConverter.localDateToString(med.getMedicationEnddate()));
            dto.setDescription(med.getDescription());
            dto.setMedicationTimes(med.getMedicationTime());
            dto.setCreatedAt(dateTimeConverter.localDateTimeToString(med.getCreatedAt()));
            dto.setUpdatedAt(dateTimeConverter.localDateTimeToString(med.getUpdatedAt()));

            result.add(dto);
        }

        return result;
    }

    // 스케줄 생성
    // 이때 투약 내역을 미리 만들어둔다
    public MedicationSchedulesResponseDto createBySeniorId(Integer seniorId, CreateMedicationSchedulesRequestDto requestDto) {
        Seniors senior =  seniorsRepository.findByIdAndIsDeletedFalse(seniorId).orElseThrow(
                () -> new NotFoundException("해당 환자를 찾을 수 없습니다."));

        try {
            requestDto.parseFromData();
        } catch (Exception e) {
            log.error("JSON 파싱 오류: {}", e.getMessage());
            throw new IllegalArgumentException("잘못된 JSON 형식입니다: " + e.getMessage());
        }

        MedicationSchedules medicationSchedules = new MedicationSchedules();
        medicationSchedules.setSenior(senior);
        medicationSchedules.setMedicationName(requestDto.getMedicationName());
        medicationSchedules.setMedicationStartdate(dateTimeConverter.stringToLocalDate(requestDto.getStartDate()));
        medicationSchedules.setMedicationEnddate(dateTimeConverter.stringToLocalDate(requestDto.getEndDate()));
        medicationSchedules.setCreatedAt(LocalDateTime.now());
        medicationSchedules.setDescription(requestDto.getDescription());
        medicationSchedules.setMedicationTime(requestDto.getMedicationTime());
        MedicationSchedules med = medicationSchedulesRepository.save(medicationSchedules);


        // 각 스케줄 마다 투약일정 미리 만들기
        medicationsService.createBySchedulesId(med.getId(), requestDto);


        MedicationSchedulesResponseDto dto = new MedicationSchedulesResponseDto();
        dto.setId(med.getId());
        dto.setSeniorId(senior.getId());
        dto.setSeniorName(senior.getName());
        dto.setMedicationName(med.getMedicationName());
        dto.setStartDate(dateTimeConverter.localDateToString(med.getMedicationStartdate()));
        dto.setEndDate(dateTimeConverter.localDateToString(med.getMedicationEnddate()));
        dto.setDescription(med.getDescription());
        dto.setMedicationTimes(med.getMedicationTime());
        dto.setCreatedAt(dateTimeConverter.localDateTimeToString(med.getCreatedAt()));
        dto.setUpdatedAt(dateTimeConverter.localDateTimeToString(med.getUpdatedAt()));


        // AI 한테 보내기
        DrugSummaryRequest drugInfoList = new DrugSummaryRequest();
        drugInfoList.setId(med.getId());
        drugInfoList.setDrug_summary(requestDto.getDrug_summary());
        drugInfoList.setNote(senior.getNote());
        rabbitMQService.sendDrugSummaryRequest(drugInfoList);

        log.info("RabbitMQ에 의약품 분석 정보 생성 요청 전송 : " + drugInfoList);


        return dto;
    }

    public MedicationSchedulesResponseDto updateBySeniorId(Integer id, UpdateMedicationSchedulesRequestDto requestDto) {
        MedicationSchedules med = medicationSchedulesRepository.findById(id).orElseThrow(
                () -> new NotFoundException("해당 일정을 찾을 수 없습니다."));

        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(med.getSenior().getId()).orElseThrow(
                () -> new NotFoundException("해당 환자를 찾을 수 없습니다.")
        );

        if (requestDto.getMedicationName() != null) {
            med.setMedicationName(requestDto.getMedicationName());
        }
        if (requestDto.getDescription() != null) {
            med.setDescription(requestDto.getDescription());
        }

        medicationSchedulesRepository.save(med);


        MedicationSchedulesResponseDto dto = new MedicationSchedulesResponseDto();
        dto.setId(med.getId());
        dto.setSeniorId(senior.getId());
        dto.setSeniorName(senior.getName());
        dto.setMedicationName(med.getMedicationName());
        dto.setStartDate(dateTimeConverter.localDateToString(med.getMedicationStartdate()));
        dto.setEndDate(dateTimeConverter.localDateToString(med.getMedicationEnddate()));
        dto.setDescription(med.getDescription());
        dto.setMedicationTimes(med.getMedicationTime());
        dto.setCreatedAt(dateTimeConverter.localDateTimeToString(med.getCreatedAt()));
        dto.setUpdatedAt(dateTimeConverter.localDateTimeToString(med.getUpdatedAt()));

        // AI 한테 보내기
        DrugSummaryRequest drugInfoList = new DrugSummaryRequest();
        drugInfoList.setId(id);
        drugInfoList.setDrug_summary(requestDto.getDrug_summary());
        drugInfoList.setNote(senior.getNote());
        rabbitMQService.sendDrugSummaryRequest(drugInfoList);

        log.info("RabbitMQ에 의약품 분석 정보 수정 요청 전송 : " + drugInfoList);

        return dto;
    }


    public MedicationSchedulesResponseDto findById(Integer id) {
        MedicationSchedules med = medicationSchedulesRepository.findById(id).orElseThrow(
                () -> new NotFoundException("해당 일정을 찾을 수 없습니다."));

        Seniors senior = seniorsRepository.findById(med.getSenior().getId()).orElseThrow(
                () -> new NotFoundException("해당 환자를 찾을 수 없습니다.")
        );

        MedicationSchedulesResponseDto dto = new MedicationSchedulesResponseDto();
        dto.setId(med.getId());
        dto.setSeniorId(senior.getId());
        dto.setSeniorName(senior.getName());
        dto.setMedicationName(med.getMedicationName());
        dto.setStartDate(dateTimeConverter.localDateToString(med.getMedicationStartdate()));
        dto.setEndDate(dateTimeConverter.localDateToString(med.getMedicationEnddate()));
        dto.setDescription(med.getDescription());
        dto.setMedicationTimes(med.getMedicationTime());

        return dto;


    }

    // startDate - endDate 조회
    public PageResponseDto<MedicationSchedulesResponseDto> getListByDate(Integer seniorId, String startDate, String endDate, Pageable pageable) {

        LocalDate start = dateTimeConverter.stringToLocalDate(startDate);
        LocalDate end = dateTimeConverter.stringToLocalDate(endDate);

        Page<MedicationSchedules> page = medicationSchedulesRepository.findBySeniorIdAndMedicationEnddateGreaterThanEqualAndMedicationStartdateLessThanEqualAndIsDeletedFalse(seniorId, start, end, pageable);

        List<MedicationSchedulesResponseDto> convertList = page.getContent().stream().map(schedule -> {
            MedicationSchedulesResponseDto dto = new MedicationSchedulesResponseDto();
            dto.setId(schedule.getId());
            dto.setSeniorId(schedule.getSenior().getId());
            dto.setSeniorName(schedule.getSenior().getName());
            dto.setMedicationName(schedule.getMedicationName());
            dto.setStartDate(dateTimeConverter.localDateToString(schedule.getMedicationStartdate()));
            dto.setEndDate(dateTimeConverter.localDateToString(schedule.getMedicationEnddate()));
            dto.setDescription(schedule.getDescription());
            dto.setMedicationTimes(schedule.getMedicationTime()); // 배열 그대로 반환
            dto.setCreatedAt(dateTimeConverter.localDateTimeToString(schedule.getCreatedAt()));
            dto.setUpdatedAt(dateTimeConverter.localDateTimeToString(schedule.getUpdatedAt()));
            return dto;
        }).toList();

        return PageResponseDto.from("투약일정 조회 완료", page, convertList);


    }

    public void deleteById(Integer id) {
        MedicationSchedules med = medicationSchedulesRepository.findById(id).orElseThrow(() -> new NotFoundException("해당 일정을 찾을 수 없습니다."));
        med.setIsDeleted(true);
        medicationSchedulesRepository.save(med);
    }
}
