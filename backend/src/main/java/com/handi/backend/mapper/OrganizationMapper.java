package com.handi.backend.mapper;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.organization.OrganizationRequestDto;
import com.handi.backend.dto.organization.OrganizationResponseDto;
import com.handi.backend.dto.organization.OrganizationResponseSimpleDto;
import com.handi.backend.entity.Organizations;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OrganizationMapper {

    private final DateTimeConverter dateTimeConverter;

    public OrganizationResponseDto toResponseDto(Organizations organization) {
        return new OrganizationResponseDto(
                organization.getId(),
                organization.getName(),
                dateTimeConverter.localTimeToString(organization.getBreakfastTime()),
                dateTimeConverter.localTimeToString(organization.getLunchTime()),
                dateTimeConverter.localTimeToString(organization.getDinnerTime()),
                dateTimeConverter.localTimeToString(organization.getSleepTime()),
                dateTimeConverter.localDateTimeToString(organization.getCreatedAt()),
                dateTimeConverter.localDateTimeToString(organization.getUpdatedAt())
        );
    }

    public OrganizationResponseSimpleDto toResponseSimpleDto(Organizations organization) {
        return new OrganizationResponseSimpleDto(
                organization.getId(),
                organization.getName(),
                dateTimeConverter.localDateTimeToString(organization.getCreatedAt()),
                dateTimeConverter.localDateTimeToString(organization.getUpdatedAt())
        );
    }


    public Organizations toEntity(OrganizationRequestDto requestDto) {
        Organizations organization = new Organizations();
        organization.setName(requestDto.getName());
        organization.setBreakfastTime(dateTimeConverter.stringToLocalTime(requestDto.getBreakfastTime()));
        organization.setLunchTime(dateTimeConverter.stringToLocalTime(requestDto.getLunchTime()));
        organization.setDinnerTime(dateTimeConverter.stringToLocalTime(requestDto.getDinnerTime()));
        organization.setSleepTime(dateTimeConverter.stringToLocalTime(requestDto.getSleepTime()));
        return organization;
    }

    public void updateEntity(Organizations organization, OrganizationRequestDto requestDto) {
        organization.setName(requestDto.getName());
        organization.setBreakfastTime(dateTimeConverter.stringToLocalTime(requestDto.getBreakfastTime()));
        organization.setLunchTime(dateTimeConverter.stringToLocalTime(requestDto.getLunchTime()));
        organization.setDinnerTime(dateTimeConverter.stringToLocalTime(requestDto.getDinnerTime()));
        organization.setSleepTime(dateTimeConverter.stringToLocalTime(requestDto.getSleepTime()));
    }
}