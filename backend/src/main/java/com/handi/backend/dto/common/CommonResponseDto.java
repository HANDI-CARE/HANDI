package com.handi.backend.dto.common;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "공통 응답 DTO")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CommonResponseDto<T> {

    @Schema(description = "성공 여부", example = "true")
    private boolean success;

    @Schema(description = "응답 메시지", example = "요청이 성공적으로 처리되었습니다.")
    private String message;

    @Schema(description = "응답 결과")
    private T result;

    public static <T> CommonResponseDto<T> success(T result) {
        return new CommonResponseDto<T>(true, "요청이 성공적으로 처리되었습니다.", result);
    }

    public static <T> CommonResponseDto<T> success(String message, T result) {
        return new CommonResponseDto<T>(true, message, result);
    }

    public static <T> CommonResponseDto<T> error(String message) {
        return new CommonResponseDto<T>(false, message, null);
    }
}
