package com.yldlxj.pv.inspect.station.dto;

import lombok.Data;

import javax.validation.constraints.NotEmpty;
import java.util.List;

@Data
public class BatchDeleteDto {
    @NotEmpty(message = "请选择要删除的电站")
    private List<Long> ids;
}
