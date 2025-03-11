export default [
  {
    method: 'GET',
    path: '/export',
    handler: 'exportController.exportData',
    config: {
      policies: [],
     
    },
  },
  {
    method: 'POST',
    path: '/import',
    handler: 'importController.importData',
    config: {
      policies: [],
     
    },
  }, 
  {
    method: 'GET',
    path: '/config',
    handler: 'configController.getConfig',
    config: {
      policies: [],
     
    },
  },
  {
    method: 'POST',
    path: '/config',
    handler: 'configController.saveConfig',
    config: {
      policies: [],
     
    },
  }
];

