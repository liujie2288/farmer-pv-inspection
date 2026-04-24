package com.yldlxj.pv.inspect.plan;

import com.baomidou.mybatisplus.annotation.*;
import com.yldlxj.pv.inspect.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("inspect_plan")
public class InspectPlan extends BaseEntity {

    private String planName;

    private Long projectId;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer status;

    private Long parentId;

    private Integer farmerCount;

    private Integer inspectedCount;
}
