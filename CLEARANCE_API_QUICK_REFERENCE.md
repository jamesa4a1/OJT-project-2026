# Clearance API - Quick Reference Guide

## 🚀 Quick Start

### Base URL
```
/api/clearances
```

---

## 📋 Essential Endpoints

### Core Operations
| Method | Endpoint | Purpose |
|--------|----------|---------|
| **GET** | `/` | List all clearances (paginated) |
| **POST** | `/` | Create new clearance |
| **GET** | `/:id` | Get single clearance |
| **PUT** | `/:id` | Update clearance |
| **DELETE** | `/:id` | Delete clearance (soft) |
| **GET** | `/or/:or_number` | Get by OR number |

### Certificate Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| **GET** | `/:id/generate-pdf` | Generate PDF certificate |
| **POST** | `/:id/revoke` | Revoke certificate |
| **PUT** | `/:id/status` | Update status |
| **PUT** | `/bulk/status-update` | Bulk update status |

### Audit & Logging
| Method | Endpoint | Purpose |
|--------|----------|---------|
| **GET** | `/:id/audit-logs` | Get all audit logs |
| **GET** | `/:id/activity` | Get activity trail |
| **POST** | `/:id/log-download` | Log download |
| **POST** | `/:id/log-print` | Log print |

### Statistics
| Method | Endpoint | Purpose |
|--------|----------|---------|
| **GET** | `/stats/overview` | Overall statistics |
| **GET** | `/stats/by-date` | Stats by date |
| **GET** | `/stats/by-format` | Stats by format |
| **GET** | `/stats/by-purpose` | Stats by purpose |
| **GET** | `/stats/by-issuer` | Stats by issuer |
| **GET** | `/stats/validity` | Validity status counts |

### Search & Export
| Method | Endpoint | Purpose |
|--------|----------|---------|
| **POST** | `/search/advanced` | Advanced search |
| **GET** | `/export/excel` | Export to Excel |
| **GET** | `/export/csv` | Export to CSV |
| **GET** | `/purposes` | Get clearance purposes |
| **GET** | `/issuers` | Get available issuers |
| **GET** | `/:id/verify` | Verify clearance |

---

## 🔑 Common Request Patterns

### Create Clearance
```bash
POST /api/clearances
Content-Type: application/json

{
  "format_type": "A",
  "first_name": "Juan",
  "last_name": "Cruz",
  "age": 30,
  "civil_status": "Single",
  "nationality": "Filipino",
  "address": "123 Main St",
  "purpose": "Local Employment",
  "date_issued": "2026-01-26",
  "validity_period": "6 Months",
  "validity_expiry": "2026-07-26",
  "issued_by_user_id": 1,
  "issued_by_name": "Prosecutor Name"
}
```

### Search Clearances
```bash
GET /api/clearances?page=1&limit=10&search=Juan&format_type=A&status=Valid
```

### Advanced Search
```bash
POST /api/clearances/search/advanced
Content-Type: application/json

{
  "applicant_name": "Juan",
  "format_type": "A",
  "status": "Valid",
  "date_issued_from": "2026-01-01",
  "date_issued_to": "2026-01-31",
  "page": 1,
  "limit": 10
}
```

### Update Status
```bash
PUT /api/clearances/1/status
Content-Type: application/json

{
  "status": "Expired",
  "updated_by_user_id": 1,
  "updated_by_name": "Admin"
}
```

### Revoke Clearance
```bash
POST /api/clearances/1/revoke
Content-Type: application/json

{
  "revoke_reason": "Duplicate entry",
  "revoked_by_user_id": 1,
  "revoked_by_name": "Admin"
}
```

### Export Data
```bash
GET /api/clearances/export/excel?date_from=2026-01-01&date_to=2026-01-31
```

---

