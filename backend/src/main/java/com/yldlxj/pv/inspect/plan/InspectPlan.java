package com.yldlxj.pv.inspect.plan;

import com.baomidou.mybatisplus.annotation.*;
import com.yldlxj.pv.inspect.common.BaseEntity;
import com.yldlxj.pv.inspect.common.enums.PlanStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("inspect_plan")
public class InspectPlan extends BaseEntity {

    private String planName;

    private LocalDate startTime;

    private LocalDate endTime;

    private PlanStatus status;

    private Long creatorId;

    private Integer totalCount;

    private Integer inspectedCount;
}
