package com.yldlxj.pv.inspect.record;

import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.yldlxj.pv.inspect.common.BaseEntity;
import com.yldlxj.pv.inspect.record.dto.ChecklistSectionDto;
import com.yldlxj.pv.inspect.record.dto.PhotoSectionDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "inspect_record", autoResultMap = true)
public class InspectRecord extends BaseEntity {

    private Long planId;

    private Long planProjectId;

    private Long stationId;

    private Long inspectorId;

    private Long projectId;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<ChecklistSectionDto> checklistResult;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<PhotoSectionDto> photos;

    private BigDecimal longitude;

    private BigDecimal latitude;

    private String pdfUrl;

    private String weather;
}
