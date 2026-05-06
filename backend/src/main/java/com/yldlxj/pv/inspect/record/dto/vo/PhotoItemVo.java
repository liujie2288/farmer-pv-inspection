package com.yldlxj.pv.inspect.record.dto.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PhotoItemVo {
    private Long itemId;
    private String itemName;
    private List<String> urls;

    public PhotoItemVo(Long itemId, String itemName) {
        this.itemId = itemId;
        this.itemName = itemName;
    }
}
