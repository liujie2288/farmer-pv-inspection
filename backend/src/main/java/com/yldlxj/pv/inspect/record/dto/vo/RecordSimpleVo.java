package com.yldlxj.pv.inspect.record.dto.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RecordSimpleVo {
    private Long recordId;
    private String planName;
    private Integer planStatus;
    private String projectName;
    private String stationOwnerName;
    private Long inspectorId;
    private String inspectorName;
    private LocalDateTime inspectorTime;
    private LocalDateTime editDeadline;
    private Boolean canEdit;
}
