# Clearance API Endpoints - Visual Reference

## Base URL: `/api/clearances`

---

## 🟢 GET Endpoints (16 Total)

### Core Retrieval
```
├── GET /
│   ├── Purpose: List all clearances (paginated)
│   ├── Params: page, limit, search, format_type, status, date_from, date_to
│   └── Returns: { data: [], pagination: {} }
│
├── GET /:id
│   ├── Purpose: Get single clearance by ID
│   ├── Params: id (URL parameter)
│   └── Returns: { id, or_number, format_type, ... }
│
├── GET /or/:or_number
│   ├── Purpose: Get clearance by OR number
│   ├── Params: or_number (URL parameter)
│   └── Returns: { id, or_number, ... }
│
├── GET /:id/verify
│   ├── Purpose: Verify clearance validity
│   ├── Params: id (URL parameter)
│   └── Returns: { verification_status: "VALID|EXPIRED|REVOKED|..." }
│
├── GET /:id/generate-pdf
│   ├── Purpose: Generate PDF certificate
│   ├── Params: id (URL parameter)
│   └── Returns: HTML content (printable to PDF)
│
├── GET /:id/audit-logs
│   ├── Purpose: Get complete audit trail
│   ├── Params: id (URL parameter)
│   └── Returns: [{ action, user, timestamp, ... }]
│
├── GET /:id/activity
│   ├── Purpose: Get activity summary
│   ├── Params: id (URL parameter)
│   └── Returns: [{ action_label, action_by_name, created_at }]
│
└── GET /issuers
    ├── Purpose: Get list of prosecutors/issuers
    ├── Params: none
    └── Returns: [{ issued_by_user_id, issued_by_name }]
```

### Statistics & Reports
```
├── GET /stats/overview
│   ├── Purpose: Dashboard statistics
│   ├── Params: none
│   └── Returns: { total, thisMonth, noCR, hasCR, byFormat }
│
├── GET /stats/by-date
│   ├── Purpose: Statistics by issue date
│   ├── Params: date_from, date_to
│   └── Returns: [{ issue_date, total_issued, total_fees, ... }]
│
├── GET /stats/by-format
│   ├── Purpose: Statistics by certificate format
│   ├── Params: none
│   └── Returns: [{ format_type, count, total_fees, ... }]
│
├── GET /stats/by-purpose
│   ├── Purpose: Statistics by purpose
│   ├── Params: none
│   └── Returns: [{ purpose, count, total_fees, avg_fee }]
│
├── GET /stats/by-issuer
│   ├── Purpose: Statistics by prosecutor
│   ├── Params: none
│   └── Returns: [{ issued_by_name, clearances_issued, total_fees, ... }]
│
├── GET /stats/validity
│   ├── Purpose: Validity status overview
│   ├── Params: none
│   └── Returns: [{ validity_status, count }]
│
├── GET /purposes
│   ├── Purpose: Get available purposes with fees
│   ├── Params: none
│   └── Returns: [{ id, purpose_name, fee, is_active, sort_order }]
│
├── GET /export/excel
│   ├── Purpose: Export to Excel format
│   ├── Params: date_from, date_to, format_type
│   └── Returns: Binary XLSX file attachment
│
└── GET /export/csv
    ├── Purpose: Export to CSV format
    ├── Params: date_from, date_to, format_type
    └── Returns: CSV text attachment
```

---

## 🔵 POST Endpoints (5 Total)

### Create & Logging
```
├── POST /
│   ├── Purpose: Create new clearance
│   ├── Body: { format_type, first_name, last_name, ... }
│   └── Returns: { success, data: { id, or_number } }
│
├── POST /:id/log-download
│   ├── Purpose: Log certificate download
│   ├── Body: { user_id, user_name }
│   └── Returns: { success }
│
├── POST /:id/log-print
│   ├── Purpose: Log certificate print
│   ├── Body: { user_id, user_name }
│   └── Returns: { success, message }
│
├── POST /:id/revoke
│   ├── Purpose: Revoke certificate
│   ├── Body: { revoke_reason, revoked_by_user_id, revoked_by_name }
│   └── Returns: { success, message }
│
└── POST /search/advanced
    ├── Purpose: Advanced search with multiple filters
    ├── Body: { applicant_name, format_type, status, date_from, ... }
    └── Returns: { data: [], pagination: {} }
```

