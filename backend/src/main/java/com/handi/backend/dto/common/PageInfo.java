package com.handi.backend.dto.common;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Page;

@Schema(description = "페이징 정보")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PageInfo {
    @Schema(description = "현재 페이지 번호 (1부터 시작)", example = "1")
    private int page;

    @Schema(description = "페이지 크기", example = "10")
    private int size;

    @Schema(description = "전체 요소 개수", example = "100")
    private long totalElements;

    @Schema(description = "전체 페이지 수", example = "10")
    private int totalPages;

    @Schema(description = "첫 페이지 여부", example = "true")
    private boolean first;

    @Schema(description = "마지막 페이지 여부", example = "false")
    private boolean last;

    @Schema(description = "다음 페이지 존재 여부", example = "true")
    private boolean hasNext;

    @Schema(description = "이전 페이지 존재 여부", example = "false")
    private boolean hasPrevious;

    @Schema(description = "현재 페이지가 비어있는지 여부", example = "false")
    private boolean empty;

    // Spring Data Page 객체에서 변환하는 편의 메서드
    public static PageInfo from(Page<?> page) {
        int currentPage = page.getTotalElements() == 0 ? 1 : page.getNumber() + 1;
        return new PageInfo(
                currentPage, // 1-based
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                page.hasNext(),
                page.hasPrevious(),
                page.isEmpty()
        );
    }
}