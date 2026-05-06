package com.yldlxj.pv.inspect.project;

import com.yldlxj.pv.inspect.common.BaseEntity;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("inspect_device")
public class InspectDevice extends BaseEntity {

    private Long projectId;

    private String deviceName;

    private String deviceModel;

    public InspectDevice() {
    }

    public InspectDevice(Long projectId, String deviceName, String deviceModel) {
        this.projectId = projectId;
        this.deviceName = deviceName;
        this.deviceModel = deviceModel;
    }
}