---

## 🟡 PUT Endpoints (5 Total)

### Update Operations
```
├── PUT /:id
│   ├── Purpose: Update clearance details
│   ├── Body: { format_type, first_name, last_name, ... }
│   └── Returns: { success, message }
│
├── PUT /:id/status
│   ├── Purpose: Update single clearance status
│   ├── Body: { status, updated_by_user_id, updated_by_name }
│   ├── Valid Status: "Valid", "Expired", "Revoked", "Cancelled"
│   └── Returns: { success, data: { id, status } }
│
└── PUT /bulk/status-update
    ├── Purpose: Bulk update multiple clearances
    ├── Body: { clearance_ids: [], new_status, updated_by_user_id, ... }
    ├── Valid Status: "Valid", "Expired", "Revoked", "Cancelled"
    └── Returns: { success, data: { updated_count } }
```

---

## 🔴 DELETE Endpoints (1 Total)

### Soft Delete
```
└── DELETE /:id
    ├── Purpose: Soft delete clearance (preserve in DB)
    ├── Body: { deleted_by_user_id, deleted_by_name }
    └── Returns: { success, message }
```

---

## 📊 ENDPOINT SUMMARY

```
Total Endpoints: 29

By HTTP Method:
├── GET:    16 endpoints (55%)
├── POST:    5 endpoints (17%)
├── PUT:     5 endpoints (17%)
└── DELETE:  1 endpoint  (3%)

By Category:
├── Core CRUD:              6 endpoints
├── Certificate Management: 4 endpoints
├── Audit & Logging:        4 endpoints
├── Statistics:             6 endpoints
└── Search & Export:        3 endpoints (overlaps in list)
```

---

## 🔄 REQUEST/RESPONSE FLOW

### Successful Request
```
Request  ──────────────────────────────────────→  Server
          Headers, Body, Query Parameters
                                                  ↓
                                            Validation
                                            Processing
                                            Database
                                                  ↓
Response ←──────────────────────────────────────  
         200/201 Status + JSON Body
         Headers with Content-Type
```

### Error Request
```
Request  ──────────────────────────────────────→  Server
          Invalid/Missing Data
                                                  ↓
                                            Validation Fails
                                                  ↓
Response ←──────────────────────────────────────  
         400/404/500 Status + Error Message
```

---

## 🎯 COMMON REQUEST PATTERNS

### List with Pagination
```bash
GET /api/clearances?page=1&limit=10
```
Response: { data: [], pagination: { page, limit, total, totalPages } }

### Search with Filters
```bash
GET /api/clearances?search=Juan&format_type=A&status=Valid
```
Response: Filtered clearances matching all criteria

### Create New Record
```bash
POST /api/clearances
{ format_type, first_name, last_name, ... all required fields ... }
```
Response: { success: true, data: { id, or_number } }

### Update Single Field
```bash
PUT /api/clearances/1/status
{ status: "Expired", updated_by_user_id: 1, updated_by_name: "Admin" }
```
Response: { success: true, message: "Status updated" }

### Bulk Operations
```bash
PUT /api/clearances/bulk/status-update
{ clearance_ids: [1, 2, 3], new_status: "Revoked", ... }
```
Response: { success: true, data: { updated_count: 3 } }

### Get Statistics
```bash
GET /api/clearances/stats/overview
```
Response: { total, thisMonth, noCR, hasCR, byFormat: [] }

### Export Data
```bash
GET /api/clearances/export/excel?date_from=2026-01-01&date_to=2026-01-31
```
Response: Binary XLSX file (browser will download)

### Advanced Search
```bash
POST /api/clearances/search/advanced
{ applicant_name, format_type, status, date_from, ... }
```
Response: { data: [], pagination: {} }

---

## 🔐 SECURITY HEADERS (Recommended)

All requests should include:
```
Content-Type: application/json
Authorization: Bearer {token} (if implemented)
```

All responses include:
```
Content-Type: application/json
X-Content-Type-Options: nosniff
```

---

## 💾 DATABASE OPERATIONS PER ENDPOINT

