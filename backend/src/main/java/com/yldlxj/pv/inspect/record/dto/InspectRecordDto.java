package com.yldlxj.pv.inspect.record.dto;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

@Data
public class InspectRecordDto {
    // @NotNull(message = "电站ID不能为空")
    private Long stationId;

    // @NotNull(message = "项目ID不能为空")
    private Long projectId;

    @NotBlank(message = "天气不能为空")
    private String weather;

    private String deviceName;

    private String deviceModel;

    @NotNull(message = "巡检结果不能为空")
    @Valid
    private List<ChecklistSectionDto> checklistResult;

    @Valid
    private List<PhotoSectionDto> photos;

    @NotBlank(message = "红外热成像照片必填")
    private String thermalImageUrl;

    private BigDecimal longitude;
    private BigDecimal latitude;

    @Valid
    private WatermarkConfigDto watermarkConfig;
}
