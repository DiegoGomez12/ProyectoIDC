variable "resource_group_name" {
  description = "Nombre del Resource Group en Azure"
  type        = string
  default     = "rg-timecheck"
}

variable "location" {
  description = "Región de Azure"
  type        = string
  default     = "centralus"
}

variable "server_name" {
  description = "Nombre único del servidor PostgreSQL (letras minúsculas, números y guiones)"
  type        = string
  default     = "timecheck-db-server"
}

variable "db_name" {
  description = "Nombre de la base de datos inicial"
  type        = string
  default     = "timecheck"
}

variable "admin_username" {
  description = "Usuario administrador de PostgreSQL"
  type        = string
  default     = "timecheck_admin"
}

variable "admin_password" {
  description = "Contraseña del administrador"
  type        = string
  sensitive   = true
}

variable "dockerhub_username" {
  description = "Nombre de usuario en Docker Hub"
  type        = string
}

variable "api_app_name" {
  description = "Nombre del App Service para el Backend"
  type        = string
  default     = "timecheck-api-equipo-idc"
}

variable "web_app_name" {
  description = "Nombre del App Service para el Frontend"
  type        = string
  default     = "timecheck-web-equipo-idc"
}

variable "jwt_secret" {
  description = "Clave secreta para firmar los tokens JWT"
  type        = string
  sensitive   = true
}

variable "jwt_expires_in" {
  description = "Tiempo de expiración del token JWT"
  type        = string
  default     = "10h"
}

variable "alert_email" {
  description = "Correo electrónico para recibir alertas de errores 5xx en Azure Monitor"
  type        = string
  sensitive   = true
}