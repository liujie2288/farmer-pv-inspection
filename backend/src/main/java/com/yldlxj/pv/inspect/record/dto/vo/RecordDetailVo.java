package com.yldlxj.pv.inspect.record.dto.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecordDetailVo {
    private Long id;
    private String planName;
    private String stationName;
    private String stationCode;
    private String projectName;
    private String inspectorName;
    private List<ChecklistSectionVo> checklistResult;
    private List<PhotoSectionVo> photos;
    private BigDecimal longitude;
    private BigDecimal latitude;
    private String weather;
    private LocalDateTime createTime;
    private Boolean canEdit;
}
