package com.yldlxj.pv.inspect.station.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class StationViewVo {

    private Long id;
    private Long projectId;
    private String projectName;
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
    private Long lastInspectorId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastInspectTime;

    private Integer status;
    private List<Map<String, Object>> records;
}
