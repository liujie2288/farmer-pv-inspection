package com.yldlxj.pv.inspect.farmer;

import com.baomidou.mybatisplus.annotation.*;
import com.yldlxj.pv.inspect.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("farmer")
public class Farmer extends BaseEntity {

    private Long projectId;

    private String farmerCode;

    private String farmerName;

    private String powerAccount;

    private String inverterSn;

    private String inverterBrand;

    private String moduleSpec;

    private Integer moduleCount;

    private BigDecimal capacityKw;

    private Integer status;

    private LocalDateTime lastInspectTime;

    private Long lastInspectorId;
}
