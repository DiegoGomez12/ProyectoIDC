output "postgres_host" {
  description = "Host FQDN de PostgreSQL"
  value       = azurerm_postgresql_flexible_server.postgres.fqdn
}

output "postgres_db" {
  description = "Nombre de la base de datos"
  value       = azurerm_postgresql_flexible_server_database.db.name
}

output "postgres_admin" {
  description = "Usuario administrador"
  value       = var.admin_username
}

output "backend_url" {
  description = "URL pública de la API de Backend"
  value       = "https://${azurerm_linux_web_app.backend.default_hostname}"
}

output "frontend_url" {
  description = "URL pública de la aplicación Frontend"
  value       = "https://${azurerm_linux_web_app.frontend.default_hostname}"
}

output "log_analytics_workspace" {
  description = "Nombre del Log Analytics Workspace"
  value       = azurerm_log_analytics_workspace.law.name
}

output "application_insights_name" {
  description = "Nombre del recurso Application Insights"
  value       = azurerm_application_insights.ai.name
}

output "dev_postgres_host" {
  description = "Host FQDN de PostgreSQL en Dev"
  value       = azurerm_postgresql_flexible_server.postgres_dev.fqdn
}

output "dev_postgres_db" {
  description = "Nombre de la base de datos en Dev"
  value       = azurerm_postgresql_flexible_server_database.db_dev.name
}

output "dev_backend_url" {
  description = "URL pública de la API de Backend en Dev"
  value       = "https://${azurerm_linux_web_app.backend_dev.default_hostname}"
}

output "dev_frontend_url" {
  description = "URL pública de la aplicación Frontend en Dev"
  value       = "https://${azurerm_linux_web_app.frontend_dev.default_hostname}"
}

output "dev_application_insights_name" {
  description = "Nombre del recurso Application Insights de Dev"
  value       = azurerm_application_insights.ai_dev.name
}