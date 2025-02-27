import React, { useEffect, useState } from 'react';
import { Button, DatePicker, Flex } from '@strapi/design-system';
import { useLocation } from 'react-router-dom';
import { useFetchClient } from '@strapi/strapi/admin';

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
        const response = await get('/api/export-import-kkm/config');
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
    // ถ้าไม่เลือกวันที่เลย ให้แจ้งเตือน confirm ก่อน export ทั้งหมด
    if (!startDate && !endDate) {
      const confirmAll = window.confirm(
        "No dates selected. This will export ALL data, which might take a long time. Do you want to continue?"
      );
      if (!confirmAll) return;
    } else if (!startDate || !endDate) {
      // ถ้าเลือกแค่หนึ่งในวันที่ ให้แจ้งเตือน
      const confirmPartial = window.confirm(
        "Only one date is provided. This will export ALL data. Do you want to continue?"
      );
      if (!confirmPartial) return;
    }

    setIsExporting(true);

    // ดึง collectionName จาก URL (เช่น "api::article.article" → "article")
    const parts = location.pathname.split('::');
    const collectionFull = parts[1] || '';
    const [collectionName] = collectionFull.split('.');
    
    try {
      // สร้าง query string โดยส่งวันที่ (ถ้ามี)
      let query = `collection=${collectionName}`;
      if (startDate && endDate) {
        query += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      
      // เรียก API export
      const response = await fetch(`/api/export-import-kkm/export?${query}`);
      const blob = await response.blob();
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
