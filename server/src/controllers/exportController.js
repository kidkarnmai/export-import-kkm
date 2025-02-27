const ExcelJS = require('exceljs');


const exportController = ({
  strapi
}) => ({
  async exportData(ctx) {
    // // ดึงค่าช่วงวันที่จาก query parameters
    const {
      collection,
      startDate,
      endDate
    } = ctx.query;

    // แปลงวันที่ให้เป็น ISO string
    const startISODate = new Date(startDate).toISOString();
    const endISODate = new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1)).toISOString();

    const modelName = `api::${collection}.${collection}`; // สร้างชื่อ model แบบ dynamic
    const data = await strapi.entityService.findMany(modelName, {
      filters: {
        createdAt: {
          $gte: startISODate,
          $lt: endISODate,
        },
      },
      populate: '*',
    });

    // ctx.body = {
    //     startDate: ctx.query.startDate,
    //     endDate: ctx.query.endDate,
    //     data: data,
    // };



    // สร้าง workbook และ worksheet ใหม่ด้วย exceljs
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

    // เขียน workbook เป็น buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // กำหนด headers ของ response ให้เป็นไฟล์ Excel
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', 'attachment; filename=export.xlsx');
    ctx.body = buffer;
  },
});

export default exportController;
