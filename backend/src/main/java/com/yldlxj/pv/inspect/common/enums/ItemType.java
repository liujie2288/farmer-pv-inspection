package com.yldlxj.pv.inspect.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ItemType {

    CHECK(1, "正常/异常"),
    VALUE(2, "实测值"),
    PHOTO(3, "照片");

    @EnumValue
    @JsonValue
    private final int code;
    private final String label;

}
