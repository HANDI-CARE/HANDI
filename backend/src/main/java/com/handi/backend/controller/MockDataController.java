package com.handi.backend.controller;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.entity.*;
import com.handi.backend.enums.*;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.repository.*;
import com.handi.backend.service.RedisService;
import com.handi.backend.service.SeniorService;
import com.handi.backend.util.CookieUtil;
import com.handi.backend.util.JwtTokenProvider;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/mock")
@Tag(name = "발표용 데이터 생성 API")
@RequiredArgsConstructor
@Slf4j
public class MockDataController {
    private final DateTimeConverter dateTimeConverter;
    private final VitalSignsRepository vitalSignsRepository;
    private final ObservationRecordsRepository observationRecordsRepository;
    private final DocumentLibraryRepository documentLibraryRepository;
    private final MedicationsRepository medicationsRepository;
    private final MedicationSchedulesRepository medicationSchedulesRepository;
    private final MeetingMatchesRepository meetingMatchesRepository;
    private final SeniorUserRelationsRepository seniorUserRelationsRepository;
    private final UsersRepository usersRepository;
    private final SeniorsRepository seniorsRepository;
    private final OrganizationsRepository organizationsRepository;
    private final OauthUsersRepository oauthUsersRepository;
    private final RedisService redisService;

    private final SeniorService seniorService;
    private final CookieUtil cookieUtil;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/drop/data")
    @Tag(name = "모든 데이터 삭제 (누르지마세요!!!!!!!)", description = "발표용 데이터 삭제")
    @Transactional
    public ResponseEntity<CommonResponseDto<?>> dropData() {
        try {
            log.warn("=== 전체 데이터 삭제 시작 ===");

            // 1. Redis 데이터 삭제 (Refresh Token들)
            log.info("1. Redis 데이터 삭제 중...");
            redisService.deleteAll(); // 이 메서드는 RedisService에 추가 필요

            // 2. 자식 테이블들 삭제 (FK 참조하는 테이블들)
            log.info("2. 자식 테이블들 삭제 중...");

            // 2-1. VitalSigns 삭제 (senior_id 참조)
            vitalSignsRepository.deleteAll();
            log.info("2-1. VitalSigns 삭제 완료");

            // 2-2. ObservationRecords 삭제 (senior_id 참조)
            observationRecordsRepository.deleteAll();
            log.info("2-2. ObservationRecords 삭제 완료");

            // 2-3. DocumentLibrary 삭제 (senior_id 참조)
            documentLibraryRepository.deleteAll();
            log.info("2-3. DocumentLibrary 삭제 완료");

            // 2-4. Medications 삭제 (medication_schedules_id 참조)
            medicationsRepository.deleteAll();
            log.info("2-4. Medications 삭제 완료");

            // 2-5. MedicationSchedules 삭제 (senior_id 참조)
            medicationSchedulesRepository.deleteAll();
            log.info("2-5. MedicationSchedules 삭제 완료");

            // 2-6. MeetingMatches 삭제 (employee_id, guardian_id, senior_id 참조)
            meetingMatchesRepository.deleteAll();
            log.info("2-6. MeetingMatches 삭제 완료");

            // 2-7. SeniorUserRelations 삭제 (user_id, senior_id 참조)
            seniorUserRelationsRepository.deleteAll();
            log.info("2-7. SeniorUserRelations 삭제 완료");

            // 3. 부모 테이블들 삭제
            log.info("3. 부모 테이블들 삭제 중...");

            // 3-1. Users 삭제 (oauth_user_id, organization_id 참조)
            usersRepository.deleteAll();
            log.info("3-1. Users 삭제 완료");

            // 3-2. Seniors 삭제 (독립적)
            seniorsRepository.deleteAll();
            log.info("3-2. Seniors 삭제 완료");

            // 3-3. Organizations 삭제 (독립적)
            organizationsRepository.deleteAll();
            log.info("3-3. Organizations 삭제 완료");

            // 3-4. OauthUsers 삭제 (최상위 독립적)
            oauthUsersRepository.deleteAll();
            log.info("3-4. OauthUsers 삭제 완료");

            log.warn("=== 전체 데이터 삭제 완료 ===");

            // 4. AUTO_INCREMENT 값 리셋 (PK를 1부터 다시 시작)
            resetAutoIncrementValues();

            return ResponseEntity.ok(CommonResponseDto.success("모든 데이터가 성공적으로 삭제되었습니다."));

        } catch (Exception e) {
            log.error("데이터 삭제 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(CommonResponseDto.error("데이터 삭제 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    private void resetAutoIncrementValues() {
        try {
            // 자식 테이블들부터 리셋
            vitalSignsRepository.resetAutoIncrement();
            log.info("VitalSigns AUTO_INCREMENT 리셋 완료");

            observationRecordsRepository.resetAutoIncrement();
            log.info("ObservationRecords AUTO_INCREMENT 리셋 완료");

            documentLibraryRepository.resetAutoIncrement();
            log.info("DocumentLibrary AUTO_INCREMENT 리셋 완료");

            medicationsRepository.resetAutoIncrement();
            log.info("Medications AUTO_INCREMENT 리셋 완료");

            medicationSchedulesRepository.resetAutoIncrement();
            log.info("MedicationSchedules AUTO_INCREMENT 리셋 완료");

            meetingMatchesRepository.resetAutoIncrement();
            log.info("MeetingMatches AUTO_INCREMENT 리셋 완료");

            // SeniorUserRelations는 복합키라서 AUTO_INCREMENT 없음

            // 부모 테이블들 리셋
            usersRepository.resetAutoIncrement();
            log.info("Users AUTO_INCREMENT 리셋 완료");

            seniorsRepository.resetAutoIncrement();
            log.info("Seniors AUTO_INCREMENT 리셋 완료");

            organizationsRepository.resetAutoIncrement();
            log.info("Organizations AUTO_INCREMENT 리셋 완료");

            oauthUsersRepository.resetAutoIncrement();
            log.info("OauthUsers AUTO_INCREMENT 리셋 완료");

        } catch (Exception e) {
            log.error("AUTO_INCREMENT 리셋 중 오류 발생: {}", e.getMessage());
            throw new RuntimeException("AUTO_INCREMENT 리셋 실패: " + e.getMessage());
        }
    }


    @GetMapping("/create/admin")
    @Tag(name = "현재 로그인한 계정 ADMIN 으로 만들기", description = "기관코드 입력 전에 실행하기")
    @Transactional
    public ResponseEntity<CommonResponseDto<?>> createAdmin(HttpServletRequest request) {
        String accessToken = cookieUtil.getCookieValue(request, "accessToken").orElse(null);
        Integer oauthUserId = jwtTokenProvider.getOauthUserIdFromToken(accessToken);
        OauthUsers oauth = oauthUsersRepository.findById(oauthUserId).orElse(null);
        Users newUser = new Users();
        newUser.setName("관리자");
        newUser.setOauthUser(oauth);
        newUser.setEmail(oauth.getEmail());
        newUser.setRole(Role.ADMIN);
        newUser.setPhoneNumber("01012341234");
        newUser.setOrganizationId(1);
        newUser.setAddress("서울시");
        newUser.setFcmToken(null);
        newUser.setIsDeleted(false);
        newUser.setProfileImageUrl(null);
        usersRepository.save(newUser);
        return ResponseEntity.ok(CommonResponseDto.success("해당 사용자는 ADMIN 입니다."));
    }

    @GetMapping("delete/senior")
    @Tag(name = "나랑 연관된 환자 관계 끊기")
    @Transactional
    public ResponseEntity<CommonResponseDto<?>> deleteSenior(
            HttpServletRequest request
    ){
        String accessToken = cookieUtil.getCookieValue(request, "accessToken").orElse(null);
        Integer oauthUserId = jwtTokenProvider.getOauthUserIdFromToken(accessToken);
        Users user = usersRepository.findByOauthUserId(oauthUserId).orElse(null);

        List<Seniors> seniors = seniorsRepository.findByRelatedUserId(user.getId());
        for(Seniors senior : seniors){
            // 1. 해당 시니어와 관련된 미팅 삭제
            meetingMatchesRepository.deleteBySeniorId(senior.getId());
            
            // 2. 해당 시니어의 활력징후 삭제
            vitalSignsRepository.deleteBySeniorId(senior.getId());
            
            // 3. 해당 시니어의 관찰일지 삭제
            observationRecordsRepository.deleteBySeniorId(senior.getId());
            
            // 4. 해당 시니어의 투약 기록 삭제
            medicationsRepository.deleteBySeniorId(senior.getId());
            
            // 5. 해당 시니어의 투약 스케줄 삭제
            medicationSchedulesRepository.deleteBySeniorId(senior.getId());
            
            // 6. 해당 시니어의 문서 삭제
            documentLibraryRepository.deleteBySeniorId(senior.getId());
            
            // 7. 시니어-사용자 관계 삭제
            seniorService.deleteSeniorUserRelation(senior.getId(), user.getId());
        }
        return ResponseEntity.ok(CommonResponseDto.success("담당 환자 및 관련 데이터 삭제 완료"));
    }

    @PostMapping("/create/data")
    @Tag(name = "임시 테스트 데이터 넣기")
    @Transactional
    public ResponseEntity<CommonResponseDto<?>> createData(
         @RequestParam Integer nurseId,
         @RequestParam Integer guardianId
    ){
        Users employee = usersRepository.findById(nurseId).orElse(null);
        Users guardian = usersRepository.findById(guardianId).orElse(null);

        if(employee == null || guardian == null) {
            throw new NotFoundException("간호사 또는 보호자를 찾을 수 없습니다");
        }

        // 환자 5명 만들기
        String[] names = {"박금자","김말순","이순자","최광호","오영수"};
        String[] birthday = {"19400418","19470203","19430708","19500113","19411115"};
        Gender[] gender = {Gender.FEMALE, Gender.FEMALE, Gender.FEMALE, Gender.MALE, Gender.MALE};
        Integer[] admissionDate = {60,50,40,30,40,50};
        String[] memo = {"딱딱한 것을 드시기 힘들어 하심","걸음이 불편하셔서 항상 주의 및 관찰 요망",
                "감기 기운이 있으셔서 추위를 많이 타심.","매우 건강하심.","보호자가 당분간 찾아오기 힘들다고 하심."};

        Seniors[] seniors = new Seniors[5];
        for(int k=0;k<5;k++){
            seniors[k] = new Seniors();
            seniors[k].setName(names[k]);
            seniors[k].setBirthDate(dateTimeConverter.stringToLocalDate(birthday[k]));
            seniors[k].setGender(gender[k]);
            seniors[k].setAdmissionDate(LocalDate.now().minusDays(admissionDate[k]));
            seniors[k].setNote(memo[k]);
            seniors[k].setOrganization(organizationsRepository.findById(1).orElse(null));
            seniors[k] = seniorsRepository.save(seniors[k]);

            // 시니어-사용자 관계 생성
            SeniorUserRelations employeeRelation = new SeniorUserRelations();
            employeeRelation.setSenior(seniors[k]);
            employeeRelation.setUser(employee);
            employeeRelation.setRole(Role.EMPLOYEE);
            employeeRelation.setId(new SeniorUserRelationsId(employee.getId(), seniors[k].getId()));
            seniorUserRelationsRepository.save(employeeRelation);


            SeniorUserRelations guardianRelation = new SeniorUserRelations();
            guardianRelation.setSenior(seniors[k]);
            guardianRelation.setUser(guardian);
            guardianRelation.setRole(Role.GUARDIAN);
            guardianRelation.setId(new SeniorUserRelationsId(guardian.getId(), seniors[k].getId()));
            seniorUserRelationsRepository.save(guardianRelation);

            // VitalSign ( 8일치 )
            Integer[] systolic = {120,130,110,135,126,118,124,129};
            Integer[] diastolic = {80,75,77,84,63,81,76,71};
            Integer[] bloodGlucose = {97,116,136,101,141,120,128,101};
            String[] temperature = {"36.5","36.9","36.2","37.0","36.4","37.3","35.9","36.7"};
            String[] height = {"165.0","165.0","165.0","165.0","165.0","165.0","165.0","165.0"};
            String[] weight = {"65.0","65.0","65.0","65.0","65.0","65.0","65.0","65.0"};

            for (int i = 0; i < 8; i++) {
                VitalSigns vitalSign = new VitalSigns();
                vitalSign.setSenior(seniors[k]);
                vitalSign.setSystolic(systolic[i]);
                vitalSign.setDiastolic(diastolic[i]);
                vitalSign.setBloodGlucose(bloodGlucose[i]);
                vitalSign.setTemperature(new BigDecimal(temperature[i]));
                vitalSign.setHeight(new BigDecimal(height[i]));
                vitalSign.setWeight(new BigDecimal(weight[i]));
                vitalSign.setMeasuredDate(LocalDate.now().minusDays(i));
                vitalSign.setCreatedAt(LocalDateTime.now());
                vitalSign.setUpdatedAt(LocalDateTime.now());
                vitalSign.setIsDeleted(false);
                vitalSignsRepository.save(vitalSign);
            }

            // 관찰일지 3개
            Level[] levels = {Level.LOW, Level.MEDIUM, Level.HIGH};
            String[] contents = {"걸으실 때 구부정하게 걸으십니다.",
                    "수면장애가 심하셔서 쉽게 잠들지 못하십니다.",
                    "딱딱한 음식을 잘 드시지 못합니다."};

            for (int i = 0; i < 3; i++) {
                ObservationRecords observation = new ObservationRecords();
                observation.setSenior(seniors[k]);
                observation.setLevel(levels[i]);
                observation.setContent(contents[i]);
                observation.setIsDeleted(false);
                observation.setCreatedAt(LocalDateTime.now());
                observation.setUpdatedAt(LocalDateTime.now());
                observation.setIsDeleted(false);
                observationRecordsRepository.save(observation);
            }
        }

        // Medication Schedules 1개
        MedicationSchedules medicationSchedule = new MedicationSchedules();
        medicationSchedule.setSenior(seniors[0]);
        medicationSchedule.setMedicationName("소화제");
        medicationSchedule.setMedicationStartdate(LocalDate.now().minusDays(3));
        medicationSchedule.setMedicationEnddate(LocalDate.now().plusDays(3));
        medicationSchedule.setCreatedAt(LocalDateTime.now());
        medicationSchedule.setUpdatedAt(LocalDateTime.now());

        // Map들은 모두 LinkedHashMap으로
        Map<String,Object> description = new LinkedHashMap<>();
        List<Map<String, Object>> candidates = new ArrayList<>();
        Map<String, Object> candidate = new LinkedHashMap<>();

        candidate.put("image", "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0");
        candidate.put("dosage", "");
        candidate.put("category", "소화성궤양용제");
        candidate.put("extraInfo", "시메티딘");
        candidate.put("appearance", "이약은연녹색의원형정제이다.");
        candidate.put("dosageForm", "원형");

        Map<String, Object> detailDescription = new LinkedHashMap<>();
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("용법 및 용량", "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용량인 1회 400mg을 하루 2회 투여하거나, 취침 시 800mg을 투여할 수 있습니다. 그러나 신장 기능이 저하된 경우에는 용량을 조절해야 하며, 1일 최대 2.4g을 초과하지 않도록 주의해야 합니다.");
        detail.put("효능 및 효과", "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 치료에 효과적입니다. 특히 노인 환자에게는 위 점막의 염증이나 궤양을 개선하는 데 도움을 줄 수 있습니다.");
        detail.put("복약 시 주의 사항", "타가틴정을 복용할 때는 졸음이나 어지러움이 올 수 있으므로 주의가 필요합니다. 또한, 신장 기능이 저하된 환자는 용량을 줄이거나 투여 간격을 늘려야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 알코올과 흡연은 피하는 것이 좋으며, 다른 약물과의 상호작용에 주의해야 합니다.");
        detailDescription.put("상세", detail);

        Map<String, Object> keyword = new LinkedHashMap<>();
        keyword.put("용법 및 용량", "1회 400mg, 하루 2회, 취침 시 800mg 가능");
        keyword.put("효능 및 효과",  "위염 개선, 궤양 치료, 역류성식도염 완화");
        keyword.put("복약 시 주의 사항", "졸음 주의, 신장 기능 저하 시 감량, 유당불내증 주의");
        detailDescription.put("키워드", keyword);

        candidate.put("description", detailDescription);
        candidate.put("productName", "타가틴정");
        candidate.put("thicknessMm", "4.7");
        candidate.put("formCodeName", "나정");
        candidate.put("manufacturer", "위더스제약(주)");

        candidates.add(candidate);
        description.put("drug_candidates", candidates);
        medicationSchedule.setDescription(description);


        String[] medicationTimes = {"AFTER_BREAKFAST", "AFTER_LUNCH", "AFTER_DINNER"};
        medicationSchedule.setMedicationTime(medicationTimes);
        medicationSchedule.setIsDeleted(false);
        medicationSchedulesRepository.save(medicationSchedule);

        LocalDateTime now = LocalDateTime.now();
        MedicationTime[] timeEnums = {MedicationTime.AFTER_BREAKFAST, MedicationTime.AFTER_LUNCH, MedicationTime.AFTER_DINNER};
        for (int day = -3; day <= 3; day++) {
            LocalDate medicationDate = LocalDate.now().plusDays(day);

            for (int timeIdx = 0; timeIdx < 3; timeIdx++) {
                Medications medication = new Medications();
                medication.setMedicationSchedules(medicationSchedule);
                medication.setMedicationPhotoPath(null);
                medication.setMedicationSchedule(timeEnums[timeIdx]);
                medication.setMedicationDate(medicationDate);
                medication.setMedicationPhotoPath(null);

                // 현재 시간 이전인 경우만 복용 시간 설정
                LocalDateTime medicationDateTime = medicationDate.atTime(8 + timeIdx * 4, 0); // 8시, 12시, 16시
                if (medicationDateTime.isBefore(now)) {
                    medication.setMedicatedAt(medicationDateTime);
                } else {
                    medication.setMedicatedAt(null);
                }

                medication.setCreatedAt(LocalDateTime.now());
                medication.setUpdatedAt(LocalDateTime.now());
                medication.setIsDeleted(false);
                medicationsRepository.save(medication);
            }
        }


        // 오늘 Meeting 4개
        String[] title = {"최근 건강 변화 상담", "8월 정기 상담", "임플란트 예약 상담", "재활치료 경과 상담"};
        String[] classification = {null, null, "치과", "정형외과"};
        String[] hospital = {null, null, "서울미소치과의원", "서울삼성정형외과의원"};
        String[] doctor = {null, null, "고영우", "김영규"};
        LocalDateTime nextHour = now.plusHours(1).withMinute(0).withSecond(0).withNano(0);
        for (int i = 0; i < 4; i++) {
            MeetingMatches meeting = new MeetingMatches();
            meeting.setEmployee(employee);
            meeting.setGuardian(guardian);
            meeting.setSenior(seniors[i]);
            meeting.setMeetingTime(nextHour.plusHours(i));
            meeting.setMatchedAt(LocalDateTime.now());
            meeting.setCreatedAt(LocalDateTime.now());
            meeting.setStatus(ConsultationStatus.CONDUCTED);
            meeting.setAlgorithmInfo("BackTracking Algorithm");
            meeting.setTitle(title[i]);
            if(i==0) meeting.setStartedAt(meeting.getMeetingTime().minusHours(3));  // 시연용으로 일단 열어두기
            else meeting.setStartedAt(meeting.getMeetingTime().minusMinutes(20));
            meeting.setEndedAt(meeting.getMeetingTime().plusMinutes(40));
            meeting.setIsDeleted(false);

            if (i < 2) {
                // withEmployee
                meeting.setMeetingType("withEmployee");
                meeting.setContent(null);
                meeting.setClassification(null);
                meeting.setHospitalName(null);
                meeting.setDoctorName(null);
            } else {
                // withDoctor
                meeting.setMeetingType("withDoctor");
                meeting.setContent(null);
                meeting.setClassification(classification[i]);
                meeting.setHospitalName(hospital[i]);
                meeting.setDoctorName(doctor[i]);
            }

            meetingMatchesRepository.save(meeting);
        }


        // 다른날 Meeting 4개
        String[] titleNext = {"가족 면담", "투약 관련 상담", "수슬 예약 상담", "시력 저하 진료"};
        String[] classificationNext = {null, null, "외과", "안과"};
        String[] hospitalNext = {null, null, "삼성병원", "서울멀티안과의원"};
        String[] doctorNext = {null, null, "최경민", "양재원"};

        for (int i = 0; i < 4; i++) {
            MeetingMatches meeting = new MeetingMatches();
            meeting.setEmployee(employee);
            meeting.setGuardian(guardian);
            meeting.setSenior(seniors[i]);
            meeting.setMeetingTime(now.plusDays(i*2 + 5).withHour(i + 12).withMinute(0).withSecond(0).withNano(0));
            meeting.setMatchedAt(LocalDateTime.now());
            meeting.setCreatedAt(LocalDateTime.now());
            meeting.setStatus(ConsultationStatus.CONDUCTED);
            meeting.setAlgorithmInfo("BackTracking Algorithm");
            meeting.setTitle(titleNext[i]);
            meeting.setStartedAt(meeting.getMeetingTime().minusMinutes(20));
            meeting.setEndedAt(meeting.getMeetingTime().plusMinutes(40));
            meeting.setIsDeleted(false);

            if (i < 2) {
                // withEmployee
                meeting.setMeetingType("withEmployee");
                meeting.setContent(null);
                meeting.setClassification(null);
                meeting.setHospitalName(null);
                meeting.setDoctorName(null);
            } else {
                // withDoctor
                meeting.setMeetingType("withDoctor");
                meeting.setContent(null);
                meeting.setClassification(classificationNext[i]);
                meeting.setHospitalName(hospitalNext[i]);
                meeting.setDoctorName(doctorNext[i]);
            }

            meetingMatchesRepository.save(meeting);
        }



        // 환자 5명 만들기
        String[] namesBefore = {"박정자","김춘자","이정순","최성호","오성수"};
        String[] birthdayBefore = {"19400418","19470203","19430708","19500113","19411115"};
        Gender[] genderBefoer = {Gender.FEMALE, Gender.FEMALE, Gender.FEMALE, Gender.MALE, Gender.MALE};
        Integer[] admissionDateBefore = {60,50,40,30,40,50};
        String[] memoBefore = {"치매가 있으셔서 사람을 잘 못알아보심","가족을 매우 그리워하심",
                "매우 잘 적응하고 계심","식사를 자주 거르심","귀가 어두우셔서 크게 말해야 알아 들으심."};

        Seniors[] seniorsBefore = new Seniors[5];
        for(int i=0;i<5;i++){
            seniorsBefore[i] = new Seniors();
            seniorsBefore[i].setName(namesBefore[i]);
            seniorsBefore[i].setBirthDate(dateTimeConverter.stringToLocalDate(birthdayBefore[i]));
            seniorsBefore[i].setGender(genderBefoer[i]);
            seniorsBefore[i].setAdmissionDate(LocalDate.now().minusDays(admissionDateBefore[i]));
            seniorsBefore[i].setNote(memoBefore[i]);
            seniorsBefore[i].setOrganization(organizationsRepository.findById(1).orElse(null));
            seniorsBefore[i] = seniorsRepository.save(seniorsBefore[i]);

            // 시니어-사용자 관계 생성
            SeniorUserRelations employeeRelation = new SeniorUserRelations();
            employeeRelation.setSenior(seniorsBefore[i]);
            employeeRelation.setUser(employee);
            employeeRelation.setRole(Role.EMPLOYEE);
            employeeRelation.setId(new SeniorUserRelationsId(employee.getId(), seniorsBefore[i].getId()));
            seniorUserRelationsRepository.save(employeeRelation);


            SeniorUserRelations guardianRelation = new SeniorUserRelations();
            guardianRelation.setSenior(seniorsBefore[i]);
            guardianRelation.setUser(guardian);
            guardianRelation.setRole(Role.GUARDIAN);
            guardianRelation.setId(new SeniorUserRelationsId(guardian.getId(), seniorsBefore[i].getId()));
            seniorUserRelationsRepository.save(guardianRelation);
        }

        // 이전날 Meeting 5개
        String[] titleBefore = {"장기 요양 등급 상담", "요양 프로그램 안내 상담", "치료 현황 상담", "건강 검진 결과 상담", "피부 염증 치료"};
        String[] classificationBefore = {null, null, null, "종합병원", "피부과"};
        String[] hospitalBefore = {null, null, null, "역삼종합병원", "강남피부전문의원"};
        String[] doctorBefore = {null, null, null, "이태호", "박병찬"};

        for (int i = 0; i < 5; i++) {
            MeetingMatches meeting = new MeetingMatches();
            meeting.setEmployee(employee);
            meeting.setGuardian(guardian);
            meeting.setSenior(seniorsBefore[i]);
            meeting.setMeetingTime(now.minusDays(i*2 + 5).withHour(i + 12).withMinute(0).withSecond(0).withNano(0));
            meeting.setMatchedAt(LocalDateTime.now());
            meeting.setCreatedAt(LocalDateTime.now());
            meeting.setStatus(ConsultationStatus.CONDUCTED);
            meeting.setAlgorithmInfo("BackTracking Algorithm");
            meeting.setTitle(titleBefore[i]);
            meeting.setStartedAt(meeting.getMeetingTime().minusMinutes(20));
            meeting.setEndedAt(meeting.getMeetingTime().plusMinutes(40));
            meeting.setIsDeleted(false);

            if (i < 3) {
                // withEmployee
                meeting.setMeetingType("withEmployee");
                meeting.setContent(null);
                meeting.setClassification(null);
                meeting.setHospitalName(null);
                meeting.setDoctorName(null);
            } else {
                // withDoctor
                meeting.setMeetingType("withDoctor");
                meeting.setContent(null);
                meeting.setClassification(classificationBefore[i]);
                meeting.setHospitalName(hospitalBefore[i]);
                meeting.setDoctorName(doctorBefore[i]);
            }

            meetingMatchesRepository.save(meeting);
        }


        return ResponseEntity.ok(CommonResponseDto.success("Mock 데이터 생성 완료", null));

    }

}
