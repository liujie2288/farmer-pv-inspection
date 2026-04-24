package com.yldlxj.pv.inspect.device;

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
}
