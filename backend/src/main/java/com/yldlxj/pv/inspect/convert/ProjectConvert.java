package com.yldlxj.pv.inspect.convert;

import com.yldlxj.pv.inspect.project.Project;
import com.yldlxj.pv.inspect.project.dto.ProjectViewVo;
import com.yldlxj.pv.inspect.user.SysUser;
import com.yldlxj.pv.inspect.user.dto.UserDto;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper
public interface ProjectConvert {
    ProjectConvert INSTANCE = Mappers.getMapper(ProjectConvert.class);

    ProjectViewVo toViewVo(Project project);

    // 映射集合
    List<ProjectViewVo> toVoList(List<Project> list);
}
