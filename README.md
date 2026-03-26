# housing-app-backend

Node JS REST api for the housing app project CasAndes

## Search Analytics Docs

- OpenAPI spec: `docs/openapi/analytics-search.yaml`
- SQL examples: `docs/sql/analytics-search-examples.sql`

### Quick PowerShell Tests

Track one event:

```powershell
$body = @{
	sessionId = 's_demo_1'
	city = 'Bogotá'
	neighborhood = 'Santa Fe'
	source = 'house_list'
	filters = @{ budget = @{ max = 1800000 }; propertyType = 'ROOM' }
} | ConvertTo-Json -Depth 6

Invoke-RestMethod -Method Post `
	-Uri 'http://localhost:3000/api/analytics/search-events' `
	-ContentType 'application/json' `
	-Body $body
```

Get top zones:

```powershell
$from = (Get-Date).AddDays(-30).ToString('o')
$to = (Get-Date).ToString('o')

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/analytics/top-searched-zones?from=$from&to=$to&city=Bogotá&limit=10"
```
