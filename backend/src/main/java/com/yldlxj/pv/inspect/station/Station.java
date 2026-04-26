package com.yldlxj.pv.inspect.station;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.yldlxj.pv.inspect.common.BaseEntity;
import com.yldlxj.pv.inspect.common.enums.InspectStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("station")
public class Station extends BaseEntity {

    private Long projectId;

    private String stationCode;

    private String ownerName;

    private String address;

    private String powerAccount;

    private String inverterSn;

    private String inverterBrand;

    private String moduleSpec;

    private Integer moduleCount;

    private BigDecimal capacityKw;

    private BigDecimal longitude;

    private BigDecimal latitude;

    private Long lastInspectRecordId;

    private LocalDateTime lastInspectTime;

}
