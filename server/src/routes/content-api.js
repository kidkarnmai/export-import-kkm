export default [
  {
    method: 'GET',
    path: '/',
    // name of the controller file & the method.
    handler: 'controller.index',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/export',
    handler: 'exportController.exportData',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/import',
    handler: 'importController.importData',
    config: {
      policies: [],
      auth: false,
    },
  }, 
  {
    method: 'GET',
    path: '/config',
    handler: 'configController.getConfig',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/config',
    handler: 'configController.saveConfig',
    config: {
      policies: [],
      auth: false,
    },
  },
];