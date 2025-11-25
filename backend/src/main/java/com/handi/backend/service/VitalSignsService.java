package com.handi.backend.service;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.vital.signs.VitalSignsResponseDto;
import com.handi.backend.dto.vital.signs.VitalSignsUpdateRequest;
import com.handi.backend.entity.Seniors;
import com.handi.backend.entity.VitalSigns;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.repository.SeniorsRepository;
import com.handi.backend.repository.VitalSignsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VitalSignsService {

    private final DateTimeConverter dateTimeConverter;
    private final VitalSignsRepository vitalSignsRepository;
    private final SeniorsRepository seniorsRepository;


    public VitalSignsResponseDto getVitalSignsBySeniorId(Integer seniorId, String date) {
        LocalDate nowDay = dateTimeConverter.stringToLocalDate(date);

        if (nowDay.isAfter(LocalDate.now())) {
            throw new RuntimeException("해당 날짜는 조회할 수 없습니다.");
        }

        // 1. 시니어 존재 확인
        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId).orElseThrow(
                ()-> new NotFoundException("환자를 찾을 수 없습니다."));


        // 2. 오늘 날짜의 활력징후 데이터 조회
        VitalSigns existingVitalSigns = vitalSignsRepository.findBySeniorIdAndMeasuredDate(senior.getId(), nowDay);

        if (existingVitalSigns == null) {
            VitalSigns newVitalSigns = createEmptyVitalSigns(senior);
            newVitalSigns.setMeasuredDate(nowDay);
            existingVitalSigns = vitalSignsRepository.save(newVitalSigns);
            log.info("새로운 활력징후 데이터 생성: seniorId={}, date={}", seniorId, nowDay);
        }

        VitalSignsResponseDto result = new VitalSignsResponseDto();
        result.setId(existingVitalSigns.getId());
        result.setSeniorId(senior.getId());
        result.setSeniorName(senior.getName());
        result.setSystolic(existingVitalSigns.getSystolic());
        result.setDiastolic(existingVitalSigns.getDiastolic());
        result.setBloodGlucose(existingVitalSigns.getBloodGlucose());
        result.setTemperature(existingVitalSigns.getTemperature());
        result.setHeight(existingVitalSigns.getHeight());
        result.setWeight(existingVitalSigns.getWeight());
        result.setUpdatedAt(dateTimeConverter.localDateTimeToString(existingVitalSigns.getUpdatedAt()));
        result.setCreatedAt(dateTimeConverter.localDateTimeToString(existingVitalSigns.getCreatedAt()));
        result.setMeasuredDate(dateTimeConverter.localDateToString(existingVitalSigns.getMeasuredDate()));

        return result;

    }


    // 활력징후 데이터 생성
    private VitalSigns createEmptyVitalSigns(Seniors senior) {
        VitalSigns vitalSigns = new VitalSigns();
        vitalSigns.setSenior(senior);

        // 모든 측정값은 null로 설정 (기본값)
        vitalSigns.setSystolic(null);
        vitalSigns.setDiastolic(null);
        vitalSigns.setBloodGlucose(null);
        vitalSigns.setTemperature(null);
        vitalSigns.setHeight(null);
        vitalSigns.setWeight(null);
        vitalSigns.setMeasuredDate(null);

        return vitalSigns;
    }


    // 특정 시간 사이 활력 징후
    public List<VitalSignsResponseDto> getVitalSignsByDate(Integer seniorId, String start, String end) {
        LocalDate startDate;
        if(start != null ) startDate = dateTimeConverter.stringToLocalDate(start);
        else startDate = LocalDate.now().minusYears(100);

        LocalDate endDate;
        if(end != null)endDate = dateTimeConverter.stringToLocalDate(end);
        else endDate = LocalDate.now().plusYears(100);


        // 1. 시니어 존재 확인
        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId)
                .orElseThrow(() -> new NotFoundException("환자를 찾을 수 없습니다"));

        // 2. startDate-endDate 의 활력징후 데이터 조회
        List<VitalSigns> list = vitalSignsRepository.findBySeniorAndMeasuredDateBetweenOrderByMeasuredDateAsc(senior, startDate, endDate);
        if (list.isEmpty()) {
            throw new NotFoundException("해당 날짜 데이터가 없습니다.");
        }

        List<VitalSignsResponseDto> result = new ArrayList<>();
        for (VitalSigns vitalSigns : list) {
            VitalSignsResponseDto dto = new VitalSignsResponseDto();
            dto.setId(vitalSigns.getId());
            dto.setSeniorId(senior.getId());
            dto.setSeniorName(senior.getName());
            dto.setSystolic(vitalSigns.getSystolic());
            dto.setDiastolic(vitalSigns.getDiastolic());
            dto.setBloodGlucose(vitalSigns.getBloodGlucose());
            dto.setTemperature(vitalSigns.getTemperature());
            dto.setHeight(vitalSigns.getHeight());
            dto.setWeight(vitalSigns.getWeight());
            dto.setUpdatedAt(dateTimeConverter.localDateTimeToString(vitalSigns.getUpdatedAt()));
            dto.setCreatedAt(dateTimeConverter.localDateTimeToString(vitalSigns.getCreatedAt()));
            dto.setMeasuredDate(dateTimeConverter.localDateToString(vitalSigns.getMeasuredDate()));
            result.add(dto);
        }

        return result;
    }

    public VitalSignsResponseDto updateVitalSigns(Integer seniorId, VitalSignsUpdateRequest vitalSignsUpdateRequest, String date) {
        LocalDate nowDay = dateTimeConverter.stringToLocalDate(date);

        if (nowDay.isAfter(LocalDate.now())) {
            throw new RuntimeException("해당 날짜는 조회할 수 없습니다.");
        }

        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId)
                .orElseThrow(() -> new NotFoundException("환자를 찾을 수 없습니다"));

        VitalSigns vitalSigns = vitalSignsRepository.findBySeniorIdAndMeasuredDate(senior.getId(), nowDay);
        if(vitalSigns == null) {
            vitalSigns = createEmptyVitalSigns(senior);
            vitalSigns.setSenior(senior);
            log.info("해당 날짜 활력징후가 없어 새로 생성했습니다");
        }

        if(vitalSignsUpdateRequest.getSystolic() != null) vitalSigns.setSystolic(vitalSignsUpdateRequest.getSystolic());
        if(vitalSignsUpdateRequest.getDiastolic() != null) vitalSigns.setDiastolic(vitalSignsUpdateRequest.getDiastolic());
        if(vitalSignsUpdateRequest.getBloodGlucose() != null) vitalSigns.setBloodGlucose(vitalSignsUpdateRequest.getBloodGlucose());
        if(vitalSignsUpdateRequest.getTemperature() != null) vitalSigns.setTemperature(vitalSignsUpdateRequest.getTemperature());
        if(vitalSignsUpdateRequest.getHeight() != null) vitalSigns.setHeight(vitalSignsUpdateRequest.getHeight());
        if(vitalSignsUpdateRequest.getWeight() != null) vitalSigns.setWeight(vitalSignsUpdateRequest.getWeight());
        vitalSigns.setUpdatedAt(LocalDateTime.now());

        VitalSigns existingVitalSigns = vitalSignsRepository.save(vitalSigns);

        VitalSignsResponseDto result = new VitalSignsResponseDto();
        result.setId(existingVitalSigns.getId());
        result.setSeniorId(senior.getId());
        result.setSeniorName(senior.getName());
        result.setSystolic(existingVitalSigns.getSystolic());
        result.setDiastolic(existingVitalSigns.getDiastolic());
        result.setBloodGlucose(existingVitalSigns.getBloodGlucose());
        result.setTemperature(existingVitalSigns.getTemperature());
        result.setHeight(existingVitalSigns.getHeight());
        result.setWeight(existingVitalSigns.getWeight());
        result.setUpdatedAt(dateTimeConverter.localDateTimeToString(existingVitalSigns.getUpdatedAt()));
        result.setCreatedAt(dateTimeConverter.localDateTimeToString(existingVitalSigns.getCreatedAt()));
        result.setMeasuredDate(dateTimeConverter.localDateToString(existingVitalSigns.getMeasuredDate()));

        return result;
    }
}