package com.yldlxj.pv.inspect.plan.dto;

import com.yldlxj.pv.inspect.common.enums.PlanStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Data
public class PlanProjectViewVo {

    private Long planProjectId;

    private Long planId;

    private String planName;

    private Long projectId;

    private String projectName;

    private LocalDate startTime;

    private LocalDate endTime;

    private PlanStatus status;

    private Integer totalCount;

    private Integer inspectedCount;

    public double getCompletionRate() {
        if (totalCount == null || totalCount <= 0 || inspectedCount == null || inspectedCount <= 0) {
            return 0.0;
        } else {
            return BigDecimal.valueOf(inspectedCount)
                    .divide(BigDecimal.valueOf(totalCount), 4, RoundingMode.HALF_UP)
                    .movePointRight(2)
                    .doubleValue();
        }
    }
}
