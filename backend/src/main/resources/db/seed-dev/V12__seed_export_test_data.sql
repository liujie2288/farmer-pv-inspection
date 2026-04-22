-- ===========================================
-- V12: Seed export test data
-- Replace V9 records with proper checklist_result format (sections/items JSON object)
-- and add photo_urls for export testing
-- ===========================================

-- Remove old V9 records (wrong checklist format)
DELETE FROM inspect_record WHERE plan_id IN (1, 2, 3, 4, 5);

-- Update plan 1 to be fully inspected
UPDATE inspect_plan SET farmer_count = 25, inspected_count = 25 WHERE id = 1;

-- =========================================================
-- Helper: compact checklist JSON with all 6 sections, 64 items
-- Each record varies slightly (some fail items with exceptionNote)
-- =========================================================

-- All-pass template (used for most records)
SET @all_pass := '{"sections":[
  {"sectionId":1,"sectionName":"光伏组件","items":[
    {"content":"组件外观整洁，应无破碎、弯曲、异物遮挡等现象","result":"pass"},
    {"content":"光伏组件直流线缆应连接紧固，无破损、烧灼等现象","result":"pass"},
    {"content":"组件洁净度是否正常","result":"pass"},
    {"content":"组件边框有无变形","result":"pass"},
    {"content":"背板有无划伤、开胶、鼓包、气泡等","result":"pass"},
    {"content":"接线盒塑料有无变形、扭曲、开裂、老化等","result":"pass"},
    {"content":"直流线缆护管有无破损","result":"pass"},
    {"content":"铭牌应平整，字体清晰可见","result":"pass"},
    {"content":"电池片有无破损、隐裂、热斑等","result":"pass"},
    {"content":"边框接地电阻应小于4Ω","result":"pass"},
    {"content":"组件串绝缘电阻是否正常","result":"pass"}
  ]},
  {"sectionId":2,"sectionName":"支架","items":[
    {"content":"支架基础应无破裂、沉降、移位、歪斜等","result":"pass"},
    {"content":"支架整体结构应无明显变形、锈蚀","result":"pass"},
    {"content":"支架螺栓应紧固，无松动","result":"pass"},
    {"content":"支架与组件连接应牢固可靠","result":"pass"},
    {"content":"支架接地应良好","result":"pass"},
    {"content":"支架倾角应符合设计要求","result":"pass"},
    {"content":"支架防腐涂层应完好","result":"pass"},
    {"content":"支架焊接部位应无裂纹","result":"pass"},
    {"content":"支架导轨应平直无弯曲","result":"pass"},
    {"content":"支架间距应符合设计要求","result":"pass"},
    {"content":"支架基础周围排水良好","result":"pass"},
    {"content":"支架标识应清晰可见","result":"pass"}
  ]},
  {"sectionId":3,"sectionName":"逆变器","items":[
    {"content":"逆变器外观应完好无损","result":"pass"},
    {"content":"逆变器安装应牢固可靠","result":"pass"},
    {"content":"逆变器接线应正确紧固","result":"pass"},
    {"content":"逆变器散热应正常","result":"pass"},
    {"content":"逆变器显示面板应正常显示","result":"pass"},
    {"content":"逆变器保护功能应正常","result":"pass"},
    {"content":"逆变器接地应良好","result":"pass"},
    {"content":"逆变器通讯功能应正常","result":"pass"},
    {"content":"逆变器运行参数应正常","result":"pass"},
    {"content":"逆变器防雷保护应正常","result":"pass"},
    {"content":"逆变器接线端子无过热","result":"pass"},
    {"content":"逆变器周围无杂物堆放","result":"pass"},
    {"content":"逆变器铭牌信息清晰","result":"pass"}
  ]},
  {"sectionId":4,"sectionName":"配电箱","items":[
    {"content":"配电箱外观完好","result":"pass"},
    {"content":"配电箱密封良好","result":"pass"},
    {"content":"断路器工作正常","result":"pass"},
    {"content":"隔离开关工作正常","result":"pass"},
    {"content":"防雷器工作正常","result":"pass"},
    {"content":"配电箱内接线整齐规范","result":"pass"},
    {"content":"电缆标识清晰完整","result":"pass"},
    {"content":"配电箱接地良好","result":"pass"},
    {"content":"配电箱内无积水、无锈蚀","result":"pass"},
    {"content":"计量表计工作正常","result":"pass"},
    {"content":"配电箱门锁完好","result":"pass"},
    {"content":"配电箱周围无安全隐患","result":"pass"},
    {"content":"配电箱接线端子无过热变色","result":"pass"}
  ]},
  {"sectionId":5,"sectionName":"接地与防雷系统","items":[
    {"content":"接地线连接可靠","result":"pass"},
    {"content":"接地电阻符合要求","result":"pass"},
    {"content":"防雷器安装正确","result":"pass"},
    {"content":"接地线无锈蚀断裂","result":"pass"},
    {"content":"等电位连接良好","result":"pass"},
    {"content":"接地标识清晰","result":"pass"}
  ]},
  {"sectionId":6,"sectionName":"采集装置及电缆","items":[
    {"content":"采集装置安装牢固","result":"pass"},
    {"content":"采集装置工作正常","result":"pass"},
    {"content":"通讯线缆连接可靠","result":"pass"},
    {"content":"电缆无破损老化","result":"pass"},
    {"content":"电缆固定牢靠","result":"pass"},
    {"content":"电缆弯曲半径符合要求","result":"pass"},
    {"content":"电缆标识完整","result":"pass"},
    {"content":"电缆保护管完好","result":"pass"},
    {"content":"电缆接头防水处理良好","result":"pass"}
  ]}
]}';

