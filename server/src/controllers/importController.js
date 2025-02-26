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
    // ตัวอย่าง: ถ้า collectionName = "member", modelName = "api::member.member"
    const modelName = `api::${collectionName}.${collectionName}`;

    // กำหนด key ที่จะตัดออกจากข้อมูล (ที่ไม่ต้องการบันทึก)
    const excludedKeys = ['documentId', 'createdAt', 'updatedAt', 'publishedAt'];

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      try {
        // ทำการ sanitize row โดยตัด key ที่ไม่ต้องการออก
        const sanitizedRow = Object.keys(row).reduce((acc, key) => {
          if (!excludedKeys.includes(key)) {
            acc[key] = row[key];
          }
          return acc;
        }, {});

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
