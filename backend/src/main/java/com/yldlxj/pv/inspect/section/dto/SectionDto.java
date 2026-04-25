package com.yldlxj.pv.inspect.section.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
public class SectionDto {

    @NotNull(message = "大项序号不能为空")
    private Integer sectionNo;

    @NotBlank(message = "大项名称不能为空")
    @Size(max = 30, message = "大项名称最长30字符")
    private String sectionName;
}