-- Records with some failures (varying sections)
SET @fail_back := '{"sections":[
  {"sectionId":1,"sectionName":"光伏组件","items":[
    {"content":"组件外观整洁，应无破碎、弯曲、异物遮挡等现象","result":"pass"},
    {"content":"光伏组件直流线缆应连接紧固，无破损、烧灼等现象","result":"pass"},
    {"content":"组件洁净度是否正常","result":"pass"},
    {"content":"组件边框有无变形","result":"pass"},
    {"content":"背板有无划伤、开胶、鼓包、气泡等","result":"fail","exceptionNote":"背板局部鼓包约3cm"},
    {"content":"接线盒塑料有无变形、扭曲、开裂、老化等","result":"pass"},
    {"content":"直流线缆护管有无破损","result":"pass"},
    {"content":"铭牌应平整，字体清晰可见","result":"pass"},
    {"content":"电池片有无破损、隐裂、热斑等","result":"pass"},
    {"content":"边框接地电阻应小于4Ω","result":"pass"},
    {"content":"组件串绝缘电阻是否正常","result":"pass"}
  ]},
  {"sectionId":2,"sectionName":"支架","items":[
    {"content":"支架基础应无破裂、沉降、移位、歪斜等","result":"pass"},
    {"content":"支架整体结构应无明显变形、锈蚀","result":"pass"},
    {"content":"支架螺栓应紧固，无松动","result":"pass"},
    {"content":"支架与组件连接应牢固可靠","result":"pass"},
    {"content":"支架接地应良好","result":"pass"},
    {"content":"支架倾角应符合设计要求","result":"pass"},
    {"content":"支架防腐涂层应完好","result":"pass"},
    {"content":"支架焊接部位应无裂纹","result":"pass"},
    {"content":"支架导轨应平直无弯曲","result":"pass"},
    {"content":"支架间距应符合设计要求","result":"pass"},
    {"content":"支架基础周围排水良好","result":"pass"},
    {"content":"支架标识应清晰可见","result":"pass"}
  ]},
  {"sectionId":3,"sectionName":"逆变器","items":[
    {"content":"逆变器外观应完好无损","result":"pass"},
    {"content":"逆变器安装应牢固可靠","result":"pass"},
    {"content":"逆变器接线应正确紧固","result":"pass"},
    {"content":"逆变器散热应正常","result":"pass"},
    {"content":"逆变器显示面板应正常显示","result":"pass"},
    {"content":"逆变器保护功能应正常","result":"pass"},
    {"content":"逆变器接地应良好","result":"pass"},
    {"content":"逆变器通讯功能应正常","result":"pass"},
    {"content":"逆变器运行参数应正常","result":"pass"},
    {"content":"逆变器防雷保护应正常","result":"pass"},
    {"content":"逆变器接线端子无过热","result":"pass"},
    {"content":"逆变器周围无杂物堆放","result":"pass"},
    {"content":"逆变器铭牌信息清晰","result":"pass"}
  ]},
  {"sectionId":4,"sectionName":"配电箱","items":[
    {"content":"配电箱外观完好","result":"pass"},
    {"content":"配电箱密封良好","result":"pass"},
    {"content":"断路器工作正常","result":"pass"},
    {"content":"隔离开关工作正常","result":"pass"},
    {"content":"防雷器工作正常","result":"pass"},
    {"content":"配电箱内接线整齐规范","result":"pass"},
    {"content":"电缆标识清晰完整","result":"pass"},
    {"content":"配电箱接地良好","result":"pass"},
    {"content":"配电箱内无积水、无锈蚀","result":"pass"},
    {"content":"计量表计工作正常","result":"pass"},
    {"content":"配电箱门锁完好","result":"pass"},
    {"content":"配电箱周围无安全隐患","result":"pass"},
    {"content":"配电箱接线端子无过热变色","result":"pass"}
  ]},
  {"sectionId":5,"sectionName":"接地与防雷系统","items":[
    {"content":"接地线连接可靠","result":"pass"},
    {"content":"接地电阻符合要求","result":"pass"},
    {"content":"防雷器安装正确","result":"pass"},
    {"content":"接地线无锈蚀断裂","result":"pass"},
    {"content":"等电位连接良好","result":"pass"},
    {"content":"接地标识清晰","result":"pass"}
  ]},
  {"sectionId":6,"sectionName":"采集装置及电缆","items":[
    {"content":"采集装置安装牢固","result":"pass"},
    {"content":"采集装置工作正常","result":"pass"},
    {"content":"通讯线缆连接可靠","result":"pass"},
    {"content":"电缆无破损老化","result":"pass"},
    {"content":"电缆固定牢靠","result":"pass"},
    {"content":"电缆弯曲半径符合要求","result":"pass"},
    {"content":"电缆标识完整","result":"pass"},
    {"content":"电缆保护管完好","result":"pass"},
    {"content":"电缆接头防水处理良好","result":"pass"}
  ]}
]}';

