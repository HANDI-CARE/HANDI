package com.handi.backend.config;

import com.handi.backend.service.CustomOAuth2UserService;
import com.handi.backend.util.CustomSuccessHandler;
import com.handi.backend.util.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {
    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomSuccessHandler customSuccessHandler;
    private final CorsConfig corsConfig;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CSRF 비활성화
                .csrf(AbstractHttpConfigurer::disable)

                // CORS 설정
                .cors(cors -> cors.configurationSource(corsConfig.corsConfigurationSource()))

                // 세선 Stateless
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                //URL 접근 권한
                .authorizeHttpRequests(auth -> auth
                                // Swagger UI 관련 경로 허용
                                .requestMatchers("/swagger-ui/**",
                                        "/swagger-ui.html",
                                        "/api-docs/**",
                                        "/swagger-resources/**",
                                        "/webjars/**").permitAll()

                                // OAuth2 로그인 관련 경로 허용
                                .requestMatchers("/login/**", "/oauth2/**").permitAll()
                                .requestMatchers("/auth/refresh").permitAll()
                                
                                // Mock OAuth 테스트 경로 허용
                                .requestMatchers("/mock-oauth/**").permitAll()

                                // 공통 사용자 기능 - 모든 로그인 사용자 접근 가능
                                .requestMatchers("/api/v1/users/**").authenticated()

                                // 관리자 전용 API - ADMIN 권한 필요
                                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                                // 직원 전용 API - EMPLOYEE 권한 필요
                                .requestMatchers("/api/v1/employees/**").hasRole("EMPLOYEE")

                                // 보호자 전용 API - GUARDIAN 권한 필요
                                .requestMatchers("/api/v1/guardians/**").hasRole("GUARDIAN")

//                        // 기타 API 인증 필요
//                        .requestMatchers("/api/**").authenticated()
                                .requestMatchers("/api/**").permitAll()

                                // 기타 모든 요청은 인증 필요
                                .anyRequest().permitAll()
                )

                // JWT 인증 필터 추가
                // Spring Security 필터 체인에 등록
                // UsernamePasswordAuthenticationFilter 이전에 실행되도록함
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                // OAuth 처리
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(customSuccessHandler))
        ;

        return http.build();
    }

}