```
CREATE: POST /
        ├── INSERT into clearances
        ├── INSERT into clearance_audit_log (CREATE action)
        ├── UPDATE clearance_or_sequence
        └── Returns: inserted ID and OR number

READ:   GET endpoints
        ├── SELECT from clearances
        ├── Optional: LEFT JOIN with user info
        ├── Apply filters and pagination
        └── Returns: JSON data

UPDATE: PUT /:id
        ├── SELECT old values (for audit)
        ├── UPDATE clearances
        ├── INSERT into clearance_audit_log (UPDATE action)
        └── Returns: success message

DELETE: DELETE /:id
        ├── UPDATE clearances (set deleted_at)
        ├── INSERT into clearance_audit_log (DELETE action)
        └── Returns: success message

EXPORT: GET /export/excel or /export/csv
        ├── SELECT clearances with filters
        ├── Format to Excel/CSV
        └── Returns: file attachment
```

---

## ⚡ PERFORMANCE TIPS

### Pagination
- Use default limit of 10 for better performance
- Max recommended limit: 100 records
- Always use pagination for production queries

### Filtering
- More specific filters = faster results
- Use indexed fields: or_number, applicant name, date, status
- Avoid wildcard searches at start of string

### Exports
- Limit date ranges for large exports
- Consider filtering before export
- Excel supports up to 1 million rows

### Statistics
- Pre-generate at off-peak hours if possible
- Cache results for dashboard
- Use date ranges instead of all-time queries

---

## 🧪 TESTING CHECKLIST

### For Each Endpoint:
- [ ] Test with valid data
- [ ] Test with missing required fields
- [ ] Test with invalid data types
- [ ] Test with SQL injection attempts (should fail safely)
- [ ] Verify response status codes
- [ ] Check audit logs for logging
- [ ] Verify pagination boundaries
- [ ] Test concurrent requests

### Critical Endpoints to Test:
- [ ] POST / (create) - Verify OR number generation
- [ ] GET / (list) - Verify pagination
- [ ] PUT /:id/status - Verify status changes logged
- [ ] GET /:id/generate-pdf - Verify HTML output
- [ ] GET /export/excel - Verify file format
- [ ] POST /search/advanced - Verify all filters work

---

## 📱 REST API PRINCIPLES FOLLOWED

✅ **Resource-Based URLs**: `/api/clearances` represents collection
✅ **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (delete)
✅ **Status Codes**: 200 (success), 201 (created), 400 (bad), 404 (not found), 500 (error)
✅ **JSON Responses**: Consistent JSON format
✅ **Pagination**: Supports page-based pagination
✅ **Filtering**: Query parameters for filtering
✅ **Error Handling**: Consistent error responses

---

## 🎓 EXAMPLE WORKFLOWS

### Complete Certificate Issuance Workflow
```
1. GET /api/clearances/purposes          ← Get available purposes
2. POST /api/clearances                  ← Create clearance
3. GET /api/clearances/1                 ← Verify creation
4. GET /api/clearances/1/generate-pdf    ← Get PDF
5. POST /api/clearances/1/log-download   ← Log download
6. GET /api/clearances/1/audit-logs      ← Review audit trail
```

### Compliance Report Workflow
```
1. GET /api/clearances/stats/overview           ← Overall stats
2. GET /api/clearances/stats/by-issuer          ← By prosecutor
3. GET /api/clearances/export/excel?date...    ← Export data
4. GET /api/clearances/stats/validity           ← Validity status
5. GET /api/clearances/:id/audit-logs           ← Check audit trail
```

### Revocation Workflow
```
1. GET /api/clearances/1                        ← Get certificate
2. POST /api/clearances/1/revoke                ← Revoke it
3. PUT /api/clearances/1/status                 ← Update status
4. GET /api/clearances/1/activity               ← Check activity
5. GET /api/clearances/stats/validity           ← Verify revoked count
```

---

## 📞 API SUPPORT

For issues:
1. Check [CLEARANCE_API_DOCUMENTATION.md](CLEARANCE_API_DOCUMENTATION.md) for details
2. Review [CLEARANCE_API_QUICK_REFERENCE.md](CLEARANCE_API_QUICK_REFERENCE.md) for examples
3. Check audit logs for error details
4. Verify database tables exist and are accessible
5. Test endpoints with curl or Postman

---

**Last Updated**: January 26, 2026
**API Version**: 1.0.0
**Status**: Production Ready