SET @fail_inverter := '{"sections":[
  {"sectionId":1,"sectionName":"光伏组件","items":[
    {"content":"组件外观整洁，应无破碎、弯曲、异物遮挡等现象","result":"pass"},
    {"content":"光伏组件直流线缆应连接紧固，无破损、烧灼等现象","result":"pass"},
    {"content":"组件洁净度是否正常","result":"pass"},
    {"content":"组件边框有无变形","result":"pass"},
    {"content":"背板有无划伤、开胶、鼓包、气泡等","result":"pass"},
    {"content":"接线盒塑料有无变形、扭曲、开裂、老化等","result":"pass"},
    {"content":"直流线缆护管有无破损","result":"pass"},
    {"content":"铭牌应平整，字体清晰可见","result":"pass"},
    {"content":"电池片有无破损、隐裂、热斑等","result":"pass"},
    {"content":"边框接地电阻应小于4Ω","result":"pass"},
    {"content":"组件串绝缘电阻是否正常","result":"pass"}
  ]},
  {"sectionId":2,"sectionName":"支架","items":[
    {"content":"支架基础应无破裂、沉降、移位、歪斜等","result":"pass"},
    {"content":"支架整体结构应无明显变形、锈蚀","result":"pass"},
    {"content":"支架螺栓应紧固，无松动","result":"pass"},
    {"content":"支架与组件连接应牢固可靠","result":"pass"},
    {"content":"支架接地应良好","result":"pass"},
    {"content":"支架倾角应符合设计要求","result":"pass"},
    {"content":"支架防腐涂层应完好","result":"pass"},
    {"content":"支架焊接部位应无裂纹","result":"pass"},
    {"content":"支架导轨应平直无弯曲","result":"pass"},
    {"content":"支架间距应符合设计要求","result":"pass"},
    {"content":"支架基础周围排水良好","result":"pass"},
    {"content":"支架标识应清晰可见","result":"pass"}
  ]},
  {"sectionId":3,"sectionName":"逆变器","items":[
    {"content":"逆变器外观应完好无损","result":"pass"},
    {"content":"逆变器安装应牢固可靠","result":"pass"},
    {"content":"逆变器接线应正确紧固","result":"pass"},
    {"content":"逆变器散热应正常","result":"fail","exceptionNote":"逆变器散热风扇异响，温度偏高"},
    {"content":"逆变器显示面板应正常显示","result":"pass"},
    {"content":"逆变器保护功能应正常","result":"pass"},
    {"content":"逆变器接地应良好","result":"pass"},
    {"content":"逆变器通讯功能应正常","result":"pass"},
    {"content":"逆变器运行参数应正常","result":"pass"},
    {"content":"逆变器防雷保护应正常","result":"pass"},
    {"content":"逆变器接线端子无过热","result":"pass"},
    {"content":"逆变器周围无杂物堆放","result":"pass"},
    {"content":"逆变器铭牌信息清晰","result":"pass"}
  ]},
  {"sectionId":4,"sectionName":"配电箱","items":[
    {"content":"配电箱外观完好","result":"pass"},
    {"content":"配电箱密封良好","result":"pass"},
    {"content":"断路器工作正常","result":"pass"},
    {"content":"隔离开关工作正常","result":"pass"},
    {"content":"防雷器工作正常","result":"pass"},
    {"content":"配电箱内接线整齐规范","result":"pass"},
    {"content":"电缆标识清晰完整","result":"pass"},
    {"content":"配电箱接地良好","result":"pass"},
    {"content":"配电箱内无积水、无锈蚀","result":"pass"},
    {"content":"计量表计工作正常","result":"pass"},
    {"content":"配电箱门锁完好","result":"pass"},
    {"content":"配电箱周围无安全隐患","result":"pass"},
    {"content":"配电箱接线端子无过热变色","result":"pass"}
  ]},
  {"sectionId":5,"sectionName":"接地与防雷系统","items":[
    {"content":"接地线连接可靠","result":"pass"},
    {"content":"接地电阻符合要求","result":"pass"},
    {"content":"防雷器安装正确","result":"pass"},
    {"content":"接地线无锈蚀断裂","result":"pass"},
    {"content":"等电位连接良好","result":"pass"},
    {"content":"接地标识清晰","result":"pass"}
  ]},
  {"sectionId":6,"sectionName":"采集装置及电缆","items":[
    {"content":"采集装置安装牢固","result":"pass"},
    {"content":"采集装置工作正常","result":"pass"},
    {"content":"通讯线缆连接可靠","result":"pass"},
    {"content":"电缆无破损老化","result":"pass"},
    {"content":"电缆固定牢靠","result":"pass"},
    {"content":"电缆弯曲半径符合要求","result":"pass"},
    {"content":"电缆标识完整","result":"pass"},
    {"content":"电缆保护管完好","result":"pass"},
    {"content":"电缆接头防水处理良好","result":"pass"}
  ]}
]}';

