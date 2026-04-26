package com.yldlxj.pv.inspect.station;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yldlxj.pv.inspect.record.dto.PhotoItemDto;
import com.yldlxj.pv.inspect.record.dto.PhotoSectionDto;
import com.yldlxj.pv.inspect.station.dto.StationViewVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Mapper
public interface StationMapper extends BaseMapper<Station> {

    public static void main(String[] args) throws JsonProcessingException {
        List<PhotoSectionDto> photos = new ArrayList<>();
        PhotoSectionDto photoSectionDto = new PhotoSectionDto();
        photoSectionDto.setSectionId(2L);
        photoSectionDto.setItems(new ArrayList<>());

        PhotoItemDto itemDto=new PhotoItemDto();
        itemDto.setItemId(28L);
        itemDto.setItemName("支架照片（背拉部位照片、预制墩、膨胀螺栓细节照片、支架螺栓）");
        itemDto.setUrls(Arrays.asList("https://imagev2.xmcdn.com/group14/M06/92/AC/wKgDZFdfnQCCq2ZmAAGwbLjJwyE614.jpg!quality=7&xmagick=webp","https://imagev2.xmcdn.com/group24/M03/12/04/wKgJMFgXMC2RLZYcAAHOsPVy2UU154.jpg!quality=7&xmagick=webp"));
        photoSectionDto.getItems().add(itemDto);

        PhotoItemDto itemDto2=new PhotoItemDto();
        itemDto2.setItemName("自定义");
        itemDto2.setUrls(List.of("https://imagev2.xmcdn.com/group16/M06/82/33/wKgDbFdNSvKCLUEXAAGexs7WtMY905.jpg!quality=7&xmagick=webp"));
        photoSectionDto.getItems().add(itemDto2);


        photos.add(photoSectionDto);

        System.out.println(new ObjectMapper().writeValueAsString(photos));
    }

    @Select("SELECT COUNT(*) FROM station WHERE project_id = #{projectId}")
    int countByProjectId(Long projectId);

    @Update("UPDATE station SET last_inspect_record_id = #{inspectRecordId},last_inspect_time=NOW() WHERE id = #{id}")
    void updateLastInspectRecordId(Long id, Long inspectRecordId);

    List<StationViewVo> listByProjectId(@Param("projectId") Long projectId,
                                        @Param("planProjectId") Long planProjectId,
                                        @Param("keyword") String keyword,
                                        @Param("inspectStatus") Integer inspectStatus,
                                        @Param("offset") int offset,
                                        @Param("limit") int limit);

    long countByProjectIdFiltered(@Param("projectId") Long projectId,
                                  @Param("planProjectId") Long planProjectId,
                                  @Param("keyword") String keyword,
                                  @Param("inspectStatus") Integer inspectStatus);

    List<StationViewVo> listByProjectIdNoPlan(@Param("projectId") Long projectId,
                                              @Param("keyword") String keyword,
                                              @Param("offset") int offset,
                                              @Param("limit") int limit);

    long countByProjectIdFilteredNoPlan(@Param("projectId") Long projectId,
                                        @Param("keyword") String keyword);
}
