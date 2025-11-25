package com.handi.backend.converter;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Component
public class DateTimeConverter {

    private static final String DATE_TIME_PATTERN = "yyyyMMddHHmmss";
    private static final String DATE_PATTERN = "yyyyMMdd";
    private static final String TIME_PATTERN = "HHmmss";

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern(DATE_TIME_PATTERN);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern(DATE_PATTERN);
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern(TIME_PATTERN);

    // --- 기존 LocalDateTime 기능 ---

    public LocalDateTime stringToLocalDateTime(String dateTimeString) {
        if (dateTimeString == null || dateTimeString.trim().isEmpty()) {
            return null;
        }

        if (dateTimeString.length() != 14) {
            throw new IllegalArgumentException("날짜시간 문자열은 14자리여야 합니다. (yyyyMMddHHmmss)");
        }

        try {
            return LocalDateTime.parse(dateTimeString, DATE_TIME_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("잘못된 날짜시간 형식입니다: " + dateTimeString, e);
        }
    }

    public String localDateTimeToString(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }

        return dateTime.format(DATE_TIME_FORMATTER);
    }


    // --- LocalDate 기능 ---
    public LocalDate stringToLocalDate(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }

        if (dateString.length() != 8) {
            throw new IllegalArgumentException("날짜 문자열은 8자리여야 합니다. (yyyyMMdd)");
        }

        try {
            return LocalDate.parse(dateString, DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("잘못된 날짜 형식입니다: " + dateString, e);
        }
    }

    public String localDateToString(LocalDate date) {
        if (date == null) {
            return null;
        }

        return date.format(DATE_FORMATTER);
    }


    // --- LocalTime 기능 추가 ---
    public LocalTime stringToLocalTime(String timeString) {
        if (timeString == null || timeString.trim().isEmpty()) {
            return null;
        }

        if (timeString.length() != 6) {
            throw new IllegalArgumentException("시간 문자열은 6자리여야 합니다. (HHmmss)");
        }

        try {
            return LocalTime.parse(timeString, TIME_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("잘못된 시간 형식입니다: " + timeString, e);
        }
    }


    // LocalTime을 문자열(HHmmss)로 변환
    public String localTimeToString(LocalTime time) {
        if (time == null) {
            return null;
        }

        return time.format(TIME_FORMATTER);
    }

}