SET @fail_dist_box := '{"sections":[
  {"sectionId":1,"sectionName":"光伏组件","items":[
    {"content":"组件外观整洁，应无破碎、弯曲、异物遮挡等现象","result":"pass"},
    {"content":"光伏组件直流线缆应连接紧固，无破损、烧灼等现象","result":"pass"},
    {"content":"组件洁净度是否正常","result":"pass"},
    {"content":"组件边框有无变形","result":"pass"},
    {"content":"背板有无划伤、开胶、鼓包、气泡等","result":"pass"},
    {"content":"接线盒塑料有无变形、扭曲、开裂、老化等","result":"pass"},
    {"content":"直流线缆护管有无破损","result":"pass"},
    {"content":"铭牌应平整，字体清晰可见","result":"pass"},
    {"content":"电池片有无破损、隐裂、热斑等","result":"pass"},
    {"content":"边框接地电阻应小于4Ω","result":"pass"},
    {"content":"组件串绝缘电阻是否正常","result":"pass"}
  ]},
  {"sectionId":2,"sectionName":"支架","items":[
    {"content":"支架基础应无破裂、沉降、移位、歪斜等","result":"pass"},
    {"content":"支架整体结构应无明显变形、锈蚀","result":"pass"},
    {"content":"支架螺栓应紧固，无松动","result":"pass"},
    {"content":"支架与组件连接应牢固可靠","result":"pass"},
    {"content":"支架接地应良好","result":"pass"},
    {"content":"支架倾角应符合设计要求","result":"pass"},
    {"content":"支架防腐涂层应完好","result":"pass"},
    {"content":"支架焊接部位应无裂纹","result":"pass"},
    {"content":"支架导轨应平直无弯曲","result":"pass"},
    {"content":"支架间距应符合设计要求","result":"pass"},
    {"content":"支架基础周围排水良好","result":"pass"},
    {"content":"支架标识应清晰可见","result":"pass"}
  ]},
  {"sectionId":3,"sectionName":"逆变器","items":[
    {"content":"逆变器外观应完好无损","result":"pass"},
    {"content":"逆变器安装应牢固可靠","result":"pass"},
    {"content":"逆变器接线应正确紧固","result":"pass"},
    {"content":"逆变器散热应正常","result":"pass"},
    {"content":"逆变器显示面板应正常显示","result":"pass"},
    {"content":"逆变器保护功能应正常","result":"pass"},
    {"content":"逆变器接地应良好","result":"pass"},
    {"content":"逆变器通讯功能应正常","result":"pass"},
    {"content":"逆变器运行参数应正常","result":"pass"},
    {"content":"逆变器防雷保护应正常","result":"pass"},
    {"content":"逆变器接线端子无过热","result":"pass"},
    {"content":"逆变器周围无杂物堆放","result":"pass"},
    {"content":"逆变器铭牌信息清晰","result":"pass"}
  ]},
  {"sectionId":4,"sectionName":"配电箱","items":[
    {"content":"配电箱外观完好","result":"pass"},
    {"content":"配电箱密封良好","result":"fail","exceptionNote":"配电箱密封胶条老化，有进水风险"},
    {"content":"断路器工作正常","result":"pass"},
    {"content":"隔离开关工作正常","result":"pass"},
    {"content":"防雷器工作正常","result":"pass"},
    {"content":"配电箱内接线整齐规范","result":"pass"},
    {"content":"电缆标识清晰完整","result":"pass"},
    {"content":"配电箱接地良好","result":"pass"},
    {"content":"配电箱内无积水、无锈蚀","result":"pass"},
    {"content":"计量表计工作正常","result":"pass"},
    {"content":"配电箱门锁完好","result":"pass"},
    {"content":"配电箱周围无安全隐患","result":"pass"},
    {"content":"配电箱接线端子无过热变色","result":"pass"}
  ]},
  {"sectionId":5,"sectionName":"接地与防雷系统","items":[
    {"content":"接地线连接可靠","result":"pass"},
    {"content":"接地电阻符合要求","result":"pass"},
    {"content":"防雷器安装正确","result":"pass"},
    {"content":"接地线无锈蚀断裂","result":"pass"},
    {"content":"等电位连接良好","result":"pass"},
    {"content":"接地标识清晰","result":"pass"}
  ]},
  {"sectionId":6,"sectionName":"采集装置及电缆","items":[
    {"content":"采集装置安装牢固","result":"pass"},
    {"content":"采集装置工作正常","result":"pass"},
    {"content":"通讯线缆连接可靠","result":"pass"},
    {"content":"电缆无破损老化","result":"pass"},
    {"content":"电缆固定牢靠","result":"pass"},
    {"content":"电缆弯曲半径符合要求","result":"pass"},
    {"content":"电缆标识完整","result":"pass"},
    {"content":"电缆保护管完好","result":"pass"},
    {"content":"电缆接头防水处理良好","result":"pass"}
  ]}
]}';

