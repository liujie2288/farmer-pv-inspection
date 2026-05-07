package com.yldlxj.pv.inspect.record;

import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
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

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private Long planId;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private Long planProjectId;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private Long stationId;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private Long inspectorId;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private Long projectId;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private String weather;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private String deviceName;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private String deviceModel;

    @TableField(typeHandler = WatermarkConfigTypeHandler.class, updateStrategy = FieldStrategy.ALWAYS)
    private WatermarkConfigDto watermarkConfig;

    @TableField(typeHandler = ChecklistResultTypeHandler.class, updateStrategy = FieldStrategy.ALWAYS)
    private List<ChecklistSectionDto> checklistResult;

    @TableField(typeHandler = PhotoListTypeHandler.class, updateStrategy = FieldStrategy.ALWAYS)
    private List<PhotoSectionDto> photos;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private String thermalImageUrl;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private BigDecimal longitude;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private BigDecimal latitude;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private Integer status;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private String rejectReason;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private LocalDateTime editDeadline;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private Integer pdfStatus;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private Integer pdfRetry;

    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private String pdfUrl;

    @Version
    private Integer version;

    public void cleanPdf() {
        this.pdfStatus = 0;
        this.pdfRetry = 0;
        this.pdfUrl = null;
    }
}
