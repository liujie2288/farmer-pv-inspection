package com.yldlxj.pv.inspect.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yldlxj.pv.inspect.export.dto.ExportTaskFileDto;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedJdbcTypes;
import org.apache.ibatis.type.MappedTypes;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.TimeZone;

@MappedTypes(List.class)
@MappedJdbcTypes(JdbcType.VARCHAR)
public class ExportTaskFileTypeHandler extends BaseTypeHandler<List<ExportTaskFileDto>> {

    private static final ObjectMapper MAPPER = createMapper();

    private static ObjectMapper createMapper() {
        ObjectMapper m = new ObjectMapper();
        m.setTimeZone(TimeZone.getTimeZone("Asia/Shanghai"));
        return m;
    }

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<ExportTaskFileDto> parameter, JdbcType jdbcType) throws SQLException {
        try {
            ps.setString(i, MAPPER.writeValueAsString(parameter));
        } catch (JsonProcessingException e) {
            throw new SQLException(e);
        }
    }

    @Override
    public List<ExportTaskFileDto> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parse(rs.getString(columnName));
    }

    @Override
    public List<ExportTaskFileDto> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parse(rs.getString(columnIndex));
    }

    @Override
    public List<ExportTaskFileDto> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parse(cs.getString(columnIndex));
    }

    private List<ExportTaskFileDto> parse(String json) {
        if (json == null || json.isEmpty()) return null;
        try {
            return MAPPER.readValue(json, new TypeReference<List<ExportTaskFileDto>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