-- photo_urls templates
SET @photos_3sections := '{"1":["http://localhost:9000/pv-inspection/inspection/section_1/record_%d_1.jpg","http://localhost:9000/pv-inspection/inspection/section_1/record_%d_2.jpg"],"3":["http://localhost:9000/pv-inspection/inspection/section_3/record_%d_1.jpg"],"5":["http://localhost:9000/pv-inspection/inspection/section_5/record_%d_1.jpg"]}';
SET @photos_2sections := '{"2":["http://localhost:9000/pv-inspection/inspection/section_2/record_%d_1.jpg"],"4":["http://localhost:9000/pv-inspection/inspection/section_4/record_%d_1.jpg","http://localhost:9000/pv-inspection/inspection/section_4/record_%d_2.jpg"]}';
SET @photos_1section := '{"1":["http://localhost:9000/pv-inspection/inspection/section_1/record_%d_1.jpg"]}';
SET @photos_all := '{"1":["http://localhost:9000/pv-inspection/inspection/section_1/record_%d_1.jpg"],"2":["http://localhost:9000/pv-inspection/inspection/section_2/record_%d_1.jpg"],"3":["http://localhost:9000/pv-inspection/inspection/section_3/record_%d_1.jpg"],"4":["http://localhost:9000/pv-inspection/inspection/section_4/record_%d_1.jpg"],"5":["http://localhost:9000/pv-inspection/inspection/section_5/record_%d_1.jpg"],"6":["http://localhost:9000/pv-inspection/inspection/section_6/record_%d_1.jpg"]}';
SET @no_photos := NULL;

