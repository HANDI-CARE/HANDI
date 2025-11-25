package com.handi.backend.controller;

import com.handi.backend.dto.ai.video.VideoSummaryRequest;
import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.meeting.*;
import com.handi.backend.entity.MeetingMatches;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.repository.MeetingMatchesRepository;
import com.handi.backend.service.RabbitMQService;
import io.livekit.server.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.PostConstruct;
import livekit.LivekitEgress;
import livekit.LivekitWebhook.WebhookEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import retrofit2.Call;
import retrofit2.Response;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/video")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "✅ Video", description = "LiveKit 화상 상담")
public class VideoController {

    @Value("${livekit.api.key}")
    private String LIVEKIT_API_KEY;

    @Value("${livekit.api.secret}")
    private String LIVEKIT_API_SECRET;

    @Value("${livekit.api.http-url}")
    private String LIVEKIT_HTTP_URL;

    private EgressServiceClient egressClient; // final 제거, 초기화 제거

    private final MeetingMatchesRepository meetingMatchesRepository;

    private final RabbitMQService rabbitMQService;

    // 의존성 주입 후 실행 ( @Value 받고 실행 )
    @PostConstruct
    private void initEgressClient() {
        this.egressClient = EgressServiceClient.createClient(LIVEKIT_HTTP_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    }


    @PostMapping("/token")
    @Operation(summary = "✅ 화상채팅을 위한 Token 발급 API", description = "roomName을 기반으로 토큰 발급")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "토큰 발급 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "404", description = "미팅을 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<TokenResponseDto>> getToken(
            @Parameter(description = "토큰 발급 요청 데이터", required = true)
            @RequestBody TokenRequestDto tokenRequestDto) {

//        MeetingMatches meetingMatches = meetingMatchesRepository.findById(Integer.parseInt(tokenRequestDto.getRoomName()))
//                .orElseThrow(() -> new NotFoundException("해당 미팅이 없습니다."));
//
//        if(tokenRequestDto.getRoomName() == null || tokenRequestDto.getParticipantName() == null){
//            throw new RuntimeException("해당 정보가 없습니다.");
//        }
//
//        LocalDateTime now = LocalDateTime.now();
//
//        if (now.isBefore(meetingMatches.getMeetingTime().minusMinutes(20))) {
//            throw new RuntimeException("아직 토큰을 발급할 수 없습니다. 미팅 20분 전부터 가능합니다.");
//        }

        log.info("토큰 발급 요청 : RoomName={}, ParticipantName={}", tokenRequestDto.getRoomName(), tokenRequestDto.getParticipantName());

        AccessToken token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
        token.setName(tokenRequestDto.getParticipantName());
        token.setIdentity(tokenRequestDto.getParticipantName());
        token.addGrants(new RoomJoin(true), new RoomName(tokenRequestDto.getRoomName()));

        TokenResponseDto tokenResponseDto = new TokenResponseDto();
        tokenResponseDto.setToken(token.toJwt());

        return ResponseEntity.ok().body(CommonResponseDto.success("토큰이 발급되었습니다.", tokenResponseDto));
    }

    @Operation(summary = "✅ livekit webhook receiver", description = "WebhookReceiver의 livekit event 응답 확인, ")
    @PostMapping(value = "/livekit/webhook", consumes = "application/webhook+json")
    public ResponseEntity<String> receiveWebhook(@RequestHeader("Authorization") String authHeader, @RequestBody String body) {
        log.info("livekit/webhook API 시작");

        WebhookReceiver webhookReceiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

        log.info("WebhookReceiver 응답 완료");

        try {
            WebhookEvent event = webhookReceiver.receive(body, authHeader);
            log.info("event 발생");
            log.info(event.toString());
            log.info("event 출력 완료");
            log.info("==========================================================================================");
            String status = event.getEvent();
            String roomName = event.getEgressInfo().getRoomComposite().getRoomName();
            String filepath = null;
            if (event.getEgressInfo().getFileResultsCount() > 0) {
                filepath = event.getEgressInfo().getFileResults(0).getFilename();
            } else {
                // 파일 없음 로직
            }

            log.info("status : {}", status);
            log.info("roomName : {}", roomName);
            log.info("filepath : {}", filepath);

            log.info("==========================================================================================");

            // 녹음이 끝났어
            if (status.equals("egress_ended")) {
                String responseFilePath = "openvidu-appdata/" + filepath;
                VideoSummaryRequest result = new VideoSummaryRequest();
                result.setId(Integer.parseInt(roomName));
                result.setLink(responseFilePath);

                log.info("rabbitMQService로 실행");
                rabbitMQService.sendVideoSummaryRequest(result);
                log.info("rabbitMQService 실행 성공");
            }

        } catch (Exception e) {
            log.error("Error validating webhook event: " + e.getMessage());
        }

        log.info("webhook API 종료");

        return ResponseEntity.ok("ok");
    }


    @Operation(summary = "✅ 녹음 시작", description = "녹음 시작")
    @PostMapping("/start")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "녹화 시작 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 - roomName 누락"),
            @ApiResponse(responseCode = "409", description = "이미 녹화가 진행 중"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<?> startRecording(
            @Parameter(description = "녹화 시작 요청 데이터", required = true)
            @RequestBody StartRequest req) {

        log.info("녹화 시작!");

        String roomName = req.getRoomName();
        if (roomName == null || roomName.isBlank()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("errorMessage", "roomName is required"));
        }

        // DB 등에서 이미 진행 중인 녹화가 있는지 확인
        var activeRecording = getActiveRecordingByRoom(roomName);
        if (activeRecording != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of("errorMessage", "Recording already started for this room")
            );
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

        // 파일 경로 예: roomA-20251212121212.ogg
        String filepathStr = String.format("%s-%s.ogg",
                roomName,
                LocalDateTime.now().format(formatter)  // 시간 : 없애기 ( )
        );

        Path filepath = Paths.get(filepathStr);


        LivekitEgress.EncodedFileOutput fileOutput =
                LivekitEgress.EncodedFileOutput.newBuilder().setFileType(LivekitEgress.EncodedFileType.OGG)
                        .setFilepath(filepath.toString())
                        .setDisableManifest(true)
                        .build();

        Call<LivekitEgress.EgressInfo> call = egressClient.startRoomCompositeEgress(
                roomName,
                fileOutput,
                "",
                null,
                null,
                true);
        try {
            Response<LivekitEgress.EgressInfo> response = call.execute();
            log.info("/start API 종료");

            var recording = Map.of(
                    "name", filepath.getFileName(),
                    "startedAt", response.body().getStartedAt() / 1_000_000
            );
            return ResponseEntity.ok(Map.of(
                    "message", "Recording started",
                    "recording", recording
            ));
        } catch (Exception e) {
            System.out.println("Error starting recording.");
            System.out.println(e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("errorMessage", "Error starting recording"));
        }


    }

