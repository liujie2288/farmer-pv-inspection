-- Fix V9 seed data: checklist_result must be JSON object, not array (Map<String,Object> in Java)
UPDATE inspect_record
SET checklist_result = '{"totalItems":64,"passItems":63,"failItems":1}'
WHERE JSON_TYPE(checklist_result) = 'ARRAY';
