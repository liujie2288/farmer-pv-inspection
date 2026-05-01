package com.yldlxj.pv.inspect.record.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class InspectRecordDto {
    private Long planId;
    private Long stationId;
    private Long projectId;
    private String weather;

    private String deviceName;

    private String deviceModel;

    private List<ChecklistSectionDto> checklistResult;
    private List<PhotoSectionDto> photos;

    private BigDecimal longitude;
    private BigDecimal latitude;
}
