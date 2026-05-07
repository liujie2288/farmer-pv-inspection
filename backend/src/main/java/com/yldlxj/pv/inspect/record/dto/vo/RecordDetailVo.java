package com.yldlxj.pv.inspect.record.dto.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.yldlxj.pv.inspect.record.dto.WatermarkConfigDto;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecordDetailVo {
    private Long id;
    private String planName;
    private Integer planStatus;
    private String projectName;
    private Long projectId;
    private Long stationId;
    private String stationCode;
    private String stationName;
    private String inspectorName;
    private String weather;
    private String deviceName;
    private String deviceModel;
    private WatermarkConfigDto watermarkConfig;
    private List<ChecklistSectionVo> checklistResult;
    private List<PhotoSectionVo> photos;
    private String thermalImageUrl;
    private BigDecimal longitude;
    private BigDecimal latitude;
    private Boolean canEdit;
    private Integer status;
    private String pdfUrl;
    private String rejectReason;
    private LocalDateTime createTime;
    private LocalDateTime editDeadline;
}
