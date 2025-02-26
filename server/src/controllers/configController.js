'use strict';

module.exports = {
  async getConfig(ctx) {
    // ดึง configuration ที่บันทึกไว้จากฐานข้อมูล
    const configs = await strapi.entityService.findMany('plugin::export-import-kkm.export-import-config', {
      filters: {},
    });

    if (configs && configs.length > 0) {
      ctx.body = configs[0];
    } else {
      // ถ้ายังไม่มี config ให้ส่งค่าดีฟอลต์
      ctx.body = {
        selectedExportCollections: [],
        selectedImportCollections: [],
      };
    }
  },

  async saveConfig(ctx) {
    const { data } = ctx.request.body;
    const { selectedExportCollections, selectedImportCollections } = data;

    // ตรวจสอบว่าเป็น array หรือไม่
    if (!Array.isArray(selectedExportCollections) || !Array.isArray(selectedImportCollections)) {
      return ctx.throw(400, 'selectedExportCollections and selectedImportCollections must be arrays');
    }

    // ค้นหาการตั้งค่าที่มีอยู่แล้ว (สมมติว่าเก็บได้เพียงรายการเดียว)
    const existingConfigs = await strapi.entityService.findMany('plugin::export-import-kkm.export-import-config', {
      filters: {},
    });

    let result;
    if (existingConfigs.length > 0) {
      // อัปเดตรายการแรก
      result = await strapi.entityService.update(
        'plugin::export-import-kkm.export-import-config',
        existingConfigs[0].id,
        {
          data: { selectedExportCollections, selectedImportCollections },
        }
      );
    } else {
      // สร้างรายการใหม่
      result = await strapi.entityService.create('plugin::export-import-kkm.export-import-config', {
        data: { selectedExportCollections, selectedImportCollections },
      });
    }
    ctx.body = result;
  },
};
