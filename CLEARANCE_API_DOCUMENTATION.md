# Clearance Certification Generator - API Documentation

## Base URL
All endpoints are under: `/api/clearances`

---

## Table of Contents
1. [Core CRUD Operations](#core-crud-operations)
2. [Certificate Management](#certificate-management)
3. [Audit & Logging](#audit--logging)
4. [Statistics & Analytics](#statistics--analytics)
5. [Search & Export](#search--export)
6. [Status Management](#status-management)
7. [Verification](#verification)

---

## Core CRUD Operations

### 1. Create New Clearance
**POST** `/api/clearances`

Creates a new clearance certificate with automatic OR number generation.

**Request Body:**
```json
{
  "format_type": "A",
  "first_name": "Juan",
  "middle_name": "de la",
  "last_name": "Cruz",
  "suffix": "Jr.",
  "alias": "",
  "age": 30,
  "civil_status": "Single",
  "nationality": "Filipino",
  "address": "123 Main St, Tagbilaran City",
  "has_criminal_record": false,
  "case_numbers": null,
  "crime_description": null,
  "legal_statute": null,
  "date_of_commission": null,
  "date_information_filed": null,
  "case_status": null,
  "court_branch": null,
  "purpose": "Local Employment",
  "purpose_fee": 50.00,
  "issued_upon_request_by": null,
  "date_issued": "2026-01-26",
  "prc_id_number": "123456",
  "validity_period": "6 Months",
  "validity_expiry": "2026-07-26",
  "issued_by_user_id": 1,
  "issued_by_name": "Prosecutor Name",
  "notes": ""
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Clearance created successfully",
  "data": {
    "id": 1,
    "or_number": "OCP-2026-8254601"
  }
}
```

---

### 2. Get All Clearances (with Pagination & Filtering)
**GET** `/api/clearances`

Retrieves paginated list of clearances with optional filters.

**Query Parameters:**
```
page=1                    // Page number (default: 1)
limit=10                  // Records per page (default: 10)
search=Juan              // Search by name or OR number
format_type=A            // Filter by format (A, B, C, D, E, F)
has_criminal_record=true // Filter by criminal record
date_from=2026-01-01     // Date range start
date_to=2026-01-31       // Date range end
issued_by=1              // Filter by issuer user ID
status=Valid             // Filter by status (Valid, Expired, Revoked, Cancelled)
```

**Example Request:**
```
GET /api/clearances?page=1&limit=10&search=Juan&format_type=A
```

**Response (Success - 200):**
```json
{
  "data": [
    {
      "id": 1,
      "or_number": "OCP-2026-8254601",
      "format_type": "A",
      "first_name": "Juan",
      "last_name": "Cruz",
      "age": 30,
      "civil_status": "Single",
      "has_criminal_record": false,
      "purpose": "Local Employment",
      "date_issued": "2026-01-26",
      "validity_expiry": "2026-07-26",
      "status": "Valid",
      "issued_by_name": "Prosecutor Name",
      "created_at": "2026-01-26T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### 3. Get Single Clearance
**GET** `/api/clearances/:id`

Retrieves a single clearance by ID.

**Response (Success - 200):**
```json
{
  "id": 1,
  "or_number": "OCP-2026-8254601",
  "format_type": "A",
  "first_name": "Juan",
  "middle_name": "de la",
  "last_name": "Cruz",
  "age": 30,
  "civil_status": "Single",
  "nationality": "Filipino",
  "address": "123 Main St, Tagbilaran City",
  "has_criminal_record": false,
  "purpose": "Local Employment",
  "purpose_fee": 50.00,
  "date_issued": "2026-01-26",
  "validity_expiry": "2026-07-26",
  "status": "Valid",
  "issued_by_name": "Prosecutor Name",
  "created_at": "2026-01-26T10:00:00Z"
}
```

---

### 4. Get Clearance by OR Number
**GET** `/api/clearances/or/:or_number`

Retrieves clearance by Official Receipt number.

**Example:**
```
GET /api/clearances/or/OCP-2026-8254601
```

**Response:** Same structure as single clearance

---

### 5. Update Clearance
**PUT** `/api/clearances/:id`

Updates an existing clearance (all fields except OR number).

**Request Body:**
```json
{
  "format_type": "A",
  "first_name": "Juan",
  "age": 31,
  "purpose": "Foreign Employment",
  "updated_by_user_id": 1,
  "updated_by_name": "Admin User"
  // ... other fields
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Clearance updated successfully"
}
```

---

### 6. Delete Clearance (Soft Delete)
**DELETE** `/api/clearances/:id`

Soft deletes a clearance (marks as deleted without removing from database).

**Request Body:**
```json
{
  "deleted_by_user_id": 1,
  "deleted_by_name": "Admin User"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Clearance deleted successfully"
}
```

---

## Certificate Management

### 1. Generate PDF Certificate
**GET** `/api/clearances/:id/generate-pdf`

Generates and returns an HTML/PDF version of the clearance certificate.

**Example:**
```
GET /api/clearances/1/generate-pdf
```

**Response:**
- Returns HTML content with PDF-ready styling
- Can be printed to PDF using browser print dialog
- Automatically logs the download action to audit log

---

### 2. Revoke Clearance
**POST** `/api/clearances/:id/revoke`

Revokes a clearance and logs the action.

**Request Body:**
```json
{
  "revoke_reason": "Duplicate entry",
  "revoked_by_user_id": 1,
  "revoked_by_name": "Admin User"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Clearance revoked successfully"
}
```

---

### 3. Update Clearance Status
**PUT** `/api/clearances/:id/status`

Updates the status of a clearance.

**Request Body:**
```json
{
  "status": "Valid|Expired|Revoked|Cancelled",
  "updated_by_user_id": 1,
  "updated_by_name": "Admin User"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Clearance status updated to Valid",
  "data": {
    "id": 1,
    "status": "Valid"
  }
}
```

---

### 4. Bulk Status Update
**PUT** `/api/clearances/bulk/status-update`

Updates status for multiple clearances at once.

**Request Body:**
```json
{
  "clearance_ids": [1, 2, 3, 4, 5],
  "new_status": "Expired",
  "updated_by_user_id": 1,
  "updated_by_name": "Admin User"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Updated 5 clearances to Expired",
  "data": {
    "updated_count": 5
  }
}
```

---

## Audit & Logging

### 1. Get Clearance Audit Logs
**GET** `/api/clearances/:id/audit-logs`

Retrieves complete audit trail for a clearance.

**Response (Success - 200):**
```json
[
  {
    "id": 1,
    "clearance_id": 1,
    "action": "CREATE",
    "action_by_name": "Prosecutor Name",
    "old_values": null,
    "new_values": "{\"format_type\":\"A\",...}",
    "created_at": "2026-01-26T10:00:00Z"
  },
  {
    "id": 2,
    "clearance_id": 1,
    "action": "DOWNLOAD",
    "action_by_name": "User Name",
    "created_at": "2026-01-26T11:00:00Z"
  }
]
```

---

### 2. Get Activity/Audit Trail
**GET** `/api/clearances/:id/activity`

Retrieves simplified activity log with action labels.

**Response (Success - 200):**
```json
[
  {
    "action": "CREATE",
    "action_by_name": "Prosecutor Name",
    "action_label": "Created",
    "created_at": "2026-01-26T10:00:00Z"
  },
  {
    "action": "DOWNLOAD",
    "action_by_name": "User Name",
    "action_label": "Downloaded",
    "created_at": "2026-01-26T11:00:00Z"
  }
]
```

---

### 3. Log Download
**POST** `/api/clearances/:id/log-download`

Manually log a clearance download event.

**Request Body:**
```json
{
  "user_id": 1,
  "user_name": "User Name"
}
```

**Response (Success - 200):**
```json
{
  "success": true
}
```

---

### 4. Log Print
**POST** `/api/clearances/:id/log-print`

Log a clearance print event.

**Request Body:**
```json
{
  "user_id": 1,
  "user_name": "User Name"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Print logged successfully"
}
```

---

## Statistics & Analytics

### 1. Overview Statistics
**GET** `/api/clearances/stats/overview`

Gets overall statistics on clearances.

**Response (Success - 200):**
```json
{
  "total": 150,
  "thisMonth": 25,
  "noCriminalRecord": 120,
  "hasCriminalRecord": 30,
  "byFormat": [
    {"format_type": "A", "count": 50},
    {"format_type": "B", "count": 30},
    {"format_type": "C", "count": 40},
    {"format_type": "D", "count": 30}
  ]
}
```

---

### 2. Statistics by Date
**GET** `/api/clearances/stats/by-date`

Gets statistics grouped by issue date.

**Query Parameters:**
```
date_from=2026-01-01
date_to=2026-01-31
```

**Response (Success - 200):**
```json
[
  {
    "issue_date": "2026-01-26",
    "total_issued": 5,
    "with_criminal_record": 1,
    "without_criminal_record": 4,
    "total_fees": 200.00
  }
]
```

---

### 3. Statistics by Format
**GET** `/api/clearances/stats/by-format`

Gets statistics for each certificate format.

**Response (Success - 200):**
```json
[
  {
    "format_type": "A",
    "format_label": "Individual - No CR",
    "count": 50,
    "with_criminal_record": 0,
    "total_fees": 2500.00
  }
]
```

---

### 4. Statistics by Purpose
**GET** `/api/clearances/stats/by-purpose`

Gets statistics grouped by purpose of clearance.

**Response (Success - 200):**
```json
[
  {
    "purpose": "Local Employment",
    "count": 75,
    "total_fees": 3750.00,
    "avg_fee": 50.00
  }
]
```

---

### 5. Statistics by Issuer
**GET** `/api/clearances/stats/by-issuer`

Gets statistics for each prosecutor who issued clearances.

**Response (Success - 200):**
```json
[
  {
    "issued_by_user_id": 1,
    "issued_by_name": "Prosecutor Name",
    "clearances_issued": 50,
    "with_criminal_record": 10,
    "total_fees": 2500.00,
    "last_issued": "2026-01-26"
  }
]
```

---

### 6. Validity Status Overview
**GET** `/api/clearances/stats/validity`

Gets count of clearances by validity status.

**Response (Success - 200):**
```json
[
  {"validity_status": "Valid", "count": 120},
  {"validity_status": "Expired", "count": 20},
  {"validity_status": "Revoked", "count": 5},
  {"validity_status": "Cancelled", "count": 5}
]
```

---

## Search & Export

### 1. Advanced Search
**POST** `/api/clearances/search/advanced`

Performs advanced search with multiple filter criteria.

**Request Body:**
```json
{
  "applicant_name": "Juan",
  "or_number": "OCP-2026",
  "format_type": "A",
  "civil_status": "Single",
  "has_criminal_record": false,
  "purpose": "Employment",
  "status": "Valid",
  "date_issued_from": "2026-01-01",
  "date_issued_to": "2026-01-31",
  "validity_expiry_from": "2026-07-01",
  "validity_expiry_to": "2026-12-31",
  "issued_by_user_id": 1,
  "page": 1,
  "limit": 10
}
```

**Response (Success - 200):**
```json
{
  "data": [
    {
      "id": 1,
      "or_number": "OCP-2026-8254601",
      "format_type": "A",
      "first_name": "Juan",
      "last_name": "Cruz",
      "date_issued": "2026-01-26",
      "status": "Valid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### 2. Export to Excel
**GET** `/api/clearances/export/excel`

Exports clearances to Excel format.

**Query Parameters:**
```
date_from=2026-01-01
date_to=2026-01-31
format_type=A
has_criminal_record=false
```

**Response:**
- Returns XLSX file as attachment
- File name: `clearances_export_YYYY-MM-DD.xlsx`

---

### 3. Export to CSV
**GET** `/api/clearances/export/csv`

Exports clearances to CSV format.

**Query Parameters:** Same as Excel export

**Response:**
- Returns CSV file as attachment
- File name: `clearances_export_YYYY-MM-DD.csv`

---

### 4. Get Available Issuers (for filtering)
**GET** `/api/clearances/issuers`

Gets list of users who have issued clearances.

**Response (Success - 200):**
```json
[
  {
    "issued_by_user_id": 1,
    "issued_by_name": "Prosecutor Name"
  },
  {
    "issued_by_user_id": 2,
    "issued_by_name": "Another Prosecutor"
  }
]
```

---

### 5. Get Clearance Purposes
**GET** `/api/clearances/purposes`

Gets list of available clearance purposes with fees.

**Response (Success - 200):**
```json
[
  {
    "id": 1,
    "purpose_name": "Local Employment",
    "fee": 50.00,
    "is_active": true,
    "sort_order": 1
  },
  {
    "id": 2,
    "purpose_name": "Foreign Employment",
    "fee": 100.00,
    "is_active": true,
    "sort_order": 2
  }
]
```

---

## Status Management

### 1. Verify Clearance
**GET** `/api/clearances/:id/verify`

Verifies the validity status of a clearance.

**Response (Success - 200):**
```json
{
  "id": 1,
  "or_number": "OCP-2026-8254601",
  "full_name": "Juan de la Cruz",
  "date_issued": "2026-01-26",
  "validity_expiry": "2026-07-26",
  "status": "Valid",
  "verification_status": "VALID"
}
```

**Possible verification_status values:**
- `VALID`: Active and not expired
- `EXPIRED`: Past validity date
- `REVOKED`: Revoked by authority
- `CANCELLED`: Cancelled
- `INVALID`: Unknown status

---

## Error Responses

### Common Error Codes

**400 - Bad Request:**
```json
{
  "error": "Missing required fields: revoke_reason, revoked_by_user_id, revoked_by_name"
}
```

**404 - Not Found:**
```json
{
  "error": "Clearance not found"
}
```

**500 - Server Error:**
```json
{
  "error": "Failed to create clearance: Database connection error"
}
```

---

## Certificate Format Types

- **Format A**: Individual - No Criminal Record
- **Format B**: Individual - Has Criminal Record
- **Format C**: Family/Requester - No Criminal Record
- **Format D**: Family/Requester - Has Criminal Record
- **Format E**: Individual - No Derogatory Record (NEW)
- **Format F**: Individual - Balsaff Application (NEW)

---

## Valid Status Values

- `Valid`: Certificate is currently active
- `Expired`: Past validity date
- `Revoked`: Revoked by authority
- `Cancelled`: Cancelled by administrator

---

## Valid Validity Periods

- `6 Months`: Certificate valid for 6 months from issue date
- `1 Year`: Certificate valid for 1 year from issue date

---

## Implementation Notes

1. **Automatic OR Number Generation**: Each clearance automatically gets a unique OR number format: `OCP-{YEAR}-{SEQUENCE}`

2. **Soft Deletes**: Deleted clearances are marked with `deleted_at` timestamp and excluded from all queries

3. **Audit Logging**: All changes are logged to `clearance_audit_log` with:
   - Action type (CREATE, UPDATE, DELETE, DOWNLOAD, PRINT, REVOKE)
   - User information
   - Old and new values for updates
   - Timestamp

4. **Date Formatting**: Dates in responses use ISO 8601 format (YYYY-MM-DD)

5. **PDF Generation**: The `/generate-pdf` endpoint returns HTML content that can be:
   - Printed to PDF from browser
   - Used in email templates
   - Displayed in web viewer

6. **Pagination**: Default page size is 10 records, maximum recommended is 100

7. **Search**: Uses partial matching on names and text fields

---

## Best Practices

1. Always include `user_id` and `user_name` when logging actions
2. Use appropriate status values and update them timely
3. Export data regularly for backups
4. Monitor audit logs for suspicious activities
5. Set validity periods based on use case requirements
6. Validate data before submission to API
