package com.yldlxj.pv.inspect.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum UserRole {

    ADMIN("admin", "管理员"),
    INSPECTOR("inspector", "巡检员");

    @EnumValue
    @JsonValue
    private final String code;
    private final String label;

    public static UserRole of(String code) {
        for (UserRole r : values()) {
            if (r.code.equals(code)) return r;
        }
        throw new IllegalArgumentException("未知的UserRole: " + code);
    }
}
