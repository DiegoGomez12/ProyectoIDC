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