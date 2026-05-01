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

    public Double getCompletionRate() {
        if (totalCount == null || totalCount <= 0) {
            return null;
        } else if (inspectedCount == null || inspectedCount <= 0) {
            return 0.0;
        } else {
            return BigDecimal.valueOf(inspectedCount)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalCount), 2, RoundingMode.HALF_UP)
                    .doubleValue();
        }
    }
}
