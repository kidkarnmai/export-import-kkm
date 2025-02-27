'use strict';

const ExcelJS = require('exceljs');

const exportController = ({ strapi }) => ({
  async exportData(ctx) {
    // รับค่า query parameters
    const { collection, startDate, endDate, _q } = ctx.query;
    
    // แปลงวันที่เป็น ISO string หากมี
    const startISODate = startDate ? new Date(startDate).toISOString() : null;
    const endISODate = endDate
      ? new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1)).toISOString()
      : null;
    
    // สร้าง modelName แบบ dynamic จาก collection
    const modelName = `api::${collection}.${collection}`;
    
    // สร้าง queryOptions โดยเริ่มต้นด้วย populate: '*'
    const queryOptions = {
      populate: '*',
      filters: {},
    };
    
    // ถ้ามี query filtersจาก URL (ยกเว้น createdAt) ให้นำมา merge
    if (ctx.query.filters) {
      const userFilters = { ...ctx.query.filters };
      if (userFilters.$and && Array.isArray(userFilters.$and)) {
        userFilters.$and = userFilters.$and.filter(
          condition => !('createdAt' in condition)
        );
      } else if (userFilters.createdAt) {
        delete userFilters.createdAt;
      }
      queryOptions.filters = { ...userFilters };
    }
    
    // หากมีค่า startISODate และ endISODate จาก datepicker ให้ override/เพิ่มเงื่อนไข createdAt
    if (startISODate && endISODate) {
      queryOptions.filters.createdAt = {
        $gte: startISODate,
        $lt: endISODate,
      };
    }
    
    // หากมี _q จาก query string (เช่นจาก search bar) ให้ส่งไปด้วย
    if (_q) {
      queryOptions._q = _q;
    }
    
    // ดึงข้อมูลจาก DB ด้วย Entity Service
    const data = await strapi.entityService.findMany(modelName, queryOptions);
    
    // สร้าง workbook และ worksheet ใหม่ด้วย ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Export Data');
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      data.forEach(item => {
        const rowData = headers.map(header => item[header]);
        worksheet.addRow(rowData);
      });
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', 'attachment; filename=export.xlsx');
    ctx.body = buffer;
  },
});

export default exportController;
