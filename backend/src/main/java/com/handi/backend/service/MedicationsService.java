package com.handi.backend.service;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.medication.*;
import com.handi.backend.dto.medicationSchedules.CreateMedicationSchedulesRequestDto;
import com.handi.backend.entity.*;
import com.handi.backend.enums.MedicationTime;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.repository.*;
import com.handi.backend.util.MinioUtil;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MedicationsService {

    private final UsersRepository usersRepository;
    @Value("${minio.bucket}")
    private String bucketName;

    private final DateTimeConverter dateTimeConverter;
    private final MedicationsRepository medicationsRepository;
    private final MedicationSchedulesRepository medicationSchedulesRepository;
    private final MinioUtil minioUtil;
    private final SeniorsRepository seniorsRepository;
    private final MinioClient minioClient;
    private final OrganizationsRepository organizationsRepository;

    // 투약 내역 전체 조회
    public MedicationsResponseDto findBySchedulesId(Integer schedulesId) {
        MedicationSchedules med = medicationSchedulesRepository.findById(schedulesId).orElseThrow(
                () -> new NotFoundException("해당 투약 스케줄이 없습니다."));

        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(med.getSenior().getId()).orElseThrow(
                () -> new NotFoundException("해당 환자가 없습니다.")
        );

        List<Medications> list = medicationsRepository.findByMedicationSchedules(med);
        if(list.isEmpty()) throw new NotFoundException("해당 스케줄의 투약 내역이 없습니다.");

        MedicationsResponseDto result = new MedicationsResponseDto();
        result.setSchedulesId(med.getId());
        result.setSeniorId(senior.getId());
        result.setSeniorName(senior.getName());
        result.setMedicationName(med.getMedicationName());

        for(Medications medications : list) {
            MedicationsDto dto = new MedicationsDto();
            dto.setId(medications.getId());

            // 복용전이면 NULL
            LocalDateTime medicatedAt = medications.getMedicatedAt();
            dto.setMedicatedAt(medicatedAt != null ? dateTimeConverter.localDateTimeToString(medicatedAt) : null);

            dto.setMedicationDate(dateTimeConverter.localDateToString(medications.getMedicationDate()));

            if(medications.getMedicationPhotoPath() != null) {
                String presignedUrl;
                try {
                    presignedUrl = minioClient.getPresignedObjectUrl(
                            GetPresignedObjectUrlArgs.builder()
                                    .method(Method.GET)
                                    .bucket(bucketName)
                                    .object(medications.getMedicationPhotoPath())
                                    .expiry(1, TimeUnit.DAYS)
                                    .build()
                    );
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }

                dto.setMedicationPhotoPath(presignedUrl);
            }
            dto.setMedicationTime(medications.getMedicationSchedule());
            dto.setCreatedAt(dateTimeConverter.localDateTimeToString(medications.getCreatedAt()));
            dto.setUpdatedAt(dateTimeConverter.localDateTimeToString(medications.getUpdatedAt()));
            result.getMedications().add(dto);
        }

        return result;
    }



    // 투약 스케줄 생성 시 그 아래 투약 내역 미리 모두 생성
    public void createBySchedulesId(Integer id, CreateMedicationSchedulesRequestDto requestDto) {

        MedicationSchedules medicationSchedules = medicationSchedulesRepository.findById(id).orElseThrow(
                () -> new NotFoundException("해당 투약 스케줄이 없습니다.")
        );


        LocalDate startDate = dateTimeConverter.stringToLocalDate(requestDto.getStartDate());
        LocalDate endDate = dateTimeConverter.stringToLocalDate(requestDto.getEndDate()).plusDays(1);

        // 날짜 늘려가면서 생성
        while (startDate.isBefore(endDate)) {
            // 각 시간별로 체크
            for (String timeStr : requestDto.getMedicationTime()) {
                Medications medications = new Medications();
                medications.setMedicationSchedules(medicationSchedules);
                medications.setMedicationPhotoPath(null);
                medications.setMedicatedAt(null);
                medications.setMedicationDate(startDate);
                medications.setMedicationSchedule(MedicationTime.valueOf(timeStr));
                medicationsRepository.save(medications); // 저장
            }
            startDate = startDate.plusDays(1); // 다음 날짜로 이동
        }

    }

    public void uploadFileById(Integer id, MedicationUploadRequestDto requestDto) throws Exception{
        Medications medications = medicationsRepository.findById(id).orElseThrow(
                () -> new NotFoundException("해당 투약 스케줄이 없습니다."));

        Seniors seniors = seniorsRepository.findByIdAndIsDeletedFalse(requestDto.getSeniorId()).orElseThrow(
                () -> new NotFoundException("해당 환자를 찾을 수 없습니다."));

        if(requestDto.getMultipartFile().isEmpty() || requestDto.getMultipartFile() == null){
            throw new NotFoundException("파일이 존재하지 않거나 잘못된 형식의 파일입니다");
        }

        String filepath = minioUtil.uploadMedicationFile(seniors.getId(), id, requestDto.getMultipartFile());

        medications.setMedicationPhotoPath(filepath);
        medications.setMedicatedAt(LocalDateTime.now());
        medicationsRepository.save(medications);

    }

    @Transactional
    public MedicationOneResponseDto findById(Integer id) {
        Medications medications = medicationsRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("해당 투약 내역이 존재하지 않습니다."));

        MedicationSchedules schedule = medications.getMedicationSchedules();
        Seniors senior = schedule.getSenior();

        MedicationOneResponseDto dto = new MedicationOneResponseDto();

        if(medications.getMedicationPhotoPath() != null) {
            String presignedUrl;

            try {
                presignedUrl = minioClient.getPresignedObjectUrl(
                        GetPresignedObjectUrlArgs.builder()
                                .method(Method.GET)
                                .bucket(bucketName)
                                .object(medications.getMedicationPhotoPath())
                                .expiry(1, TimeUnit.DAYS)
                                .build()
                );
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
            dto.setMedicationPhotoPath(presignedUrl);
        }

        dto.setId(medications.getId());
        dto.setSchedulesId(schedule.getId());
        dto.setMedicationName(schedule.getMedicationName());
        dto.setSeniorId(senior.getId());
        dto.setSeniorName(senior.getName());

        if (medications.getMedicatedAt() != null) {
            dto.setMedicatedAt(dateTimeConverter.localDateTimeToString(medications.getMedicatedAt()));
        }

        if (medications.getMedicationDate() != null) {
            dto.setMedicationDate(dateTimeConverter.localDateToString(medications.getMedicationDate()));
        }

        dto.setMedicationTime(medications.getMedicationSchedule());
        dto.setCreatedAt(dateTimeConverter.localDateTimeToString(medications.getCreatedAt()));
        dto.setUpdatedAt(dateTimeConverter.localDateTimeToString(medications.getUpdatedAt()));

        return dto;
    }

    public PageResponseDto<MedicationTodayResponseDto> getTodayMedications(Users user, Pageable pageable) {
        LocalDate today = LocalDate.now();

        // 간호사 담당 환자 조회
        List<Seniors> seniors = seniorsRepository.findByRelatedUserId(user.getId());

        // 오늘 복약 내역 ( result )
        List<Medications> TodayMedications = new ArrayList<>();

        // 각 환자마자 스케줄 찾기
        for (Seniors senior : seniors) {
            // 환자를 기반으로 스케줄 전체 조회
            List<MedicationSchedules> schedules = medicationSchedulesRepository.findBySenior(senior);

            // 스케줄마다 복약내역 찾기
            for(MedicationSchedules schedule : schedules) {
                // 스케줄 기반으로 복약내역 전체 조회
                List<Medications> medications = medicationsRepository.findByMedicationSchedules(schedule);

                // 그 복약 내역이 오늘이니
                for(Medications m : medications) {
                    if(m.getMedicationDate().isEqual(today)) {
                        TodayMedications.add(m);
                    }
                }
            }
        }

        List<MedicationTodayResponseDto> result = new ArrayList<>();

        for(Medications med : TodayMedications) {
            MedicationSchedules schedules = med.getMedicationSchedules();
            Seniors senior = schedules.getSenior();

            MedicationTodayResponseDto dto = new MedicationTodayResponseDto();
            dto.setId(med.getId());
            dto.setSchedulesId(schedules.getId());
            dto.setSeniorId(senior.getId());
            dto.setSeniorName(senior.getName());
            if(med.getMedicationPhotoPath() != null) {
                String presignedUrl;

                try {
                    presignedUrl = minioClient.getPresignedObjectUrl(
                            GetPresignedObjectUrlArgs.builder()
                                    .method(Method.GET)
                                    .bucket(bucketName)
                                    .object(med.getMedicationPhotoPath())
                                    .expiry(1, TimeUnit.DAYS)
                                    .build()
                    );
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
                dto.setMedicationName(schedules.getMedicationName());
                dto.setMedicationPhotoPath(presignedUrl);
                dto.setMedicatedAt(dateTimeConverter.localDateTimeToString(med.getMedicatedAt()));
            }
            else {
                dto.setMedicationPhotoPath(null);
                dto.setMedicatedAt(null);
            }

            dto.setMedicationDate(dateTimeConverter.localDateToString(med.getMedicationDate()));
            dto.setMedicationTime(med.getMedicationSchedule());

            Organizations org = organizationsRepository.findById(user.getOrganizationId()).orElseThrow(()->new NotFoundException("해당 간호사가 속한 기관이 없습니다."));
            if(med.getMedicationSchedule().equals(MedicationTime.BEFORE_BREAKFAST)) dto.setMedicationExactTime(dateTimeConverter.localTimeToString(org.getBreakfastTime().minusMinutes(30)));
            else if(med.getMedicationSchedule().equals(MedicationTime.AFTER_BREAKFAST)) dto.setMedicationExactTime(dateTimeConverter.localTimeToString(org.getBreakfastTime().plusMinutes(30)));
            else if(med.getMedicationSchedule().equals(MedicationTime.BEFORE_LUNCH)) dto.setMedicationExactTime(dateTimeConverter.localTimeToString(org.getLunchTime().minusMinutes(30)));
            else if(med.getMedicationSchedule().equals(MedicationTime.AFTER_LUNCH)) dto.setMedicationExactTime(dateTimeConverter.localTimeToString(org.getLunchTime().plusMinutes(30)));
            else if(med.getMedicationSchedule().equals(MedicationTime.BEFORE_DINNER)) dto.setMedicationExactTime(dateTimeConverter.localTimeToString(org.getDinnerTime().minusMinutes(30)));
            else if(med.getMedicationSchedule().equals(MedicationTime.AFTER_DINNER)) dto.setMedicationExactTime(dateTimeConverter.localTimeToString(org.getDinnerTime().plusMinutes(30)));
            else if(med.getMedicationSchedule().equals(MedicationTime.BEDTIME)) dto.setMedicationExactTime(dateTimeConverter.localTimeToString(org.getSleepTime().minusMinutes(30)));
            result.add(dto);

        }

        Page<MedicationTodayResponseDto> page = new PageImpl<>(result, pageable, result.size());
        return PageResponseDto.from("오늘 복약 내역 조회 성공", page, result);
    }
}
