package com.yldlxj.pv.inspect.plan;

import com.baomidou.mybatisplus.annotation.*;
import com.yldlxj.pv.inspect.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("inspect_plan")
public class InspectPlan extends BaseEntity {

    private String planName;

    private Long planGroupId;

    private Long projectId;

    private LocalDate startTime;

    private LocalDate endTime;

    private Integer status;

    private Integer inverterCount;

    private Integer inspectedCount;
}
