package com.yldlxj.pv.inspect.plan.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PlanProjectViewVo {

    private Long id;

    private Long planId;

    private String planName;

    private Long projectId;

    private String projectName;

    private LocalDate startTime;

    private LocalDate endTime;

    private Integer status;

    private Integer totalCount;

    private Integer inspectedCount;

    private Double completionRate;
}
