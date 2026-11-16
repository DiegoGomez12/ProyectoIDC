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