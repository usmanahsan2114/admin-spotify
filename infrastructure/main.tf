terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_instance" "app_server" {
  ami           = "ami-0c55b159cbfafe1f0" # Example AMI ID (Amazon Linux 2)
  instance_type = "t2.micro"

  tags = {
    Name = "ShopifyAdminApp"
  }
}

# Placeholder for RDS (Postgres)
# resource "aws_db_instance" "default" {
#   allocated_storage    = 10
#   db_name              = "shopify_admin"
#   engine               = "postgres"
#   engine_version       = "13.7"
#   instance_class       = "db.t3.micro"
#   username             = "postgres"
#   password             = "change_me_please"
#   parameter_group_name = "default.postgres13"
#   skip_final_snapshot  = true
# }

# Placeholder for Redis (ElastiCache)
# resource "aws_elasticache_cluster" "example" {
#   cluster_id           = "cluster-example"
#   engine               = "redis"
#   node_type            = "cache.t2.micro"
#   num_cache_nodes      = 1
#   parameter_group_name = "default.redis3.2"
#   engine_version       = "3.2.10"
#   port                 = 6379
# }
