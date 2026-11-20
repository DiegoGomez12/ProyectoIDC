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

  site_config {
    always_on = true
    application_stack {
      docker_image_name   = "${var.dockerhub_username}/timecheck-api:latest"
      docker_registry_url = "https://index.docker.io"
    }
  }

  app_settings = {
    DOCKER_ENABLE_CI     = "true"
    WEBSITES_PORT        = "3000"
    NODE_ENV             = "production"
    PORT                 = "3000"
    DB_HOST              = azurerm_postgresql_flexible_server.postgres.fqdn
    DB_PORT              = "5432"
    POSTGRES_DB          = azurerm_postgresql_flexible_server_database.db.name
    POSTGRES_USER        = var.admin_username
    POSTGRES_PASSWORD    = var.admin_password
    DB_SSL               = "true"
    JWT_SECRET           = var.jwt_secret
    JWT_EXPIRES_IN       = var.jwt_expires_in
    CLIENT_URL           = "https://${var.web_app_name}.azurewebsites.net"
  }
}

# App Service: Frontend (timecheck-web)
resource "azurerm_linux_web_app" "frontend" {
  name                = var.web_app_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = "westus2"
  service_plan_id     = azurerm_service_plan.asp.id

  site_config {
    always_on = true
    application_stack {
      docker_image_name   = "${var.dockerhub_username}/timecheck-web:latest"
      docker_registry_url = "https://index.docker.io"
    }
  }

  app_settings = {
    DOCKER_ENABLE_CI = "true"
    WEBSITES_PORT    = "80"
  }
}