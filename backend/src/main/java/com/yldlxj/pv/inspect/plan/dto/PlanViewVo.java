package com.yldlxj.pv.inspect.plan.dto;

import com.yldlxj.pv.inspect.common.enums.PlanStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PlanViewVo {

    private Long id;

    private String planName;

    private LocalDate startTime;

    private LocalDate endTime;

    private PlanStatus status;

    private Integer projectCount;

    private Integer totalCount;

    private Integer inspectedCount;

    private Double completionRate;
}
