package com.handi.backend.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Role {
    EMPLOYEE("EMPLOYEE", "요양사"),
    ADMIN("ADMIN", "관리자"),
    GUARDIAN("GUARDIAN", "보호자");

    private final String value;
    private final String label;

    // 역직렬화 Json -> enum
    @JsonCreator
    public static Role from(String string) {
        for (Role role : values()) {
            if (role.value.equals(string)) {
                return role;
            }
        }
        throw new IllegalArgumentException("알 수 없는 역할입니다 : " + string);
    }

    // 직렬화 enum -> Json
    @JsonValue
    public String toJson() {
        return value;
    }

}
