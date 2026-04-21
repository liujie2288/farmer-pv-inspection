package com.pv.inspection.project.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class ProjectDTO {

    @NotBlank(message = "项目名称不能为空")
    @Size(max = 100, message = "项目名称最长100字符")
    private String projectName;

    @NotBlank(message = "产权公司不能为空")
    @Size(max = 100, message = "产权公司最长100字符")
    private String propertyCompany;

    @NotBlank(message = "电站类型不能为空")
    @Size(max = 50, message = "电站类型最长50字符")
    private String stationType;
}
