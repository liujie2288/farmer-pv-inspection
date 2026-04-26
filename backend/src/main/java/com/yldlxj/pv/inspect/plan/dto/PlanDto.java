package com.yldlxj.pv.inspect.plan.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

@Data
public class PlanDto {

    @NotBlank(message = "任务名称不能为空")
    @Size(max = 30, message = "任务名称不能超过30字")
    private String planName;

    @NotEmpty(message = "至少选择一个项目")
    private List<Long> projectIds;

    @NotNull(message = "开始时间不能为空")
    private LocalDate startTime;

    @NotNull(message = "结束时间不能为空")
    private LocalDate endTime;
}
