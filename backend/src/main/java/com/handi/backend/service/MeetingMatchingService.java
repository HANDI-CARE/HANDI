package com.handi.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.meeting.EmployeeScheduleData;
import com.handi.backend.dto.meeting.GuardianRequestData;
import com.handi.backend.dto.meeting.MatchedMeeting;
import com.handi.backend.entity.MeetingMatches;
import com.handi.backend.entity.Seniors;
import com.handi.backend.entity.Users;
import com.handi.backend.enums.ConsultationStatus;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.repository.MeetingMatchesRepository;
import com.handi.backend.repository.SeniorsRepository;
import com.handi.backend.repository.UsersRepository;
import com.handi.backend.enums.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeetingMatchingService {

    private final DateTimeConverter dateTimeConverter;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final UsersRepository usersRepository;
    private final SeniorsRepository seniorsRepository;
    private final MeetingMatchesRepository meetingMatchesRepository;

    /**
     * 특정 날짜에 대해 간호사와 보호자 간의 최적 매칭을 수행
     */
    // 매일 자정에 자동으로 실행
    @Scheduled(cron = "0 0 0 * * *")
    public List<MatchedMeeting> autoPerformMatching() {

        //  매일 3일 후 날짜로 최적 매핑 수행
        String targetDate = dateTimeConverter.localDateToString(LocalDate.now().plusDays(3));
        try {
            List<MatchedMeeting> matchedMeetings = new ArrayList<>();

            // 1. 모든 간호사(EMPLOYEE) 사용자 조회
            List<Users> employees = usersRepository.findByRole(Role.EMPLOYEE);

            if (employees.isEmpty()) {
                log.info("매칭할 간호사가 없습니다.");
                return matchedMeetings;
            }

            // 간호사별 매칭 시도
            for (Users employee : employees) {
                List<MatchedMeeting> employeeMatches = matchEmployeeWithGuardians(employee.getId(), targetDate);
                matchedMeetings.addAll(employeeMatches);
            }

            return matchedMeetings;

        } catch (Exception e) {
            log.error("매칭 처리 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("매칭 처리에 실패했습니다.", e);
        }
    }
    
    // 직접 날짜 설정해서 매칭
    public List<MatchedMeeting> performMatching(String targetDate) {
        try {
            List<MatchedMeeting> matchedMeetings = new ArrayList<>();
            
            // 1. 모든 간호사(EMPLOYEE) 사용자 조회
            List<Users> employees = usersRepository.findByRole(Role.EMPLOYEE);
            
            if (employees.isEmpty()) {
                log.info("매칭할 간호사가 없습니다.");
                return matchedMeetings;
            }

            // 간호사별 매칭 시도
            for (Users employee : employees) {
                List<MatchedMeeting> employeeMatches = matchEmployeeWithGuardians(employee.getId(), targetDate);
                matchedMeetings.addAll(employeeMatches);
            }
            
            return matchedMeetings;
            
        } catch (Exception e) {
            log.error("매칭 처리 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("매칭 처리에 실패했습니다.", e);
        }
    }

    private List<MatchedMeeting> matchEmployeeWithGuardians(Integer employeeId, String targetDate) {
        try {
            // 2. 간호사 데이터 조회
            String employeeKey = "employee:schedule:" + employeeId;
            String employeeDataJson = (String) redisTemplate.opsForValue().get(employeeKey);

            // Redis에 저장된 해당 간호사 일정 조회
            if (employeeDataJson == null) {
                log.info("간호사 {}의 일정 데이터가 없습니다.", employeeId);
                return Collections.emptyList();
            }

            // 간호사 일정 가져오기
            EmployeeScheduleData employeeData = objectMapper.readValue(employeeDataJson, EmployeeScheduleData.class);
            
            // 3. 해당 날짜의 간호사 가능 시간 추출
            List<String> employeeAvailableTimes = employeeData.getAvailableTime().stream()
                    .filter(time -> time.startsWith(targetDate))
                    .collect(Collectors.toList());
            
            if (employeeAvailableTimes.isEmpty()) {
                log.info("간호사 {}의 {}일 가능 시간이 없습니다.", employeeId, targetDate);
                return Collections.emptyList();
            }
            
            // 4. 담당 시니어들의 보호자 요청 데이터 수집
            Map<Integer, GuardianRequestData> seniorRequestMap = new HashMap<>();
            Map<Integer, List<String>> seniorAvailableTimesMap = new HashMap<>();
            
            for (Integer seniorId : employeeData.getSeniors()) {
                String seniorKey = "senior:request:" + seniorId;
                String requestDataJson = (String) redisTemplate.opsForValue().get(seniorKey);
                
                if (requestDataJson != null) {
                    GuardianRequestData guardianData = objectMapper.readValue(requestDataJson, GuardianRequestData.class);
                    
                    // 해당 날짜의 보호자 요청 시간 추출
                    List<String> guardianAvailableTimes = guardianData.getAvailableTime().stream()
                            .filter(time -> time.startsWith(targetDate))
                            .collect(Collectors.toList());
                    
                    if (!guardianAvailableTimes.isEmpty()) {
                        seniorRequestMap.put(seniorId, guardianData);
                        seniorAvailableTimesMap.put(seniorId, guardianAvailableTimes);
                    }
                }
            }
            
            if (seniorRequestMap.isEmpty()) {
                log.info("간호사 {}의 담당 시니어들에 대한 {}일 보호자 요청이 없습니다.", employeeId, targetDate);
                return new ArrayList<>();
            }
            
            // 5. 백트래킹 알고리즘으로 최적 매칭 찾기
            List<MatchedMeeting> bestMatches = findOptimalMatching(
                    employeeId, 
                    employeeAvailableTimes, 
                    seniorRequestMap, 
                    seniorAvailableTimesMap
            );
            
            // 6. 매칭 결과를 데이터베이스에 저장
            saveMeetingMatchesToDatabase(bestMatches);
            
            // 7. 매칭된 데이터 Redis에서 삭제
            for (MatchedMeeting match : bestMatches) {
                String seniorKey = "senior:request:" + match.getSeniorId();
                redisTemplate.delete(seniorKey);
                log.info("매칭 완료로 인한 Redis 데이터 삭제: {}", seniorKey);
            }

            // 8. 간호사 스케줄에서 매칭된 시간 제거 후 redis 에 다시 저장
            Set<String> matchedTimes = bestMatches.stream()
                    .map(MatchedMeeting::getMeetingTime)
                    .collect(Collectors.toSet());
            employeeData.setAvailableTime(
                    employeeData.getAvailableTime().stream()
                            .filter(time -> !matchedTimes.contains(time))
                            .collect(Collectors.toList())
            );

            String updatedJson = objectMapper.writeValueAsString(employeeData);
            redisTemplate.opsForValue().set(employeeKey, updatedJson);

            return bestMatches;
            
        } catch (Exception e) {
            log.error("간호사 {} 매칭 처리 중 오류: {}", employeeId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    private List<MatchedMeeting> findOptimalMatching(
            Integer employeeId,
            List<String> employeeAvailableTimes,
            Map<Integer, GuardianRequestData> seniorRequestMap,
            Map<Integer, List<String>> seniorAvailableTimesMap) {

        // 시니어 ID 정렬(결정성 보장)
        List<Integer> seniorIds = new ArrayList<>(seniorRequestMap.keySet());
        Collections.sort(seniorIds);

        List<MatchedMeeting> bestResult = new ArrayList<>();
        List<MatchedMeeting> currentResult = new ArrayList<>();
        Set<Integer> visited = new HashSet<>();
        Set<String> usedTimes = new HashSet<>();
        
        backtrack(employeeId, employeeAvailableTimes, seniorRequestMap, seniorAvailableTimesMap,
                seniorIds, 0, visited, usedTimes, currentResult, bestResult);
        
        return bestResult;
    }

    private void backtrack(
            Integer employeeId,
            List<String> employeeAvailableTimes,
            Map<Integer, GuardianRequestData> seniorRequestMap,
            Map<Integer, List<String>> seniorAvailableTimesMap,
            List<Integer> seniorIds,
            int index,
            Set<Integer> visited,
            Set<String> usedTimes,
            List<MatchedMeeting> currentResult,
            List<MatchedMeeting> bestResult) {

        if (currentResult.size() + (seniorIds.size() - index) <= bestResult.size()) {
            return;
        }

        // 현재 결과가 최적 결과보다 좋으면 업데이트
        if (currentResult.size() > bestResult.size()) {
            bestResult.clear();
            bestResult.addAll(currentResult);
        }
        
        // 모든 시니어를 확인했으면 종료
        if (index >= seniorIds.size()) {
            return;
        }
        
        Integer seniorId = seniorIds.get(index);
        
        // 이미 방문한 시니어는 건너뛰기
        if (visited.contains(seniorId)) {
            backtrack(employeeId, employeeAvailableTimes, seniorRequestMap, seniorAvailableTimesMap,
                    seniorIds, index + 1, visited, usedTimes, currentResult, bestResult);
            return;
        }
        
        List<String> seniorTimes = seniorAvailableTimesMap.get(seniorId);
        GuardianRequestData guardianData = seniorRequestMap.get(seniorId);

        if (seniorTimes == null || seniorTimes.isEmpty() || guardianData == null) {
            backtrack(employeeId, employeeAvailableTimes, seniorRequestMap, seniorAvailableTimesMap,
                    seniorIds, index + 1, visited, usedTimes, currentResult, bestResult);
            return;
        }
        
        // 해당 시니어와 매칭 가능한 시간 찾기
        List<String> commonTimes = employeeAvailableTimes.stream()
                .filter(seniorTimes::contains)
                .filter(time -> !usedTimes.contains(time))
                .sorted()
                .toList();
        
        // 매칭 가능한 시간이 있는 경우
        for (String commonTime : commonTimes) {
            // 매칭 추가
            visited.add(seniorId);
            usedTimes.add(commonTime);
            
            MatchedMeeting match = new MatchedMeeting();
            match.setEmployeeId(employeeId);
            match.setGuardianId(guardianData.getUserId());
            match.setSeniorId(seniorId);
            match.setMeetingTime(commonTime);
            match.setMatchedAt(dateTimeConverter.localDateTimeToString(LocalDateTime.now()));
            
            currentResult.add(match);
            
            // 다음 시니어로 재귀 호출
            backtrack(employeeId, employeeAvailableTimes, seniorRequestMap, seniorAvailableTimesMap,
                    seniorIds, index + 1, visited, usedTimes, currentResult, bestResult);
            
            // 백트래킹: 상태 되돌리기
            currentResult.remove(currentResult.size() - 1);
            visited.remove(seniorId);
            usedTimes.remove(commonTime);
        }
        
        // 해당 시니어와 매칭하지 않고 다음으로 넘어가는 경우
        backtrack(employeeId, employeeAvailableTimes, seniorRequestMap, seniorAvailableTimesMap,
                seniorIds, index + 1, visited, usedTimes, currentResult, bestResult);
    }

    /**
     * 매칭 결과를 데이터베이스에 저장
     */
    private void saveMeetingMatchesToDatabase(List<MatchedMeeting> matchedMeetings) {
        try {
            for (MatchedMeeting match : matchedMeetings) {
                // 엔티티 조회
                Users employee = usersRepository.findById(match.getEmployeeId())
                        .orElseThrow(() -> new NotFoundException("간호사를 찾을 수 없습니다"));
                
                Users guardian = usersRepository.findById(match.getGuardianId())
                        .orElseThrow(() -> new NotFoundException("보호자를 찾을 수 없습니다"));
                
                Seniors senior = seniorsRepository.findById(match.getSeniorId())
                        .orElseThrow(() -> new NotFoundException("시니어를 찾을 수 없습니다"));

                // MeetingMatches 엔티티 생성
                MeetingMatches meetingMatch = new MeetingMatches();
                meetingMatch.setEmployee(employee);
                meetingMatch.setGuardian(guardian);
                meetingMatch.setSenior(senior);
                meetingMatch.setMeetingTime(dateTimeConverter.stringToLocalDateTime(match.getMeetingTime()));
                meetingMatch.setCreatedAt(dateTimeConverter.stringToLocalDateTime(match.getMatchedAt()));
                meetingMatch.setStatus(ConsultationStatus.CONDUCTED);
                meetingMatch.setAlgorithmInfo("백트래킹 알고리즘을 통한 최적 매칭");
                String title = senior.getName() + " 님의 상담입니다.";
                meetingMatch.setTitle(title);

                // 시작 + 끝 시간 추가
                meetingMatch.setStartedAt(meetingMatch.getMeetingTime().minusMinutes(20));
                meetingMatch.setEndedAt(meetingMatch.getMeetingTime().plusMinutes(40));

                // 데이터베이스에 저장
                meetingMatchesRepository.save(meetingMatch);
                
                log.info("매칭 결과 DB 저장 완료: employeeId={}, guardianId={}, seniorId={}, meetingTime={}",
                    match.getEmployeeId(), match.getGuardianId(), match.getSeniorId(), match.getMeetingTime());
            }
            
        } catch (Exception e) {
            log.error("매칭 결과 DB 저장 실패: {}", e.getMessage(), e);
            throw new RuntimeException("매칭 결과 저장에 실패했습니다.", e);
        }
    }
}