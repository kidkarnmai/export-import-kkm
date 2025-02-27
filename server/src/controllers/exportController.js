'use strict';

const ExcelJS = require('exceljs');

const exportController = ({ strapi }) => ({
  async exportData(ctx) {
    // รับค่า query parameters
    const { collection, startDate, endDate } = ctx.query;

    // แปลงวันที่เป็น ISO string หากมี
    const startISODate = startDate ? new Date(startDate).toISOString() : null;
    const endISODate = endDate ? new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1)).toISOString() : null;

    // สร้าง modelName แบบ dynamic จาก collection
    const modelName = `api::${collection}.${collection}`;

    // กำหนด options สำหรับการ query
    const queryOptions = {
      populate: '*',
    };

    if (startISODate && endISODate) {
      queryOptions.filters = {
        createdAt: {
          $gte: startISODate,
          $lt: endISODate,
        },
      };
    }

    const data = await strapi.entityService.findMany(modelName, queryOptions);

    // สร้าง workbook และ worksheet ใหม่ด้วย ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Export Data');

    if (data.length > 0) {
      // สร้าง header จาก key ของ object แรก
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      // เพิ่มข้อมูลในแต่ละ row
      data.forEach(item => {
        const rowData = headers.map(header => item[header]);
        worksheet.addRow(rowData);
      });
    }

    // เขียน workbook เป็น buffer แล้วส่งกลับ
    const buffer = await workbook.xlsx.writeBuffer();
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', 'attachment; filename=export.xlsx');
    ctx.body = buffer;
  },
});

export default exportController;