-- =========================================================
-- Insert 25 records for plan 1 (inspector 4-8, farmers 1-25)
-- Mix of pass/fail, with/without photos
-- =========================================================

INSERT INTO inspect_record (plan_id, farmer_id, inspector_id, project_id, checklist_result, photo_urls, longitude, latitude, create_time) VALUES
-- Inspector 4 (张伟), farmers 1-5
(1, 1, 4, 1, @all_pass,      '{"1":["http://localhost:9000/pv-inspection/inspection/section_1/f001_s1_1.jpg","http://localhost:9000/pv-inspection/inspection/section_1/f001_s1_2.jpg"],"3":["http://localhost:9000/pv-inspection/inspection/section_3/f001_s3_1.jpg"],"5":["http://localhost:9000/pv-inspection/inspection/section_5/f001_s5_1.jpg"]}', 120.1535000, 30.2870000, '2024-01-20 09:30:00'),
(1, 2, 4, 1, @fail_back,    '{"1":["http://localhost:9000/pv-inspection/inspection/section_1/f002_s1_1.jpg"],"2":["http://localhost:9000/pv-inspection/inspection/section_2/f002_s2_1.jpg","http://localhost:9000/pv-inspection/inspection/section_2/f002_s2_2.jpg"]}', 120.1545000, 30.2880000, '2024-01-20 10:15:00'),
(1, 3, 4, 1, @all_pass,     '{"1":["http://localhost:9000/pv-inspection/inspection/section_1/f003_s1_1.jpg"],"4":["http://localhost:9000/pv-inspection/inspection/section_4/f003_s4_1.jpg"]}', 120.1555000, 30.2890000, '2024-01-21 09:00:00'),
(1, 4, 4, 1, @fail_inverter,'{"3":["http://localhost:9000/pv-inspection/inspection/section_3/f004_s3_1.jpg","http://localhost:9000/pv-inspection/inspection/section_3/f004_s3_2.jpg"]}', 120.1565000, 30.2900000, '2024-01-21 10:30:00'),
(1, 5, 4, 1, @all_pass,     '{"1":["http://localhost:9000/pv-inspection/inspection/section_1/f005_s1_1.jpg"],"6":["http://localhost:9000/pv-inspection/inspection/section_6/f005_s6_1.jpg"]}', 120.1575000, 30.2910000, '2024-01-22 09:00:00'),

-- Inspector 5 (刘强), farmers 6-10
(1, 6, 5, 1, @all_pass,      '{"1":["http://localhost:9000/pv-inspection/inspection/section_1/f006_s1_1.jpg"],"2":["http://localhost:9000/pv-inspection/inspection/section_2/f006_s2_1.jpg"],"3":["http://localhost:9000/pv-inspection/inspection/section_3/f006_s3_1.jpg"]}', 120.1585000, 30.2920000, '2024-01-23 09:00:00'),
(1, 7, 5, 1, @fail_dist_box,'{"1":["http://localhost:9000/pv-inspection/inspection/section_1/f007_s1_1.jpg"],"4":["http://localhost:9000/pv-inspection/inspection/section_4/f007_s4_1.jpg","http://localhost:9000/pv-inspection/inspection/section_4/f007_s4_2.jpg"]}', 120.1595000, 30.2930000, '2024-01-23 10:30:00'),
(1, 8, 5, 1, @all_pass,     '{"5":["http://localhost:9000/pv-inspection/inspection/section_5/f008_s5_1.jpg"]}', 120.1605000, 30.2940000, '2024-01-24 09:00:00'),
(1, 9, 5, 1, @all_pass,     NULL, 120.1615000, 30.2950000, '2024-01-24 10:30:00'),
(1, 10, 5, 1, @all_pass,    '{"2":["http://localhost:9000/pv-inspection/inspection/section_2/f010_s2_1.jpg"],"6":["http://localhost:9000/pv-inspection/inspection/section_6/f010_s6_1.jpg"]}', 120.1625000, 30.2960000, '2024-01-25 09:00:00'),

