package com.yldlxj.pv.inspect.inspection;

import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.yldlxj.pv.inspect.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.Map;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "inspect_record", autoResultMap = true)
public class InspectRecord extends BaseEntity {

    private Long planId;

    private Long stationId;

    private Long inspectorId;

    private Long projectId;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> checklistResult;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> photos;

    private BigDecimal longitude;

    private BigDecimal latitude;

    private String pdfUrl;

    private String weather;
}
