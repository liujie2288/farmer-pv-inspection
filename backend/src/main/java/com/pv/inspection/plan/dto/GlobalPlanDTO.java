package com.pv.inspection.plan.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class GlobalPlanDTO {

    @NotBlank(message = "计划名称不能为空")
    private String planName;

    @NotEmpty(message = "项目列表不能为空")
    private List<Long> projectIds;

    @NotNull(message = "开始时间不能为空")
    private LocalDateTime startTime;

    @NotNull(message = "结束时间不能为空")
    private LocalDateTime endTime;
}
