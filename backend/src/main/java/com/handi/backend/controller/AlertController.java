package com.handi.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.entity.Users;
import com.handi.backend.repository.UsersRepository;
import com.handi.backend.service.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@Slf4j
@RequestMapping("/api/v1/alert/test")
@RequiredArgsConstructor
public class AlertController {

    private final UsersRepository usersRepository;

    @GetMapping("/{id}")
    public ResponseEntity<CommonResponseDto<?>> alertTest(
            @PathVariable Integer id){
        log.info("FCM 알람 테스트 : {}", id);
        Users user = usersRepository.findById(id).orElse(null);

        if(user == null){
            return ResponseEntity.ok().body(CommonResponseDto.error("해당 유저 없음"));
        }

        String title = "테스트 알림 title 입니다";
        String message = "테스트 알림 message 입니다";
        String type = "테스트 알림 type 입니다";

        try{
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> dataMap = new HashMap<>();
            dataMap.put("userId", user.getId());
            String dataJson = mapper.writeValueAsString(dataMap);

            com.google.firebase.messaging.Message fcmMessage = Message.builder()
                    .setToken(user.getFcmToken())
                    .setNotification(
                            Notification.builder()
                                    .setTitle(title)
                                    .setBody(message)
                                    .build())
                    .putData("type", type)
                    .putData("data", dataJson)
                    .build();
            FirebaseMessaging.getInstance().send(fcmMessage);
            return ResponseEntity.ok().body(CommonResponseDto.success("알림 테스트 성공"));
        }catch (Exception e){
            throw new RuntimeException("FCM 메시지 전송 실패", e);
        }
    }
}
