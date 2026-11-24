terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.90"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

# PostgreSQL Flexible Server (Burstable B1ms para desarrollo)
resource "azurerm_postgresql_flexible_server" "postgres" {
  name                   = var.server_name
  resource_group_name    = azurerm_resource_group.rg.name
  location               = azurerm_resource_group.rg.location
  version                = "15"
  administrator_login    = var.admin_username
  administrator_password = var.admin_password

  sku_name   = "B_Standard_B1ms"
  storage_mb = 32768 # 32 GB mínimo

  backup_retention_days        = 7
  geo_redundant_backup_enabled = false
  auto_grow_enabled            = false
  lifecycle {
    ignore_changes = [zone]
  }
}

# Base de datos inicial
resource "azurerm_postgresql_flexible_server_database" "db" {
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.postgres.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# Permitir acceso desde cualquier servicio dentro de Azure (para el App Service posterior)
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.postgres.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# App Service Plan (Linux)
resource "azurerm_service_plan" "asp" {
  name                = "asp-timecheck"
  resource_group_name = azurerm_resource_group.rg.name
  location            = "westus2"
  os_type             = "Linux"
  sku_name            = "B1" # Nivel básico compatible con contenedores
}

# App Service: Backend (timecheck-api)
resource "azurerm_linux_web_app" "backend" {
  name                = var.api_app_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = "westus2"
  service_plan_id     = azurerm_service_plan.asp.id
  https_only          = true

  site_config {
    always_on         = true
    health_check_path = "/health"
    application_stack {
      docker_image_name   = "${var.dockerhub_username}/timecheck-api:latest"
      docker_registry_url = "https://index.docker.io"
    }
  }

  logs {
    detailed_error_messages = true
    failed_request_tracing  = true

    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  app_settings = {
    DOCKER_ENABLE_CI                      = "true"
    WEBSITES_PORT                         = "3000"
    NODE_ENV                              = "production"
    PORT                                  = "3000"
    DB_HOST                               = azurerm_postgresql_flexible_server.postgres.fqdn
    DB_PORT                               = "5432"
    POSTGRES_DB                           = azurerm_postgresql_flexible_server_database.db.name
    POSTGRES_USER                         = var.admin_username
    POSTGRES_PASSWORD                     = var.admin_password
    DB_SSL                                = "true"
    JWT_SECRET                            = var.jwt_secret
    JWT_EXPIRES_IN                        = var.jwt_expires_in
    CLIENT_URL                            = "https://${var.web_app_name}.azurewebsites.net"
    APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.ai.connection_string
  }
}

# App Service: Frontend (timecheck-web)
resource "azurerm_linux_web_app" "frontend" {
  name                = var.web_app_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = "westus2"
  service_plan_id     = azurerm_service_plan.asp.id
  https_only          = true

  site_config {
    always_on = true
    application_stack {
      docker_image_name   = "${var.dockerhub_username}/timecheck-web:latest"
      docker_registry_url = "https://index.docker.io"
    }
  }

  logs {
    detailed_error_messages = true
    failed_request_tracing  = true

    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  app_settings = {
    DOCKER_ENABLE_CI = "true"
    WEBSITES_PORT    = "80"
  }
}

# ==========================================
# Observabilidad y Monitoreo (Azure Monitor)
# ==========================================

# Log Analytics Workspace (5 GB/mes gratuitos, retención de 30 días)
resource "azurerm_log_analytics_workspace" "law" {
  name                = "law-timecheck"
  location            = "westus2"
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# Application Insights para telemetría de API, Live Metrics y Application Map
resource "azurerm_application_insights" "ai" {
  name                = "ai-timecheck"
  location            = "westus2"
  resource_group_name = azurerm_resource_group.rg.name
  workspace_id        = azurerm_log_analytics_workspace.law.id
  application_type    = "Node.JS"
}

# Diagnostic Settings: envío de logs y métricas del Backend a Log Analytics
resource "azurerm_monitor_diagnostic_setting" "backend_logs" {
  name                       = "diag-timecheck-api"
  target_resource_id         = azurerm_linux_web_app.backend.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.law.id

  enabled_log {
    category = "AppServiceHTTPLogs"
  }

  enabled_log {
    category = "AppServiceConsoleLogs"
  }

  enabled_log {
    category = "AppServiceAppLogs"
  }

  enabled_log {
    category = "AppServicePlatformLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# Diagnostic Settings: envío de logs y métricas del Frontend a Log Analytics
resource "azurerm_monitor_diagnostic_setting" "frontend_logs" {
  name                       = "diag-timecheck-web"
  target_resource_id         = azurerm_linux_web_app.frontend.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.law.id

  enabled_log {
    category = "AppServiceHTTPLogs"
  }

  enabled_log {
    category = "AppServiceConsoleLogs"
  }

  enabled_log {
    category = "AppServiceAppLogs"
  }

  enabled_log {
    category = "AppServicePlatformLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# Grupo de acción para notificaciones de alertas por correo
resource "azurerm_monitor_action_group" "alerts" {
  name                = "ag-timecheck-alerts"
  resource_group_name = azurerm_resource_group.rg.name
  short_name          = "timecheck"

  email_receiver {
    name                    = "admin-email"
    email_address           = var.alert_email
    use_common_alert_schema = true
  }
}

# Alerta ante errores HTTP 5xx en el Backend
resource "azurerm_monitor_metric_alert" "api_http_5xx" {
  name                = "alert-timecheck-api-5xx"
  resource_group_name = azurerm_resource_group.rg.name
  scopes              = [azurerm_linux_web_app.backend.id]
  description         = "Alerta cuando el backend de TimeCheck registra errores HTTP 5xx."
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "Http5xx"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 0
  }

  action {
    action_group_id = azurerm_monitor_action_group.alerts.id
  }
}

# Alerta ante caída de salud del Backend (incluso sin tráfico de usuarios)
resource "azurerm_monitor_metric_alert" "api_health_check" {
  name                = "alert-timecheck-api-health"
  resource_group_name = azurerm_resource_group.rg.name
  scopes              = [azurerm_linux_web_app.backend.id]
  description         = "Alerta cuando el health check /health del backend de TimeCheck falla."
  severity            = 1
  frequency           = "PT5M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "HealthCheckStatus"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 100
  }

  action {
    action_group_id = azurerm_monitor_action_group.alerts.id
  }
}