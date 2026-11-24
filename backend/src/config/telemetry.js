// Instrumentación de Azure Monitor (OpenTelemetry).
// Solo se activa cuando APPLICATIONINSIGHTS_CONNECTION_STRING está definida (producción en Azure);
// en desarrollo local y en pruebas unitarias no tiene efecto.
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  try {
    const { useAzureMonitor } = require('@azure/monitor-opentelemetry');
    const { registerInstrumentations } = require('@opentelemetry/instrumentation');
    const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
    const { identificarUsuario } = require('../utils/telemetria');

    useAzureMonitor({
      azureMonitorExporterOptions: {
        connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
      },
      enableLiveMetrics: true,
      enableStandardMetrics: true,
      instrumentationOptions: {
        http: { enabled: true, applyCustomAttributesOnSpan: identificarUsuario },
      },
    });

    // Agrega la ruta al nombre de cada petición (ej. "GET /api/usuarios/:id")
    registerInstrumentations({
      instrumentations: [new ExpressInstrumentation()],
    });
  } catch (err) {
    // El monitoreo no debe impedir que la API arranque
    console.error('No se pudo iniciar Azure Monitor:', err.message);
  }
}
