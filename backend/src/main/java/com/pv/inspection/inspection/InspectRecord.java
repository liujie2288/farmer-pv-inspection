package com.pv.inspection.inspection;

import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@TableName(value = "inspect_record", autoResultMap = true)
public class InspectRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long planId;

    private Long farmerId;

    private Long inspectorId;

    private Long projectId;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> checklistResult;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> photoUrls;

    private BigDecimal longitude;

    private BigDecimal latitude;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
