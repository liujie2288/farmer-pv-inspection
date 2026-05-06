package com.yldlxj.pv.inspect.record;

import com.baomidou.mybatisplus.annotation.*;
import com.yldlxj.pv.inspect.common.BaseEntity;
import com.yldlxj.pv.inspect.config.ChecklistResultTypeHandler;
import com.yldlxj.pv.inspect.config.PhotoListTypeHandler;
import com.yldlxj.pv.inspect.config.WatermarkConfigTypeHandler;
import com.yldlxj.pv.inspect.record.dto.ChecklistSectionDto;
import com.yldlxj.pv.inspect.record.dto.PhotoSectionDto;
import com.yldlxj.pv.inspect.record.dto.WatermarkConfigDto;
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

    private String weather;

    private String deviceName;

    private String deviceModel;

    @TableField(typeHandler = WatermarkConfigTypeHandler.class)
    private WatermarkConfigDto watermarkConfig;

    @TableField(typeHandler = ChecklistResultTypeHandler.class)
    private List<ChecklistSectionDto> checklistResult;

    @TableField(typeHandler = PhotoListTypeHandler.class)
    private List<PhotoSectionDto> photos;

    private BigDecimal longitude;

    private BigDecimal latitude;

    private Integer status;

    private String rejectReason;

    private LocalDateTime editDeadline;

    private Integer pdfStatus;

    private Integer pdfRetry;

    private String pdfUrl;

    @Version
    private Integer version;

    public void cleanPdf() {
        this.pdfStatus = 0;
        this.pdfRetry = 0;
        this.pdfUrl = null;
    }
}