    @Operation(summary = "✅ 녹음 종료", description = "녹음 종료")
    @PostMapping("/stop")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "녹화 중지 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 - roomName 누락"),
            @ApiResponse(responseCode = "409", description = "녹화가 시작되지 않음"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<?> stopRecording(
            @Parameter(description = "녹화 중지 요청 데이터", required = true)
            @RequestBody StopRequest req) {
        log.info("녹화 종료!!!!");
        String roomName = req.getRoomName();
        if (roomName == null || roomName.isBlank()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("errorMessage", "roomName is required"));
        }

        String activeRecording = getActiveRecordingByRoom(roomName);
        if (activeRecording == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of("errorMessage", "Recording not started for this room")
            );
        }

        Call<LivekitEgress.EgressInfo> call = egressClient.stopEgress(activeRecording);

        try {
            Response<LivekitEgress.EgressInfo> response = call.execute();
            LivekitEgress.FileInfo file = response.body().getFileResults(0);
            String filepathStr = file.getFilename();
            Path filepath = Paths.get(filepathStr);

            var recording = Map.of("name", filepath.getFileName());
            return ResponseEntity.ok(Map.of(
                    "message", "Recording stopped",
                    "recording", recording));
        } catch (Exception e) {
            System.out.println("Error stopping recording.");
            System.out.println(e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("errorMessage", "Error stopping recording"));
        }
    }

    /**
     * 주어진 roomName에 대해 활성(active) 상태인 egress가 존재하면
     * 그 egressId를, 그렇지 않으면 null을 반환합니다.
     */
    private String getActiveRecordingByRoom(String roomName) {
        Call<List<LivekitEgress.EgressInfo>> call = egressClient.listEgress(
                roomName, null, true
        );
        try {
            Response<List<LivekitEgress.EgressInfo>> response = call.execute();
            if (response.isSuccessful() && response.body() != null && !response.body().isEmpty()) {
                // 첫 번째 항목의 egressId 반환
                return response.body().get(0).getEgressId();
            }
        } catch (Exception e) {
            System.out.println("Error listing egresses for room " + roomName);
            System.out.println(e.toString());
        }
        return null;
    }


}