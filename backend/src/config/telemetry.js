// Instrumentación de Azure Monitor (OpenTelemetry).
// Solo se activa cuando APPLICATIONINSIGHTS_CONNECTION_STRING está definida (producción en Azure);
// en desarrollo local y en pruebas unitarias no tiene efecto.
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  const { useAzureMonitor } = require('@azure/monitor-opentelemetry');
  useAzureMonitor({
    azureMonitorExporterOptions: {
      connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    },
    enableLiveMetrics: true,
    enableStandardMetrics: true,
  });
}
