package com.yldlxj.pv.inspect.project;

import com.baomidou.mybatisplus.annotation.*;
import com.yldlxj.pv.inspect.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("project")
public class Project extends BaseEntity {

    private String projectName;

    private String propertyCompany;

    private String stationType;

    private String province;

    private String city;

    private String droneCertificateUrl;

    private String specialOperationCertUrl;

    private String sectionIds;

    @TableField(exist = false)
    private List<InspectDevice> devices;
}
