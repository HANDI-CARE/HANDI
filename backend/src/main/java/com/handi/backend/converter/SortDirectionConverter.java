package com.handi.backend.converter;

import com.handi.backend.enums.SortDirection;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Request Param으로부터 받은 값에 대하여 enum으로 변환할 시 Convertor가 필요함
 * Spring에서 Converter 기능을 지원함
 * JSON형식으로 받는 경우 JsonCreator를 통해 변환 가능
 */
@Component
public class SortDirectionConverter implements Converter<String, SortDirection> {
    @Override
    public SortDirection convert(String source) {
        if (source == null) {
            return SortDirection.ASC;
        }

        for (SortDirection direction : SortDirection.values()) {
            if (direction.getValue().equalsIgnoreCase(source) ||
                    direction.name().equalsIgnoreCase(source)) {
                return direction;
            }
        }

        return SortDirection.ASC;
    }
}
