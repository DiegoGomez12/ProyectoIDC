# ==========================================
# Ambiente Dev aislado en Azure (Issue #31)
# ==========================================

# Resource Group dedicado para Dev
resource "azurerm_resource_group" "rg_dev" {
  name     = var.dev_resource_group_name
  location = var.location
}

# PostgreSQL Flexible Server independiente para Dev
resource "azurerm_postgresql_flexible_server" "postgres_dev" {
  name                   = var.dev_server_name
  resource_group_name    = azurerm_resource_group.rg_dev.name
  location               = azurerm_resource_group.rg_dev.location
  version                = "15"
  administrator_login    = var.dev_admin_username
  administrator_password = var.dev_admin_password

  sku_name   = "B_Standard_B1ms"
  storage_mb = 32768 # 32 GB mínimo

  backup_retention_days        = 7
  geo_redundant_backup_enabled = false
  auto_grow_enabled            = false

  lifecycle {
    ignore_changes = [zone]
  }
}

# Base de datos dedicada de Dev
resource "azurerm_postgresql_flexible_server_database" "db_dev" {
  name      = var.dev_db_name
  server_id = azurerm_postgresql_flexible_server.postgres_dev.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# Permitir acceso desde servicios de Azure al servidor PostgreSQL de Dev
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_dev" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.postgres_dev.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# App Service Plan (Linux B1) dedicado para Dev
resource "azurerm_service_plan" "asp_dev" {
  name                = "asp-timecheck-dev"
  resource_group_name = azurerm_resource_group.rg_dev.name
  location            = "westus3"
  os_type             = "Linux"
  sku_name            = "B1"
}

# Application Insights separado para Dev (enlazado al mismo Log Analytics Workspace)
resource "azurerm_application_insights" "ai_dev" {
  name                = "ai-timecheck-dev"
  location            = "westus2"
  resource_group_name = azurerm_resource_group.rg_dev.name
  workspace_id        = azurerm_log_analytics_workspace.law.id
  application_type    = "Node.JS"
}

# App Service: Backend Dev (timecheck-api-dev)
resource "azurerm_linux_web_app" "backend_dev" {
  name                = var.dev_api_app_name
  resource_group_name = azurerm_resource_group.rg_dev.name
  location            = "westus3"
  service_plan_id     = azurerm_service_plan.asp_dev.id

  site_config {
    always_on         = true
    health_check_path = "/health"
    application_stack {
      docker_image_name   = "${var.dockerhub_username}/timecheck-api:dev"
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
    DB_HOST                               = azurerm_postgresql_flexible_server.postgres_dev.fqdn
    DB_PORT                               = "5432"
    POSTGRES_DB                           = azurerm_postgresql_flexible_server_database.db_dev.name
    POSTGRES_USER                         = var.dev_admin_username
    POSTGRES_PASSWORD                     = var.dev_admin_password
    DB_SSL                                = "true"
    JWT_SECRET                            = var.dev_jwt_secret
    JWT_EXPIRES_IN                        = var.jwt_expires_in
    CLIENT_URL                            = "https://${var.dev_web_app_name}.azurewebsites.net"
    APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.ai_dev.connection_string
  }
  https_only = true
}

# App Service: Frontend Dev (timecheck-web-dev)
resource "azurerm_linux_web_app" "frontend_dev" {
  name                = var.dev_web_app_name
  resource_group_name = azurerm_resource_group.rg_dev.name
  location            = "westus3"
  service_plan_id     = azurerm_service_plan.asp_dev.id
  https_only          = true

  site_config {
    always_on = true
    application_stack {
      docker_image_name   = "${var.dockerhub_username}/timecheck-web:dev"
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

# Diagnostic Settings de Dev hacia Log Analytics
resource "azurerm_monitor_diagnostic_setting" "backend_dev_logs" {
  name                       = "diag-timecheck-api-dev"
  target_resource_id         = azurerm_linux_web_app.backend_dev.id
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

resource "azurerm_monitor_diagnostic_setting" "frontend_dev_logs" {
  name                       = "diag-timecheck-web-dev"
  target_resource_id         = azurerm_linux_web_app.frontend_dev.id
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
