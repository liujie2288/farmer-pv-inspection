package com.pv.inspection.plan;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("inspect_plan")
public class InspectPlan {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String planName;

    private Long projectId;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer status;

    private Long parentId;

    private Integer farmerCount;

    private Integer inspectedCount;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
