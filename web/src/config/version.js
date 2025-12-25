// Application Version Information
export const APP_VERSION = '1.2.0-PWA'
export const FEATURES_VERSION = {
  userManagement: '1.0.0',
  expenseCategorization: '1.0.0',
  categoryKPIDashboard: '1.0.0'
}

export const getVersionInfo = () => {
  return {
    app: APP_VERSION,
    features: FEATURES_VERSION,
    buildDate: new Date().toISOString().split('T')[0]
  }
}


