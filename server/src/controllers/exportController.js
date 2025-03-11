'use strict';


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
    
    const data = await strapi.documents(modelName).findMany(queryOptions);
    
    return data;
  },
});

export default exportController;
