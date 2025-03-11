import React, { useEffect, useState } from 'react';
import { Button, DatePicker, Flex } from '@strapi/design-system';
import { useLocation } from 'react-router-dom';
import { useFetchClient } from '@strapi/strapi/admin';
import qs from 'qs';
import * as XLSX from 'xlsx';


const ExportButton = () => {
  const { get } = useFetchClient();
  const location = useLocation();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allowedExportCollections, setAllowedExportCollections] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // โหลด config เพื่อรับค่า selectedExportCollections
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await get('/export-import-kkm/config');
        let config;
        if (Array.isArray(response.data)) {
          config = response.data[0];
        } else {
          config = response.data;
        }
        if (config && config.selectedExportCollections) {
          setAllowedExportCollections(config.selectedExportCollections);
        } else {
          setAllowedExportCollections([]);
        }
      } catch (error) {
        console.error('Error fetching config:', error);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, [get]);

  // ดึง content type จาก URL เช่น "/content-manager/collection-types/api::article.article"
  const segments = location.pathname.split('/');
  const lastSegment = segments[segments.length - 1];
  const currentContentType = lastSegment;
  if (loadingConfig) return null;
  if (!allowedExportCollections.includes(currentContentType)) return null;

  const handleExport = async () => {
    // สร้างข้อความแจ้งเตือนโดยพิจารณาจากเงื่อนไขที่ใช้ในการ export
    let messageLines = [];

    // เงื่อนไขวันที่
    if (startDate && endDate) {
      messageLines.push(`Date Range: ${startDate} to ${endDate}`);
    } else if (!startDate && !endDate) {
      messageLines.push('No date filter is applied (exporting ALL data)');
    } else {
      messageLines.push('Incomplete date filter provided (exporting ALL data)');
    }

    // ใช้ qs เพื่อ parse query string จาก URL
    const parsedQuery = qs.parse(location.search, { ignoreQueryPrefix: true });
    
    // ตรวจสอบ filters (ยกเว้น createdAt)
    if (parsedQuery.filters) {
      let filters = parsedQuery.filters;
      if (filters.$and && Array.isArray(filters.$and)) {
        filters.$and = filters.$and.filter(condition => !('createdAt' in condition));
      } else if (filters.createdAt) {
        delete filters.createdAt;
      }
      // หาก filters ไม่ว่าง ให้เพิ่มข้อความ
      if (filters && Object.keys(filters).length > 0) {
        messageLines.push(`Filters: ${JSON.stringify(filters)}`);
      }
    }
    
    // ตรวจสอบ _q (keyword search)
    if (parsedQuery._q) {
      messageLines.push(`Search Keyword: ${parsedQuery._q}`);
    }
    
    // รวมข้อความแจ้งเตือน
    const confirmMessage = `Export will be performed with the following conditions:\n\n${messageLines.join('\n')}\n\nProceed?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsExporting(true);

    // ดึง collectionName จาก URL (เช่น "api::article.article" → "article")
    const parts = location.pathname.split('::');
    const collectionFull = parts[1] || '';
    const [collectionName] = collectionFull.split('.');
    const flattenObject = (obj) => {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key,
          (typeof value === 'object' && value !== null) ? JSON.stringify(value) : value,
        ])
      );
    };
    try {
      // สร้าง query string ด้วยค่า collection, startDate, endDate
      let query = `collection=${collectionName}`;
      if (startDate && endDate) {
        query += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      
      // ถ้ามี filters จาก URL (โดยไม่เอา createdAt) ให้ส่งไปด้วย
      if (parsedQuery.filters) {
        const filtersQuery = qs.stringify({ filters: parsedQuery.filters }, { encode: false });
        if (filtersQuery) {
          query += `&${filtersQuery}`;
        }
      }
      
      // หากมี _q ใน query ให้ส่งไปด้วย
      if (parsedQuery._q) {
        query += `&_q=${encodeURIComponent(parsedQuery._q)}`;
      }
      
      // เรียก API export
      const response = await get(`/export-import-kkm/export?${query}`);
      const jsonData = response.data;
      
      const flattenedData = jsonData.map(flattenObject);

      // สร้าง worksheet จาก flattenedData
      const worksheet = XLSX.utils.json_to_sheet(flattenedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Export Data');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collectionName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Flex direction="row" gap={2}>
      <DatePicker label="Start Date" onChange={setStartDate} />
      <DatePicker label="End Date" onChange={setEndDate} />
      <Button onClick={handleExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export'}
      </Button>
    </Flex>
  );
};

export default ExportButton;
