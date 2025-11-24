output "instance_public_ip" {
  value       = aws_instance.liftbrain.public_ip
  description = "Public IP of the LiftBrain host"
}

output "instance_public_dns" {
  value       = aws_instance.liftbrain.public_dns
  description = "Public DNS name"
}