## 📊 Response Structure

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* ... */ }
}
```

### Paginated Response
```json
{
  "data": [ /* array of records */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "error": "Error message describing what went wrong"
}
```

---

## 🎯 Certificate Formats

| Code | Description |
|------|-------------|
| **A** | Individual - No Criminal Record |
| **B** | Individual - Has Criminal Record |
| **C** | Family/Requester - No Criminal Record |
| **D** | Family/Requester - Has Criminal Record |
| **E** | Individual - No Derogatory Record |
| **F** | Individual - Balsaff Application |

---

## 🔐 Status Values

| Status | Meaning |
|--------|---------|
| **Valid** | Currently active |
| **Expired** | Past validity date |
| **Revoked** | Revoked by authority |
| **Cancelled** | Cancelled by admin |

---

## 📅 Validity Periods

| Period | Duration |
|--------|----------|
| **6 Months** | 6 months from issue date |
| **1 Year** | 12 months from issue date |

---

## 🔍 Query Parameters

### Filtering
```
?search=name              # Search by applicant name or OR number
?format_type=A            # Filter by format
?has_criminal_record=true # Filter by criminal record
?status=Valid             # Filter by status
?issued_by=1              # Filter by issuer user ID
```

### Date Range
```
?date_from=2026-01-01     # Start date
?date_to=2026-01-31       # End date
```

### Pagination
```
?page=1                   # Page number (default: 1)
?limit=10                 # Records per page (default: 10)
```

---

## 📝 Audit Log Actions

| Action | When It's Logged |
|--------|-----------------|
| **CREATE** | New clearance created |
| **UPDATE** | Clearance details modified |
| **DELETE** | Clearance soft-deleted |
| **DOWNLOAD** | Certificate PDF generated |
| **PRINT** | Certificate printed |
| **REVOKE** | Certificate revoked |

---

## ⚙️ Common Use Cases

### 1. Issue New Clearance
```bash
# Create clearance
POST /api/clearances

# Generate PDF
GET /api/clearances/{id}/generate-pdf

# Log download
POST /api/clearances/{id}/log-download
```

### 2. Manage Expiring Clearances
```bash
# Find expiring clearances
GET /api/clearances/stats/validity

# Update to expired status
PUT /api/clearances/{id}/status
```

### 3. Generate Reports
```bash
# Get statistics by date
GET /api/clearances/stats/by-date?date_from=2026-01-01&date_to=2026-01-31

# Export to Excel
GET /api/clearances/export/excel?date_from=2026-01-01
```

### 4. Audit Trail
```bash
# Check all changes to a clearance
GET /api/clearances/{id}/audit-logs

# View activity summary
GET /api/clearances/{id}/activity
```

### 5. Search & Filter
```bash
# Simple search
GET /api/clearances?search=Juan&status=Valid

# Advanced search
POST /api/clearances/search/advanced
```

---

## 🔗 Authentication Notes

Each request involving user actions should include:
- `user_id`: The ID of the user making the request
- `user_name`: The name of the user (for audit logging)

Example:
```json
{
  "updated_by_user_id": 1,
  "updated_by_name": "Prosecutor Name"
}
```

---

## 💡 Tips

1. **Batch Operations**: Use bulk endpoint for updating multiple clearances
2. **Export Data**: Regularly export data for backups
3. **Monitor Audit Logs**: Check logs for suspicious activities
4. **OR Numbers**: Automatically generated - don't modify manually
5. **Date Format**: Always use YYYY-MM-DD format for dates

---

## 🐛 Troubleshooting

### Missing Clearance
- Check if it was deleted (soft-deleted clearances won't appear)
- Use advanced search with exact filters
- Verify the OR number is correct

### Status Update Failed
- Ensure status is one of: Valid, Expired, Revoked, Cancelled
- Check that user_id and user_name are provided

### Export Issues
- Verify date format (YYYY-MM-DD)
- Check that sufficient records exist for the date range
- Ensure file download is allowed by browser

---

## 📞 Support

For API integration issues:
1. Check the full documentation: `CLEARANCE_API_DOCUMENTATION.md`
2. Review request/response examples
3. Check audit logs for error details
4. Verify all required fields are provided

---

## 📦 Database Tables

The clearance system uses:
- `clearances`: Main clearance records
- `clearance_audit_log`: Audit trail
- `clearance_or_sequence`: OR number generator
- `clearance_purposes`: Available purposes with fees
