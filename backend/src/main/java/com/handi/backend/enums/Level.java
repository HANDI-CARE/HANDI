package com.handi.backend.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;


@Getter
@AllArgsConstructor
public enum Level {
    HIGH("HIGH"),
    MEDIUM("MEDIUM"),
    LOW("LOW");


    private final String value;


    // 역직렬화: JSON → enum
    @JsonCreator
    public static Level fromLevel(String string) {
        for (Level level : values()) {
            if (level.value.equals(string)) {
                return level;
            }
        }
        throw new IllegalArgumentException("알 수 없는 레벨: " + string);
    }

    // 직렬화: enum -> JSON
    @JsonValue
    public String toJson() {
        return value;
    }
}
