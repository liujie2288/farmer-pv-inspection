package com.yldlxj.pv.inspect.plan.dto;

import com.yldlxj.pv.inspect.common.enums.PlanStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Data
public class PlanViewVo {

    private Long planId;

    private String planName;

    private LocalDate startTime;

    private LocalDate endTime;

    private PlanStatus status;

    private Integer projectCount;

    private Integer totalCount;

    private Integer inspectedCount;

    private List<PlanProjectViewVo> items;

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
