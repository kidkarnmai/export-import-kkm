'use strict';

const importController = ({ strapi }) => ({
  async importData(ctx) {
    // รับข้อมูล rows และ collectionName จาก body
    const { data } = ctx.request.body;
    const { rows, collectionName } = data || {};

    if (!collectionName) {
      return ctx.throw(400, 'collectionName is required');
    }
    if (!rows || !Array.isArray(rows)) {
      return ctx.throw(400, 'Invalid data: rows must be an array');
    }

    // สร้าง modelName แบบ dynamic จาก collectionName
    // เช่น ถ้า collectionName = "member", modelName = "api::member.member"
    const modelName = `api::${collectionName}.${collectionName}`;

    // กำหนด key ที่จะตัดออกจากข้อมูล (ที่ไม่ต้องการบันทึก)
    const excludedKeys = [
      'documentId',
      'createdAt',
      'updatedAt',
      'publishedAt',
      'createdBy',
      'updatedBy'
    ];

    // ฟังก์ชันช่วย สำหรับพยายาม parse JSON string เป็น object/array
    const tryParseJSON = (value) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            return JSON.parse(trimmed);
          } catch (error) {
            console.error('Error parsing JSON for value:', value, error);
            return value;
          }
        }
      }
      return value;
    };

    // ฟังก์ชันตรวจสอบว่า value เป็น "ว่าง" หรือไม่
    const isEmptyValue = (value) => {
      if (value == null) return true;
      if (typeof value === 'string' && value.trim() === '') return true;
      if (Array.isArray(value) && value.length === 0) return true;
      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return true;
      return false;
    };


    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      try {
        // ทำการ sanitize row โดย:
        // 1. ตัด key ที่อยู่ใน excludedKeys
        // 2. ใช้ tryParseJSON กับค่าในแต่ละ key
        // 3. ถ้าค่าที่ parse แล้วเป็น "ว่าง" ให้ไม่รวม key นั้น
        const sanitizedRow = Object.keys(row).reduce((acc, key) => {
          if (!excludedKeys.includes(key)) {
            const parsedValue = tryParseJSON(row[key]);
            if (!isEmptyValue(parsedValue)) {
              acc[key] = parsedValue;
            }
          }
          return acc;
        }, {});

        // console.log('sanitizedRow:', sanitizedRow);

        // ตรวจสอบว่ามี id ใน sanitizedRow หรือไม่
        if (sanitizedRow.id) {
          // ค้นหาข้อมูลเดิมใน DB โดยใช้ id
          const existing = await strapi.entityService.findOne(modelName, sanitizedRow.id);
          if (existing) {
            // อัปเดตข้อมูล record ที่มีอยู่แล้ว
            await strapi.entityService.update(modelName, sanitizedRow.id, { data: sanitizedRow });
            updatedCount++;
          } else {
            // สร้าง record ใหม่
            await strapi.entityService.create(modelName, { data: sanitizedRow });
            importedCount++;
          }
        } else {
          // ถ้าไม่มี id ให้สร้าง record ใหม่เสมอ
          await strapi.entityService.create(modelName, { data: sanitizedRow });
          importedCount++;
        }
      } catch (error) {
        console.error('Error importing row:', row, error);
        skippedCount++;
      }
    }

    ctx.body = {
      message: `Import completed for ${collectionName}`,
      importedCount,
      updatedCount,
      skippedCount,
      totalRows: rows.length,
    };
  },
});

module.exports = importController;
