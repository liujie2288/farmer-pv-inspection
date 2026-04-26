package com.yldlxj.pv.inspect.plan.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdatePlanDto {

    private LocalDate startTime;

    private LocalDate endTime;
}
