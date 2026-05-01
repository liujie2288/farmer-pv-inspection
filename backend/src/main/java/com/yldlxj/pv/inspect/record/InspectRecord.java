package com.yldlxj.pv.inspect.record;

import com.baomidou.mybatisplus.annotation.*;
import com.yldlxj.pv.inspect.common.BaseEntity;
import com.yldlxj.pv.inspect.config.ChecklistResultTypeHandler;
import com.yldlxj.pv.inspect.config.PhotoListTypeHandler;
import com.yldlxj.pv.inspect.record.dto.ChecklistSectionDto;
import com.yldlxj.pv.inspect.record.dto.PhotoSectionDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    @TableField(typeHandler = ChecklistResultTypeHandler.class)
    private List<ChecklistSectionDto> checklistResult;

    @TableField(typeHandler = PhotoListTypeHandler.class)
    private List<PhotoSectionDto> photos;

    private BigDecimal longitude;

    private BigDecimal latitude;

    private String pdfUrl;

    private String weather;

    private String deviceName;

    private String deviceModel;

    private LocalDateTime editDeadline;
}
