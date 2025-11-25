package com.handi.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Value("${app.version:1.0.0}")
    private String appVersion;

    @Value("${server.port:8080}")
    private String serverPort;


    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("2025 A306 Handi API Doc")
                        .description("""
                                ## 서울 3반 A306 Backend API
                                
                                요양원 통합 관리 서비스
 
                                ### 주요 기능
                                - ✅ 사용자 관리 및 인증
                                - ✅ 데이터 CRUD 작업
                                - ✅ WebRTC 및 음성 파일 업로드
                                - ✅ 사용자 스케줄 알림


                                ### Social Login
                                - ✅ 다른 탭에서 로그인이 되어있는 경우 로그인 페이지로 이동하지 않고 바로 로그인 되므로 시크릿 모드로 접속시 확인 가능
                                - ✅ 쿠키에 Access Token, Refresh Token 생성시 성공
                                - ✅ https://www.jwt.io 에서 토큰값 확인 가능
                                
                                http://localhost:8080/oauth2/authorization/google
                                
                                http://localhost:8080/oauth2/authorization/naver
                                
                                http://localhost:8080/oauth2/authorization/kakao
                                
                                ---
                                **참고 페이지**
                                
                                [Notion Page](https://bumpy-galliform-c82.notion.site/SSAFY-2-2308380bcf018025aac7cf316612b701)  
                                
                                [GitLab Page](https://lab.ssafy.com/s13-webmobile1-sub1/S13P11A306)  
                                
                                [Figma Page](https://www.figma.com/files/team/1527464463654017106/project/418018604?fuid=1354353848890509749)
                                """)
                        .version(appVersion))

                // 서버 정보 설정
                .servers(List.of(
                        new Server()
                                .url("https://api.brewprint.xyz")
                                .description("Remote server"),

                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Local Server")
                ));
    }

}