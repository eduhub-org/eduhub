# EduHub adapter for cloudflare provider v3, matching the resources currently
# declared in infrastructure/application/{02_network,09_stujo_net}.tf.
# Metadata only: publishing requires a reviewed Terraform plan/apply.
# Never include record contents or secrets. Keep this map in sync when DNS
# resources are added, renamed, moved or removed.
locals {
  dns_resources = merge(
    {
      "cloudflare_record.keycloak"   = cloudflare_record.keycloak
      "cloudflare_record.hasura"     = cloudflare_record.hasura
      "cloudflare_record.eduhub"     = cloudflare_record.eduhub
      "cloudflare_record.eduhub_api" = cloudflare_record.eduhub_api
      "cloudflare_record.stujo"      = cloudflare_record.stujo
    },
    { for key, record in cloudflare_record.stujo_portals :
      "cloudflare_record.stujo_portals[${jsonencode(key)}]" => record
    },
    { for key, record in cloudflare_record.stujo_net :
      "cloudflare_record.stujo_net[${jsonencode(key)}]" => record
    },
    { for key, record in cloudflare_record.stujo_net_www :
      "cloudflare_record.stujo_net_www[${key}]" => record
    }
  )
}

output "dns_inventory" {
  description = "DNS ownership identifiers for external tooling; no record contents or secrets."
  sensitive   = false
  value = {
    schema_version = 1
    records = [for address, record in local.dns_resources : {
      zone_id  = record.zone_id
      id       = record.id
      name     = lower(trimsuffix(record.hostname, "."))
      type     = upper(record.type)
      resource = address
    }]
    # Names/types reserved by the applied configuration, including records
    # whose IDs are not yet known. Consumers can protect the whole DNS name.
    reservations = [for address, record in local.dns_resources : {
      zone_id  = record.zone_id
      name     = lower(trimsuffix(record.hostname, "."))
      type     = upper(record.type)
      resource = address
    }]
  }
}
