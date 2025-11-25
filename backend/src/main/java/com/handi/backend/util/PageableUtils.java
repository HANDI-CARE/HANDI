package com.handi.backend.util;

import com.handi.backend.enums.SortDirection;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * 페이징 관련 유틸리티 클래스
 */
public class PageableUtils {

    /**
     * 기존 Pageable에 정렬만 교체하여 적용
     *
     * @param pageable          기존 Pageable 객체
     * @param sortBy           정렬 필드명
     * @param sortDirection    정렬 방향
     * @return 정렬이 교체된 Pageable 객체
     */
    public static Pageable withSort(Pageable pageable, String sortBy, SortDirection sortDirection) {
        // 정렬 필드가 없거나 기존과 동일하면 그대로 반환
        if (sortBy == null || sortBy.trim().isEmpty()) {
            return pageable;
        }
        
        if (sortDirection == null) {
            sortDirection = SortDirection.ASC;
        }
        
        // 새로운 정렬 생성
        Sort newSort = Sort.by(
                sortDirection == SortDirection.DESC ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy
        );
        
        // 기존 정렬과 동일한지 확인
        Sort currentSort = pageable.getSort();
        if (isSameSort(currentSort, newSort)) {
            return pageable;  // 동일한 정렬이면 기존 객체 반환
        }
        
        // 불가피하게 새 객체 생성 (Spring Data의 Pageable은 불변객체)
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), newSort);
    }
    
    /**
     * 두 Sort 객체가 동일한지 비교
     */
    private static boolean isSameSort(Sort sort1, Sort sort2) {
        if (sort1 == null && sort2 == null) return true;
        if (sort1 == null || sort2 == null) return false;
        return sort1.equals(sort2);
    }

    /**
     * 기존 Pageable에 추가 정렬 조건을 결합
     *
     * @param pageable          기존 Pageable 객체
     * @param additionalSortBy  추가할 정렬 필드명
     * @param sortDirection     추가할 정렬 방향
     * @return 기존 정렬과 새 정렬이 결합된 Pageable 객체
     */
    public static Pageable addSort(Pageable pageable, String additionalSortBy, SortDirection sortDirection) {
        if (additionalSortBy == null || additionalSortBy.trim().isEmpty()) {
            return pageable;
        }
        
        Sort.Direction direction = sortDirection == SortDirection.DESC ? 
                Sort.Direction.DESC : Sort.Direction.ASC;
        
        // 기존 정렬을 무시하고 새로운 정렬만 적용
        Sort newSort = Sort.by(direction, additionalSortBy);
        
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), newSort);
    }

}