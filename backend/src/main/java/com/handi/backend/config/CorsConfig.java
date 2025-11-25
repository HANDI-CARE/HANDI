package com.handi.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000",
                        "http://localhost:8090",
                        "http://localhost:8080",
                        "https://hound-natural-whale.ngrok-free.app", // 태호 ngrok
                        "https://mutual-crab-preferably.ngrok-free.app", // 경민 ngrok
                        "http://70.12.247.69:8080",
                        "http://localhost:5173",
                        "http://70.12.247.69:5173",
                        "http://70.12.247.73:5173",
                        "https://api.brewprint.xyz",
                        "https://handi.brewprint.xyz",
                        "https://dzsr0qrab0tf2.cloudfront.net",
                        "https://localhost"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOrigin("http://localhost:3000");
        configuration.addAllowedOrigin("http://localhost:8090");
        configuration.addAllowedOrigin("http://localhost:8080");
        configuration.addAllowedOrigin("https://hound-natural-whale.ngrok-free.app");
        configuration.addAllowedOrigin("https://mutual-crab-preferably.ngrok-free.app");
        configuration.addAllowedOrigin("https://70.12.247.69:8080");
        configuration.addAllowedOrigin("http://localhost:5173");
        configuration.addAllowedOrigin("http://70.12.247.69:8080");
        configuration.addAllowedOrigin("http://70.12.247.69:5173");
        configuration.addAllowedOrigin("http://70.12.247.73:5173");
        configuration.addAllowedOrigin("https://api.brewprint.xyz");
        configuration.addAllowedOrigin("https://handi.brewprint.xyz");
        configuration.addAllowedOrigin("https://dzsr0qrab0tf2.cloudfront.net");
        configuration.addAllowedOrigin("https://localhost");
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
} 