package com.handi.backend.dto.common;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Page;

import java.util.ArrayList;
import java.util.List;


@Schema(description = "페이징 응답 DTO")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PageResponseDto<T> {
    @Schema(description = "성공 여부", example = "true")
    private Boolean success;

    @Schema(description = "응답 메시지", example = "요청이 성공적으로 처리되었습니다.")
    private String message;

    @Schema(description = "페이징된 응답 결과")
    private List<T> result;

    @Schema(description = "페이징 정보")
    private PageInfo pageInfo;

    // Spring Data Page에서 직접 변환 (가장 자주 사용)
    public static <T> PageResponseDto<T> success(Page<T> page) {
        return new PageResponseDto<>(
                true,
                "목록 조회가 성공적으로 처리되었습니다.",
                page.getContent(),
                PageInfo.from(page)
        );
    }

    // 커스텀 메시지와 함께
    public static <T> PageResponseDto<T> success(String message, Page<T> page) {
        return new PageResponseDto<>(
                true,
                message,
                page.getContent(),
                PageInfo.from(page)
        );
    }

    // 에러 응답
    public static <T> PageResponseDto<T> error(String message) {
        return new PageResponseDto<>(
                false,
                message,
                new ArrayList<>(),
                null
        );
    }

    // 빈 페이지 응답
    public static <T> PageResponseDto<T> empty() {
        return new PageResponseDto<>(
                true,
                "조회된 데이터가 없습니다.",
                new ArrayList<>(),
                new PageInfo(0, 0, 0, 0, true, true, false, false, true)
        );
    }

    // Page와 변환된 List를 함께 사용하는 정적 메서드 추가
    public static <T, R> PageResponseDto<R> from(Page<T> page, List<R> convertedContent) {
        return new PageResponseDto<>(
                true,
                "목록 조회가 성공적으로 처리되었습니다.",
                convertedContent,
                PageInfo.from(page)
        );
    }

    // 커스텀 메시지와 함께 Page와 변환된 List 사용
    public static <T, R> PageResponseDto<R> from(String message, Page<T> page, List<R> convertedContent) {
        return new PageResponseDto<>(
                true,
                message,
                convertedContent,
                PageInfo.from(page)
        );
    }
}
