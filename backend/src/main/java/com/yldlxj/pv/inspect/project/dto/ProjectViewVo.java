package com.yldlxj.pv.inspect.project.dto;

import com.yldlxj.pv.inspect.project.InspectDevice;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProjectViewVo {

    private Long id;
    private String projectName;
    private String propertyCompany;
    private String stationType;
    private String province;
    private String city;
    private String droneCertificateUrl;
    private String specialOperationCertUrl;
    private String sectionIds;
    private List<InspectDevice> devices;
    private LocalDateTime createTime;
}
