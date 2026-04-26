package com.yldlxj.pv.inspect.convert;

import com.yldlxj.pv.inspect.common.enums.UserRole;
import com.yldlxj.pv.inspect.user.SysUser;
import com.yldlxj.pv.inspect.user.dto.UserCreateDto;
import com.yldlxj.pv.inspect.user.dto.UserDto;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper
public interface UserConvert {

    // 单例模式（也可以用spring注入，二选一）
    UserConvert INSTANCE = Mappers.getMapper(UserConvert.class);

    SysUser toEntity(UserCreateDto userCreateDto);

    // entity → dto
    UserDto toDto(SysUser sysUser);

    default UserRole mapRole(String role) {
        return role != null ? UserRole.of(role) : null;
    }

    default String mapRole(UserRole role) {
        return role != null ? role.getCode() : null;
    }

    // 映射集合
    List<UserDto> toDtoList(List<SysUser> userList);
}
