package com.handi.backend.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class StringArrayConverter implements AttributeConverter<String[], String> {

    private static final String DELIMITER = ",";

    @Override
    public String convertToDatabaseColumn(String[] attribute) {
        if (attribute == null || attribute.length == 0) {
            return null;
        }
        return String.join(DELIMITER, attribute);
    }

    @Override
    public String[] convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return new String[0];
        }
        return dbData.split(DELIMITER);
    }
}