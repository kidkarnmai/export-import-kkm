'use strict';

const importController = ({ strapi }) => ({
  async importData(ctx) {
    const { data } = ctx.request.body;
    const { rows, collectionName } = data || {};

    if (!collectionName) {
      return ctx.throw(400, 'collectionName is required');
    }
    if (!rows || !Array.isArray(rows)) {
      return ctx.throw(400, 'Invalid data: rows must be an array');
    }

    const modelName = `api::${collectionName}.${collectionName}`;

    const excludedKeys = [
      'createdAt',
      'updatedAt',
      'publishedAt',
      'createdBy',
      'updatedBy'
    ];

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
        const sanitizedRow = Object.keys(row).reduce((acc, key) => {
          if (!excludedKeys.includes(key)) {
            let parsedValue = tryParseJSON(row[key]);
            if (parsedValue && typeof parsedValue === 'object' && parsedValue.documentId) {
              return acc;
            }
            if (!isEmptyValue(parsedValue)) {
              acc[key] = parsedValue;
            }
          }
          return acc;
        }, {});

        if (sanitizedRow.documentId) {
          const existing = await strapi.documents(modelName).findOne({
            documentId: sanitizedRow.documentId,
            populate: '*',
          });
          if (existing) {
            await strapi.documents(modelName).update({
              documentId: sanitizedRow.documentId,
              data: sanitizedRow,
              populate: '*',
            });
            updatedCount++;
          } else {
            await strapi.documents(modelName).create({
              data: sanitizedRow,
              populate: '*',
            });
            importedCount++;
          }
        } else {
          await strapi.documents(modelName).create({
            data: sanitizedRow,
            populate: '*',
          });
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
