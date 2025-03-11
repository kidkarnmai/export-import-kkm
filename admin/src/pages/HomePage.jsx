import React, { useEffect, useState } from 'react';
import { Main, Checkbox, Flex, Typography, Box, Button, Divider } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslation } from '../utils/getTranslation';
import { useFetchClient } from '@strapi/strapi/admin';

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { get, post } = useFetchClient();

  const [collectionTypes, setCollectionTypes] = useState([]);
  const [exportCollections, setExportCollections] = useState([]);
  const [importCollections, setImportCollections] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // โหลดรายการ collectionTypes
  useEffect(() => {
    const fetchCollectionTypes = async () => {
      try {
        const response = await get('/content-type-builder/content-types');
        let collections = [];
        if (Array.isArray(response.data)) {
          collections = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          collections = response.data.data;
        }
        // กรองเฉพาะ collection types ที่ kind === 'collectionType' และ visible
        const filtered = collections.filter(
          (ct) => ct.schema && ct.schema.kind === 'collectionType' && ct.schema.visible
        );
        setCollectionTypes(filtered);
      } catch (error) {
        console.error('Failed to fetch collection types', error);
      }
    };
    fetchCollectionTypes();
  }, [get]);

  // โหลด config ที่บันทึกไว้
  useEffect(() => {
    const fetchSavedConfig = async () => {
      try {
        const response = await get('/export-import-kkm/config');
        let config;
        if (Array.isArray(response.data)) {
          config = response.data[0];
        } else {
          config = response.data;
        }
        if (config) {
          setExportCollections(config.selectedExportCollections || []);
          setImportCollections(config.selectedImportCollections || []);
        }
      } catch (error) {
        console.error('Error fetching saved config:', error);
      }
    };
    fetchSavedConfig();
  }, [get]);

  // Handle toggle สำหรับ Export
  const handleExportToggle = (uid) => {
    if (exportCollections.includes(uid)) {
      setExportCollections(exportCollections.filter((v) => v !== uid));
    } else {
      setExportCollections([...exportCollections, uid]);
    }
  };

  // Handle toggle สำหรับ Import
  const handleImportToggle = (uid) => {
    if (importCollections.includes(uid)) {
      setImportCollections(importCollections.filter((v) => v !== uid));
    } else {
      setImportCollections([...importCollections, uid]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await post('/export-import-kkm/config', {
        data: {
          selectedExportCollections: exportCollections,
          selectedImportCollections: importCollections,
        },
      });
      console.log('Config saved:', response.data);
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Main padding={8}>
      <Box>
        <Typography variant="beta" as="h1">
          Welcome to the Export/Import system.
        </Typography>
        <Typography variant="omega" as="p">
          Configure the display of the Export or Import button using the desired Collection through
          the options below
        </Typography>
      </Box>
      <Box padding={4}>
        <Divider />
      </Box>
      {/* สร้าง layout สองคอลัมน์ */} 
      <Flex gap={8} alignItems="flex-start">
        {/* Column Export */}
        <Box width="50%" padding={4} borderColor={{initial: '#fff'}}>
          <Typography variant="beta" as="h2">
            Export Collections
          </Typography>
          <Flex direction="column" gap={2} marginTop={2} alignItems="left">
            {collectionTypes.map((ct) => (
              <Checkbox
                key={ct.uid}
                checked={exportCollections.includes(ct.uid)}
                onCheckedChange={() => handleExportToggle(ct.uid)}
                disabled={isSaving}
              >
                {ct.schema.displayName}
              </Checkbox>
            ))}
          </Flex>
        </Box>

        {/* Column Import */}
        <Box width="50%" padding={4} borderColor={{initial: '#fff'}}>
          <Typography variant="beta" as="h2">
            Import Collections
          </Typography>
          <Flex direction="column" gap={2} marginTop={2} alignItems="left">
            {collectionTypes.map((ct) => (
              <Checkbox
                key={ct.uid}
                checked={importCollections.includes(ct.uid)}
                onCheckedChange={() => handleImportToggle(ct.uid)}
                disabled={isSaving}
              >
                {ct.schema.displayName}
              </Checkbox>
            ))}
          </Flex>
        </Box>
      </Flex>

      <Flex marginTop={4} justifyContent="center" alignItems="center">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Config'}
        </Button>
      </Flex>

      <Box style={{ position: 'fixed', bottom: 0 }}>
      <Typography variant="pi" as="p">
          This plugin is developed for free use. The developer is happy for you to use or modify it as needed. 
          You can find more information on 
          <a href="https://github.com/kidkarnmai/export-import-kkm" target="_blank" rel="noopener noreferrer"> the project's GitHub page</a>. 
          For a more complete installation package, you can check out <a href='https://www.npmjs.com/package/strapi-backend-pack' target='_blank'  rel="noopener noreferrer">Strapi Backend Pack</a>
        </Typography>
      </Box>
    </Main>
  );
};

export { HomePage };
