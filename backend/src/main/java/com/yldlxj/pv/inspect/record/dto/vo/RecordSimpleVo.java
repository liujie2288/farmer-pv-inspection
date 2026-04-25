package com.yldlxj.pv.inspect.record.dto.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RecordSimpleVo {
    private Long recordId;
    private String planName;
    private Long inspectorId;
    private String inspectorName;
    private LocalDateTime inspectorTime;
}
