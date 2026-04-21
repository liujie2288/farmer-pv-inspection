package com.pv.inspection.farmer;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("farmer")
public class Farmer {

    @TableId(type = IdType.AUTO)
    private Long id;

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

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
