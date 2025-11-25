package com.handi.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.handi.backend.entity.*;
import com.handi.backend.enums.MedicationTime;
import com.handi.backend.enums.Role;
import com.handi.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final UsersRepository usersRepository;
    private final MeetingMatchesRepository meetingMatchesRepository;
    private final MedicationSchedulesRepository medicationSchedulesRepository;
    private final SeniorsRepository seniorsRepository;
    private final MedicationsRepository medicationsRepository;
    private final OrganizationsRepository organizationsRepository;

    // 중복 방지를 위해 set에 저장
    private final Set<String> sendAlerts = ConcurrentHashMap.newKeySet();

    @Scheduled(fixedRate = 300000) // 5분 = 300,000 ms
    public void alert(){
        log.info("Alerting : {}", LocalDateTime.now());

        List<Users> allUsers = usersRepository.findAll();  // 전체 유저 조회
        
        for (Users user : allUsers) {
            if(user.getRole().equals(Role.EMPLOYEE)){
                // 상담 알림
                checkMeetingMatchAlert(user);

                // 복약 알림
                checkMedicationAlert(user);
            }

            if(user.getRole().equals(Role.GUARDIAN)){
                // 상담 알림
                checkMeetingMatchAlert(user);
            }
        }

    }

    // 복약 알림
    private void checkMedicationAlert(Users user) {
        LocalDate today = LocalDate.now();
        LocalTime nowTime = LocalTime.now();

        // 소속 기관이 없으면 종료
        Organizations org = organizationsRepository.findById(user.getOrganizationId()).orElse(null);
        if(org == null) return;

        // 사용자 담당 환자 목록
        List<Seniors> seniorList = seniorsRepository.findByRelatedUserId(user.getId());
        for(Seniors senior : seniorList){

            // 환자의 투약 기간 스케줄
            List<MedicationSchedules> schedulesList = medicationSchedulesRepository.findBySeniorAndIsDeletedFalseAndMedicationStartdateLessThanEqualAndMedicationEnddateGreaterThanEqual(senior, today, today);
            for(MedicationSchedules schedule : schedulesList){

                // 오늘 복약 내역
                List<Medications> medicationsList = medicationsRepository.findByMedicationSchedulesAndMedicationDate(schedule, today);
                for(Medications medication : medicationsList){

                    String alertKey = user.getId() + "_" + medication.getId() + "_" + "Medication";
                    if (!sendAlerts.add(alertKey)) continue;

                    MedicationTime mTime = medication.getMedicationSchedule();
                    boolean shouldAlert = false;
                    String when="";

                    switch (mTime) {
                        case BEFORE_BREAKFAST:
                            shouldAlert = isWithinBeforeWindow(nowTime, org.getBreakfastTime());
                            when = "아침 식전";
                            break;
                        case AFTER_BREAKFAST:
                            shouldAlert = isWithinAfterWindow(nowTime, org.getBreakfastTime());
                            when = "아침 식후";
                            break;
                        case BEFORE_LUNCH:
                            shouldAlert = isWithinBeforeWindow(nowTime, org.getLunchTime());
                            when = "점심 식전";
                            break;
                        case AFTER_LUNCH:
                            shouldAlert = isWithinAfterWindow(nowTime, org.getLunchTime());
                            when = "점심 식후";
                            break;
                        case BEFORE_DINNER:
                            shouldAlert = isWithinBeforeWindow(nowTime, org.getDinnerTime());
                            when = "저녁 식전";
                            break;
                        case AFTER_DINNER:
                            shouldAlert = isWithinAfterWindow(nowTime, org.getDinnerTime());
                            when = "저녁 식후";
                            break;
                        case BEDTIME:
                            shouldAlert = isWithinBeforeWindow(nowTime, org.getSleepTime());
                            when = "취침 전";
                            break;
                    }

                    // 알람 보내야하고, FCM 토큰이 있는 경우에만 발송
                    if(shouldAlert && user.getFcmToken() != null && !user.getFcmToken().trim().isEmpty()){
                        String title = "복약 알림";
                        String message = String.format("%s 환자의 %s 복약 시간입니다.", senior.getName(), when);

                        try{
                            // 알람 보내기
                            sendFCMAlerts(user.getFcmToken(), title, message, "Medication", senior);
                        }catch (Exception e){
                            log.error("FCM 상담 알림 전송 실패", e);
                            sendAlerts.remove(alertKey);
                        }

                    }
                }
            }
        }
    }

    // 식전 30분 인지 체크
    private boolean isWithinBeforeWindow(LocalTime now, LocalTime target) {
        if(target == null) return false;
        LocalTime start = target.minusMinutes(30);
        return !now.isBefore(start) && now.isBefore(target);
    }

    // 식후 30분 인지 체크
    private boolean isWithinAfterWindow(LocalTime now, LocalTime target) {
        if (target == null) return false;
        LocalTime end = target.plusMinutes(30);
        return now.isAfter(target) && !now.isAfter(end);
    }

    // 상담 알림
    private void checkMeetingMatchAlert(Users user) {
        List<MeetingMatches> list;
        if(user.getRole().equals(Role.EMPLOYEE)) {
            list = meetingMatchesRepository.findByEmployeeAndStartedAtLessThanEqualAndEndedAtGreaterThanEqual(user, LocalDateTime.now(), LocalDateTime.now());
        }
        else if(user.getRole().equals(Role.GUARDIAN)) {
            list = meetingMatchesRepository.findByGuardianAndStartedAtLessThanEqualAndEndedAtGreaterThanEqual(user, LocalDateTime.now(), LocalDateTime.now());
        }
        else{
            log.info("해당 유저는 간호사 혹은 보호자가 아닙니다.");
            return;
        }

        for (MeetingMatches meetingMatches : list) {
            // 시간 체크
            long minutesDiff = ChronoUnit.MINUTES.between(LocalDateTime.now(), meetingMatches.getMeetingTime());
            if(minutesDiff < 0 || minutesDiff > 20) continue;

            // 이미 보낸 알람인지 중복 체크
            String alertKey = user.getId() + "_" + meetingMatches.getId() + "_" + "Meeting";
            if (!sendAlerts.add(alertKey)) continue;

            // FCM Token이 있는 경우에만 전송
            if(user.getFcmToken() != null && !user.getFcmToken().trim().isEmpty()){
               Seniors senior = meetingMatches.getSenior();

               String title = "상담 알림!";
               String message = String.format("%s 환자 상담 %d분 전입니다.", senior.getName(),minutesDiff);

               try{
                   // 알람 보내기
                   sendFCMAlerts(user.getFcmToken(), title, message, "Meeting", senior);
                   // 중복 체크
                   sendAlerts.add(alertKey);
               }catch (Exception e){
                   log.error("FCM 상담 알림 전송 실패", e);
                   sendAlerts.remove(alertKey);
               }
            }
        }

    }

    // FCM 으로 알림 보내기
    private void sendFCMAlerts(String fcmToken, String title, String message, String type, Seniors seniors){
        try{
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> dataMap = new HashMap<>();
            dataMap.put("seniorId", seniors.getId());
            String dataJson = mapper.writeValueAsString(dataMap);

            com.google.firebase.messaging.Message fcmMessage = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(
                        Notification.builder()
                                .setTitle(title)
                                .setBody(message)
                                .build())
                    .putData("type", type)
                    .putData("data", dataJson)
                    .build();
            FirebaseMessaging.getInstance().send(fcmMessage);
        }catch (Exception e){
            throw new RuntimeException("FCM 메시지 전송 실패", e);
        }
    }

    // 매일 자정에 전송된 알림 기록 초기화
    @Scheduled(cron = "0 0 0 * * *")
    public void resetDayAlert(){
        sendAlerts.clear();
        log.info("일일 알림 기록 초기화 완료");
    }
}
