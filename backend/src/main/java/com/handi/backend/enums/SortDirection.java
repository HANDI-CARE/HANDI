package com.handi.backend.enums;

import lombok.Getter;

/**
 * 정렬 순서 enum
 * ASC, asc, DESC, desc 대소문자를 가리지 않음
 */
@Getter
public enum SortDirection {
    ASC("asc"),
    DESC("desc");

    private final String value;

    SortDirection(String value) {
        this.value = value;
    }

}
