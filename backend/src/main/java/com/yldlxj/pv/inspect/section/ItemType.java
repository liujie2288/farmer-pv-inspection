package com.yldlxj.pv.inspect.section;

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

    public static ItemType of(int code) {
        for (ItemType t : values()) {
            if (t.code == code) return t;
        }
        throw new IllegalArgumentException("未知的ItemType: " + code);
    }
}
