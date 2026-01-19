# Excel Import/Export Feature - How to Use

## The Problem
Your Excel file had macros that were blocked or missing. The old approach wasn't working.

## The New Solution
Your application now has built-in Excel import/export functionality without needing macros!

## How to Access

1. **Login to your application** at http://localhost:3000
2. **Go to Admin Dashboard** (you must be logged in as Admin)
3. **Click on "Excel Sync"** button in the Quick Actions section

## How to Use

### PULLING Data (Download from Database to Excel)

1. Go to Excel Sync page
2. Click **"Download Cases Excel"** button
3. The file `cases.xlsx` will be downloaded to your computer
4. Open it with Excel - no macros needed!

### PUSHING Data (Upload from Excel to Database)

1. Open your downloaded Excel file
2. Make your changes:
   - Edit existing cases (keep the ID column)
   - Add new cases (leave ID empty for new ones)
3. Save the file
4. Go to Excel Sync page
5. Click **"Choose Excel File to Upload"**
6. Select your edited file
7. Wait for upload to complete
8. You'll see a message showing how many cases were added/updated

## Excel File Columns

Your Excel file will have these columns:
- ID (auto-generated, don't change for existing cases)
- Docket No
- Date Filed
- Complainant
- Respondent
- Offense
- Date Resolved
- Resolving Prosecutor
- Criminal Case No
- Branch
- Date Filed in Court
- Remarks
- Remarks Decision
- Penalty
- Index Cards (file paths)

## Important Notes

✅ **DO:**
- Keep the ID column for existing cases (it matches them)
- Leave ID empty when adding NEW cases
- Use the exact column names
- Save as .xlsx or .xls format

❌ **DON'T:**
- Delete the ID column
- Change IDs manually
- Use macros (not needed anymore!)

## Automatic Sync

The database automatically updates the Excel file whenever you:
- Add a new case through the website
- Edit a case
- Delete a case

This means you can always download the latest data!

## Quick Download Button

There's also a quick "Download Excel" button on the Admin Dashboard for fast downloads without going to the Excel Sync page.

## Troubleshooting

**File not downloading?**
- Check your browser's download settings
- Make sure the server is running (node server.js)

**Upload not working?**
- Make sure file is .xlsx or .xls format
- Check file size (must be under 10MB)
- Verify all required columns exist

**Changes not showing?**
- Refresh the page after upload
- Download a fresh Excel file to verify changes

## Technical Details

- **Upload Endpoint:** POST http://localhost:5000/api/excel/upload
- **Download Endpoint:** GET http://localhost:5000/api/excel/download
- **Max File Size:** 10MB
- **Supported Formats:** .xlsx, .xls
- **Update Logic:** Matches by ID or Docket Number

---

**No more macro errors! Your data syncs seamlessly between Excel and the database.**