-- Inspector 6 (陈磊), farmers 11-15
(1, 11, 6, 1, @all_pass,     '{"1":["http://localhost:9000/pv-inspection/inspection/section_1/f011_s1_1.jpg"]}', 120.1635000, 30.2970000, '2024-01-26 09:00:00'),
(1, 12, 6, 1, @fail_back,   '{"1":["http://localhost:9000/pv-inspection/inspection/section_1/f012_s1_1.jpg","http://localhost:9000/pv-inspection/inspection/section_1/f012_s1_2.jpg"],"3":["http://localhost:9000/pv-inspection/inspection/section_3/f012_s3_1.jpg"]}', 120.1645000, 30.2980000, '2024-01-26 10:30:00'),
(1, 13, 6, 1, @all_pass,    NULL, 120.1655000, 30.2990000, '2024-01-27 09:00:00'),
(1, 14, 6, 1, @fail_inverter,'{"3":["http://localhost:9000/pv-inspection/inspection/section_3/f014_s3_1.jpg"]}', 120.1665000, 30.3000000, '2024-01-27 14:00:00'),
(1, 15, 6, 1, @all_pass,    '{"4":["http://localhost:9000/pv-inspection/inspection/section_4/f015_s4_1.jpg"]}', 120.1675000, 30.3010000, '2024-01-28 09:00:00'),

-- Inspector 7 (杨洋), farmers 16-20
(1, 16, 7, 1, @all_pass,     '{"1":["http://localhost:9000/pv-inspection/inspection/section_1/f016_s1_1.jpg"],"2":["http://localhost:9000/pv-inspection/inspection/section_2/f016_s2_1.jpg"]}', 120.1685000, 30.3020000, '2024-01-29 09:00:00'),
(1, 17, 7, 1, @fail_dist_box,'{"4":["http://localhost:9000/pv-inspection/inspection/section_4/f017_s4_1.jpg","http://localhost:9000/pv-inspection/inspection/section_4/f017_s4_2.jpg"],"5":["http://localhost:9000/pv-inspection/inspection/section_5/f017_s5_1.jpg"]}', 120.1695000, 30.3030000, '2024-01-29 10:30:00'),
(1, 18, 7, 1, @all_pass,    NULL, 120.1705000, 30.3040000, '2024-01-30 09:00:00'),
(1, 19, 7, 1, @all_pass,    '{"6":["http://localhost:9000/pv-inspection/inspection/section_6/f019_s6_1.jpg"]}', 120.1715000, 30.3050000, '2024-01-30 10:30:00'),
(1, 20, 7, 1, @all_pass,    '{"1":["http://localhost:9000/pv-inspection/inspection/section_1/f020_s1_1.jpg"],"3":["http://localhost:9000/pv-inspection/inspection/section_3/f020_s3_1.jpg"]}', 120.1725000, 30.3060000, '2024-01-31 09:00:00'),

-- Inspector 8 (赵勇), farmers 21-25
(1, 21, 8, 1, @all_pass,     '{"2":["http://localhost:9000/pv-inspection/inspection/section_2/f021_s2_1.jpg"],"5":["http://localhost:9000/pv-inspection/inspection/section_5/f021_s5_1.jpg"]}', 120.1735000, 30.3070000, '2024-02-01 09:00:00'),
(1, 22, 8, 1, @fail_back,   '{"1":["http://localhost:9000/pv-inspection/inspection/section_1/f022_s1_1.jpg"]}', 120.1745000, 30.3080000, '2024-02-01 10:30:00'),
(1, 23, 8, 1, @all_pass,    NULL, 120.1755000, 30.3090000, '2024-02-02 09:00:00'),
(1, 24, 8, 1, @fail_dist_box,'{"1":["http://localhost:9000/pv-inspection/inspection/section_1/f024_s1_1.jpg","http://localhost:9000/pv-inspection/inspection/section_1/f024_s1_2.jpg"],"4":["http://localhost:9000/pv-inspection/inspection/section_4/f024_s4_1.jpg"]}', 120.1765000, 30.3100000, '2024-02-02 14:00:00'),
(1, 25, 8, 1, @all_pass,    '{"3":["http://localhost:9000/pv-inspection/inspection/section_3/f025_s3_1.jpg"],"6":["http://localhost:9000/pv-inspection/inspection/section_6/f025_s6_1.jpg"]}', 120.1775000, 30.3110000, '2024-02-03 09:00:00');
