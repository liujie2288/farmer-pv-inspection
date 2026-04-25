package com.yldlxj.pv.inspect.plan;

import com.baomidou.mybatisplus.annotation.*;
import com.yldlxj.pv.inspect.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("inspect_plan_project")
public class InspectPlanProject extends BaseEntity {

    private Long planId;

    private Long projectId;

    private Integer totalCount;

    private Integer inspectedCount;
}
