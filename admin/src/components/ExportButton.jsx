import React, { useEffect, useState } from 'react';
import { Button, DatePicker,Flex } from '@strapi/design-system';
import { useLocation } from 'react-router-dom';
import { useFetchClient } from '@strapi/strapi/admin';


const ExportButton = () => {
  const { get } = useFetchClient();
  
  const location = useLocation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allowedExportCollections, setAllowedExportCollections] = useState([]);
  
  const [loadingConfig, setLoadingConfig] = useState(true); // สถานะโหลด config
  const [isExporting, setIsExporting] = useState(false);    // สถานะโหลดขณะ export

  // ดึง config จาก server เพื่อรับค่า selectedCollections
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

  // ถ้ากำลังโหลดค่า config หรือไม่ได้รับค่าให้ return null
  if (loadingConfig) {
    return null;
  }
   // ดึง content type จาก URL เช่น "/content-manager/collection-types/api::article.article"
   const segments = location.pathname.split('/');
   const lastSegment = segments[segments.length - 1];
   const currentContentType = lastSegment; // เช่น "api::article.article"
 
   // ตรวจสอบว่า currentContentType อยู่ใน allowedExportCollections หรือไม่
   if (!allowedExportCollections.includes(currentContentType)) {
     return null;
   }



  const handleExport = async () => {
    // console.log(location)
    if (!startDate || !endDate) {
      console.error('Start Date and End Date must be provided.');
      return;
    }

    // เริ่มโหลด export
    setIsExporting(true);

    const parts = location.pathname.split('::');
    const collectionFull = parts[1] || '';
    const [collectionName] = collectionFull.split('.');
    console.log('Collection Name:', collectionName);
    try {
      // เรียก API export โดยส่งช่วงวันที่ใน query params
      const response = await fetch(
        `/api/export-import-kkm/export?collection=${collectionName}&startDate=${startDate}&endDate=${endDate}`
      );

      // แปลง response เป็น blob
      const blob = await response.blob();
      // สร้าง URL สำหรับ blob
      const url = window.URL.createObjectURL(blob);
      // สร้าง element <a> เพื่อ trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
        
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      // เสร็จสิ้นการ export
      setIsExporting(false);
    }
  };

  return (
    <Flex direction="row" gap={2}>
      <DatePicker label="Start Date" onChange={setStartDate}  />
      <DatePicker label="End Date" onChange={setEndDate} />
      <Button onClick={handleExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export'}
      </Button>
    </Flex>
  );
};

export default ExportButton;
