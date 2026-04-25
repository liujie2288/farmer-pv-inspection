package com.yldlxj.pv.inspect.project.dto;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.List;

@Data
public class ProjectDto {

    @NotBlank(message = "项目名称不能为空")
    @Size(max = 100, message = "项目名称最长100字符")
    private String projectName;

    @NotBlank(message = "产权公司不能为空")
    @Size(max = 100, message = "产权公司最长100字符")
    private String propertyCompany;

    @NotBlank(message = "电站类型不能为空")
    @Size(max = 50, message = "电站类型最长50字符")
    private String stationType;

    @Size(max = 10, message = "省份最长10字符")
    private String province;

    @Size(max = 20, message = "城市最长20字符")
    private String city;

    @Size(max = 255, message = "无人机合格证图片地址最长255字符")
    private String droneCertificateUrl;

    @Size(max = 255, message = "特种作业操作证图片地址最长255字符")
    private String specialOperationCertUrl;

    private String sectionIds;

    @Valid
    private List<DeviceItem> devices;

    @Data
    public static class DeviceItem {
        private Long id;

        @NotBlank(message = "设备名称不能为空")
        @Size(max = 50, message = "设备名称最长50字符")
        private String deviceName;

        @Size(max = 50, message = "设备型号最长50字符")
        private String deviceModel;
    }
}
