variable "aws_region" {
  type        = string
  description = "AWS region to deploy LiftBrain"
  default     = "us-east-1"
}

variable "key_name" {
  type        = string
  description = "Existing EC2 key pair for SSH access"
}

variable "instance_type" {
  type        = string
  default     = "t3.micro"
  description = "Instance size for the docker host"
}

variable "root_volume_size" {
  type        = number
  default     = 30
  description = "Size of the EC2 root volume in GB"
}

variable "allowed_ssh_cidr" {
  type        = string
  default     = "0.0.0.0/0"
  description = "CIDR allowed to SSH. Restrict to your IP for better security."
}

variable "repo_url" {
  type        = string
  description = "Git repository to clone on the EC2 host"
}

variable "letsencrypt_email" {
  type        = string
  description = "Email passed to Caddy/Let's Encrypt"
  default     = ""
}

variable "app_domain" {
  type        = string
  description = "Optional domain name pointed at the EC2 instance"
  default     = ""
}
