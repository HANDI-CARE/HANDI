package com.handi.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.meeting.EmployeeScheduleData;
import com.handi.backend.dto.meeting.GuardianRequestData;
import com.handi.backend.dto.meeting.MeetingScheduleEmployeeDto;
import com.handi.backend.dto.meeting.MeetingScheduleGuardiantDto;
import com.handi.backend.dto.observation.record.Guardian;
import com.handi.backend.entity.Seniors;
import com.handi.backend.entity.Users;
import com.handi.backend.enums.ConsultationStatus;
import com.handi.backend.enums.Role;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.repository.SeniorsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisMeetingService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final long DEFAULT_TTL_DAYS = 7; // 7일 TTL
    private final DateTimeConverter dateTimeConverter;
    private final SeniorsRepository seniorsRepository;

    /**
     * 미팅 스케줄 데이터를 Redis에 저장
     */
    public void insertEmployeeMeetingSchedule(Users user, MeetingScheduleEmployeeDto requestDto) {
        if(user.getRole().equals(Role.EMPLOYEE)){
            insertEmployeeSchedule(user, requestDto);
        }
        else{
            throw new IllegalArgumentException("지원하지 않는 사용자 타입입니다.");
        }
    }

    public void insertGuardianMeetingSchedule(Users user, MeetingScheduleGuardiantDto requestDto) {
        if(user.getRole().equals(Role.GUARDIAN)){
            insertGuardianRequest(user, requestDto);
        }
        else{
            throw new IllegalArgumentException("지원하지 않는 사용자 타입입니다.");
        }
    }


    /**
     * 간호사 스케줄 데이터 저장
     */
    private void insertEmployeeSchedule(Users user, MeetingScheduleEmployeeDto requestDto) {
        try {
            String key = "employee:schedule:" + user.getId();

            List<Seniors> seniorsList = seniorsRepository.findByRelatedUserId(user.getId());
            List<Integer> serniorIds = seniorsList.stream().map(Seniors::getId).collect(Collectors.toList());

            EmployeeScheduleData scheduleData = new EmployeeScheduleData();
            scheduleData.setSeniors(serniorIds);
            scheduleData.setAvailableTime(requestDto.getCheckedTime());
            scheduleData.setCreatedAt(dateTimeConverter.localDateTimeToString(LocalDateTime.now()));
            scheduleData.setExpiresAt(dateTimeConverter.localDateTimeToString(LocalDateTime.now().plusDays(DEFAULT_TTL_DAYS)));

            String jsonData = objectMapper.writeValueAsString(scheduleData);
            redisTemplate.opsForValue().set(key, jsonData, DEFAULT_TTL_DAYS, TimeUnit.DAYS);

            log.info("간호사 스케줄 저장 완료: userId={}, key={}", user.getId(), key);

        } catch (Exception e) {
            log.error("간호사 스케줄 저장 실패: userId={}", user.getId(), e);
            throw new RuntimeException("간호사 스케줄 저장에 실패했습니다.", e);
        }
    }

    /**
     * 보호자 요청 데이터 저장 (시니어별)
     */
    private void insertGuardianRequest(Users user, MeetingScheduleGuardiantDto requestDto) {
        try {
            List<Seniors> seniorsList = seniorsRepository.findByRelatedUserId(user.getId());
            // 각 시니어별로 별도 키로 저장
            for (Seniors list : seniorsList) {
                String key = "senior:request:" + requestDto.getSeniorId();

                GuardianRequestData requestData = new GuardianRequestData();
                requestData.setUserId(user.getId());
                requestData.setAvailableTime(requestDto.getCheckedTime());
                requestData.setRequestedAt(dateTimeConverter.localDateTimeToString(LocalDateTime.now()));
                requestData.setStatus(ConsultationStatus.PENDING);

                String jsonData = objectMapper.writeValueAsString(requestData);
                redisTemplate.opsForValue().set(key, jsonData, DEFAULT_TTL_DAYS, TimeUnit.DAYS);

                log.info("보호자 요청 저장 완료: userId={}, seniorId={}, key={}",user.getId(), requestDto.getSeniorId(), key);
            }

        } catch (Exception e) {
            log.error("보호자 요청 저장 실패: userId={}", requestDto.getSeniorId(), e);
            throw new RuntimeException("보호자 요청 저장에 실패했습니다.", e);
        }
    }

    /**
     * 특정 키의 스케줄 데이터 조회
     */
    public String getScheduleData(String key) {
        try {
            String data = (String) redisTemplate.opsForValue().get(key);
            log.info("스케줄 데이터 조회: key={}, found={}", key, data != null);
            return data;

        } catch (Exception e) {
            log.error("스케줄 데이터 조회 실패: key={}", key, e);
            throw new RuntimeException("스케줄 데이터 조회에 실패했습니다.", e);
        }
    }

    /**
     * 특정 시니어의 보호자 요청 조회
     */
    public String getGuardianRequestBySenior(Integer seniorId) {
        try {
            String key = "senior:request:" + seniorId;
            return getScheduleData(key);

        } catch (Exception e) {
            log.error("보호자 요청 조회 실패: seniorId={}", seniorId, e);
            throw new RuntimeException("보호자 요청 조회에 실패했습니다.", e);
        }
    }

    /**
     * Redis 연결 상태 확인
     */
    public boolean isRedisHealthy() {
        try {
            redisTemplate.opsForValue().set("health:check", "ping");
            String result = (String) redisTemplate.opsForValue().get("health:check");
            redisTemplate.delete("health:check");

            return "ping".equals(result);

        } catch (Exception e) {
            log.error("Redis 헬스체크 실패: {}", e.getMessage());
            return false;
        }
    }

    // 간호사 스케줄 조회
    public MeetingScheduleEmployeeDto getEmployeeScheduleData(Users user) {
        if(!user.getRole().equals(Role.EMPLOYEE)) throw new RuntimeException("해당 기능은 간호사만 사용이 가능합니다");

        String key = "employee:schedule:" + user.getId();
        String data = (String) redisTemplate.opsForValue().get(key);

        if(data == null) return null;

        try {
            EmployeeScheduleData schedule = objectMapper.readValue(data, EmployeeScheduleData.class);
            MeetingScheduleEmployeeDto result = new  MeetingScheduleEmployeeDto();
            result.setCheckedTime(schedule.getAvailableTime());
            return result;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("스케줄을 불러오는데 실패했습니다.");
        }

    }


    public MeetingScheduleGuardiantDto getGuardianScheduleData(Users user, Integer seniorId) {
        if(!user.getRole().equals(Role.GUARDIAN)) throw new RuntimeException("해당 기능은 보호자만 사용이 가능합니다");

        String key = "senior:request:" + seniorId;
        String data = (String) redisTemplate.opsForValue().get(key);

        if(data == null) return null;

        try{
            GuardianRequestData schedule = objectMapper.readValue(data, GuardianRequestData.class);
            MeetingScheduleGuardiantDto result = new  MeetingScheduleGuardiantDto();
            result.setSeniorId(seniorId);
            result.setCheckedTime(schedule.getAvailableTime());
            return result;
        }catch (JsonProcessingException e){
            throw new RuntimeException("스케줄을 불러오는데 실패했습니다.");
        }
    }

    public List<MeetingScheduleGuardiantDto> getAllGuardianScheduleData(Users user) {
        List<MeetingScheduleGuardiantDto> result = new ArrayList<>();

        if(!user.getRole().equals(Role.GUARDIAN)) throw new RuntimeException("해당 기능은 보호자만 사용이 가능합니다");
        List<Seniors> seniorsList = seniorsRepository.findByRelatedUserId(user.getId());
        for (Seniors senior : seniorsList) {
            String key = "senior:request:" + senior.getId();
            String data = (String) redisTemplate.opsForValue().get(key);
            if(data == null) return null;
            try{
                GuardianRequestData schedule = objectMapper.readValue(data, GuardianRequestData.class);
                MeetingScheduleGuardiantDto dto = new  MeetingScheduleGuardiantDto();
                dto.setSeniorId(senior.getId());
                dto.setCheckedTime(schedule.getAvailableTime());
                result.add(dto);
            }catch (JsonProcessingException e){
                throw new RuntimeException("스케줄을 불러오는데 실패했습니다.");
            }
        }
        return result;
    }
}