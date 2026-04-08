require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const XLSX = require("xlsx");
const schedule = require("node-schedule");
const http = require("http");
const { Server } = require("socket.io");
const { validateRequest } = require("./middleware/validateRequest");
const { UserLoginSchema, UserRegisterSchema, UserUpdateSchema } = require("./schemas/users");
const { CaseCreateSchema, CaseUpdateSchema, CaseEditSchema, CaseSearchSchema } = require("./schemas/cases");
const { ApiResponse } = require("./utils/apiResponse");

// Security middleware imports
const { sanitizeInput } = require("./middleware/sanitize");
const { requirePermission, requireRole, adminOnly, staffOrAdmin } = require("./middleware/rbac");
const { authMiddleware, authorize } = require("./middleware/authMiddleware");
const { apiLimiter, loginLimiter, sensitiveOpLimiter } = require("./middleware/rateLimiter");
const { ipWhitelist, getWhitelistInfo, getRealIP } = require("./middleware/ipWhitelist");
const { securityHeaders, customSecurityHeaders } = require("./middleware/securityHeaders");
const securityLogger = require("./utils/securityLogger");

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow same origins as Express CORS
      if (!origin) return callback(null, true);
      const allowedPattern = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:(80|3000|3001|3002))?$/;
      if (allowedPattern.test(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('📡 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('📡 Client disconnected:', socket.id);
  });
});

// Helper: emit real-time event to all clients
const emitRealtimeEvent = (event, data) => {
  io.emit(event, { ...data, timestamp: new Date().toISOString() });
  console.log(`📡 Emitted: ${event}`);
};

// Trust proxy - needed so Express reads X-Forwarded-For from Nginx
// Set to 1 (one hop) since Nginx is the only proxy in front of Express
app.set('trust proxy', 1);
app.disable('x-powered-by');

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key_12345678901234567890123456789012";

// Store active schedules
let activeSchedules = {};

// Excel file path - stored in uploads folder
const EXCEL_FILE_PATH = path.join(__dirname, 'uploads', 'cases.xlsx');

// Function to export all cases to Excel file
const exportCasesToExcel = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT 
      DOCKET_NO,
      DATE_FILED,
      COMPLAINANT,
      RESPONDENT,
      ADDRESS_OF_RESPONDENT,
      OFFENSE,
      DATE_OF_COMMISSION,
      DATE_RESOLVED,
      RESOLVING_PROSECUTOR,
      CRIM_CASE_NO,
      BRANCH,
      DATEFILED_IN_COURT,
      FINAL_OFFENSE,
      REMARKS_DECISION,
      PENALTY,
      DECISION_DATE,
      INDEX_CARDS
    FROM cases ORDER BY id ASC`;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching cases for Excel export:", err);
        return reject(err);
      }

      // Helper function to parse JSON or return array with fallback
      const parseArrayField = (value) => {
        if (!value || value === 'N/A') return [];
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch {}
        return value ? [value] : [];
      };

      // Helper function to normalize fields
      const normalizeText = (value) => (value || '').toString().trim();

      // Helper function to ensure exported dates are user-friendly (Month Day, Year)
      const formatExcelDate = (value) => {
        if (!value) return '';
        const rawValue = String(value).trim();

        const datePrefixMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (datePrefixMatch) {
          const year = Number(datePrefixMatch[1]);
          const month = Number(datePrefixMatch[2]) - 1;
          const day = Number(datePrefixMatch[3]);
          const normalizedDate = new Date(year, month, day);
          if (!Number.isNaN(normalizedDate.getTime())) {
            return normalizedDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });
          }
        }

        const parsed = new Date(rawValue);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
        }

        return rawValue.replace(/T00:00:00\.000Z$/, '');
      };

      // Flatten cases: each respondent becomes a row
      const flattenedRows = [];
      results.forEach((caseRow) => {
        const respondents = parseArrayField(caseRow.RESPONDENT);
        const addresses = parseArrayField(caseRow.ADDRESS_OF_RESPONDENT);
        const decisions = parseArrayField(caseRow.REMARKS_DECISION);
        const crimCaseNos = parseArrayField(caseRow.CRIM_CASE_NO);
        const branches = parseArrayField(caseRow.BRANCH);
        const courtDates = parseArrayField(caseRow.DATEFILED_IN_COURT);
        const finalOffenses = parseArrayField(caseRow.FINAL_OFFENSE);

        const respondentCount = Math.max(
          respondents.length,
          addresses.length,
          decisions.length,
          crimCaseNos.length,
          branches.length,
          courtDates.length,
          finalOffenses.length,
          1
        );

        for (let idx = 0; idx < respondentCount; idx++) {
          const formattedRow = {
            'Docket No': normalizeText(caseRow.DOCKET_NO),
            'Date Filed': formatExcelDate(caseRow.DATE_FILED),
            'Complainant': normalizeText(caseRow.COMPLAINANT),
            'Respondent': normalizeText(respondents[idx] || respondents[0] || (respondents.length === 0 && idx === 0 ? '' : '')),
            'Address of Respondent': normalizeText(addresses[idx] || addresses[0] || ''),
            'Offense': normalizeText(caseRow.OFFENSE),
            'Date of Commission': formatExcelDate(caseRow.DATE_OF_COMMISSION),
            'Date Resolved': formatExcelDate(caseRow.DATE_RESOLVED),
            'Resolving Prosecutor': normalizeText(caseRow.RESOLVING_PROSECUTOR),
            'Criminal Case No': normalizeText(crimCaseNos[idx] || crimCaseNos[0] || ''),
            'Branch': normalizeText(branches[idx] || branches[0] || ''),
            'Date Filed in Court': formatExcelDate(courtDates[idx] || courtDates[0]),
            'Final Offense': normalizeText(finalOffenses[idx] || finalOffenses[0] || ''),
            'Remarks Decision': normalizeText(decisions[idx] || decisions[0] || ''),
            'Penalty': normalizeText(caseRow.PENALTY),
            'Decision Date': formatExcelDate(caseRow.DECISION_DATE),
            'Index Cards': normalizeText(caseRow.INDEX_CARDS)
          };
          flattenedRows.push(formattedRow);
        }
      });
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(flattenedRows);
      
      // Set column widths for better readability
      worksheet['!cols'] = [
        { wch: 15 },  // Docket No
        { wch: 12 },  // Date Filed
        { wch: 20 },  // Complainant
        { wch: 20 },  // Respondent
        { wch: 30 },  // Address of Respondent
        { wch: 20 },  // Offense
        { wch: 15 },  // Date of Commission
        { wch: 12 },  // Date Resolved
        { wch: 20 },  // Resolving Prosecutor
        { wch: 15 },  // Criminal Case No
        { wch: 12 },  // Branch
        { wch: 15 },  // Date Filed in Court
        { wch: 20 },  // Final Offense
        { wch: 15 },  // Remarks Decision
        { wch: 12 },  // Penalty
        { wch: 12 },  // Decision Date
        { wch: 50 },  // Index Cards
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Cases");
      
      // Ensure uploads directory exists
      const uploadsDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Write file
      XLSX.writeFile(workbook, EXCEL_FILE_PATH);
      console.log("✅ Excel file updated with flattened respondent rows:", EXCEL_FILE_PATH);
      resolve(EXCEL_FILE_PATH);
    });
  });
};
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Nginx proxy, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost and any local network IP on ports 80, 3000-3002
    const allowedPattern = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:(80|3000|3001|3002))?$/;
    if (allowedPattern.test(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(securityHeaders());
app.use(customSecurityHeaders);

// IP Whitelisting - Disabled in Docker (use Windows Firewall instead)
// Docker Desktop on Windows hides real client IPs behind NAT (all appear as 172.18.0.1)
// IP filtering is handled by Windows Firewall rules at the OS level
app.use(ipWhitelist({
  enabled: String(process.env.ENABLE_IP_WHITELIST || 'false').toLowerCase() === 'true',
  skipPaths: ['/api/health', '/health'],
  allowLocalhost: true,            // Always allow localhost
  customIPs: (process.env.ADDITIONAL_ALLOWED_IPS || '')
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean)
}));

// Security middleware - apply before parsing
app.use(sanitizeInput({ strict: true }));
app.use(apiLimiter);
app.use(['/delete-case', '/delete-all-cases', '/permanent-delete-case', '/restore-case', '/configure-auto-delete'], sensitiveOpLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Download endpoint for index card images
app.get('/download/index-card/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'index_cards', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Set headers for download
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  
  // Send file
  res.sendFile(filePath);
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'profiles');
const indexCardsDir = path.join(__dirname, 'uploads', 'index_cards');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(indexCardsDir)) {
  fs.mkdirSync(indexCardsDir, { recursive: true });
}

// Configure multer for profile uploads
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for index card uploads
const indexCardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, indexCardsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'indexcard-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

const indexCardUpload = multer({
  storage: indexCardStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, JPG, PNG) are allowed!'));
  }
});

// Connection with automatic reconnection
let db;
let dbInitializationDone = false;
let initialExcelSyncDone = false;

function handleDisconnect() {
  db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ocp_docketing",
  });

  if (!process.env.DB_PASSWORD && process.env.NODE_ENV === 'production') {
    console.error('⚠️  WARNING: DB_PASSWORD is not set. This is a security risk in production!');
    console.error('Please set DB_PASSWORD environment variable in your .env file');
  }

  db.connect((err) => {
    if (err) {
      console.error("❌ Database connection failed: " + err.message);
      console.error("⚠️  Please make sure MySQL/XAMPP is running, the database exists, and DB_PORT is correct (usually 3306 or 3307).");
      console.error("🔄 Will retry connection in 5 seconds...");
      setTimeout(handleDisconnect, 5000);
      return;
    }
    console.log(`✅ Connected to MySQL database on ${process.env.DB_HOST || "localhost"}:${Number(process.env.DB_PORT || 3306)}.`);

    if (!dbInitializationDone) {
      dbInitializationDone = true;
      runInitialDbSetup();
    }

    if (!initialExcelSyncDone) {
      initialExcelSyncDone = true;
      exportCasesToExcel()
        .then(() => {
          console.log("✅ Initial Excel file generated after DB connection.");
        })
        .catch((excelErr) => {
          initialExcelSyncDone = false;
          console.error("Error generating initial Excel file:", excelErr?.message || excelErr);
        });
    }
  });

  db.on('error', (err) => {
    console.error('❌ Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
      console.log('🔄 Reconnecting to database...');
      handleDisconnect();
    } else {
      throw err;
    }
  });

  // Add new columns to cases table if they don't exist
  const addNewColumns = () => {
    // Add ADDRESS_OF_RESPONDENT column
    db.query("SHOW COLUMNS FROM cases LIKE 'ADDRESS_OF_RESPONDENT'", (err, results) => {
      if (!err && results.length === 0) {
        db.query("ALTER TABLE cases ADD COLUMN ADDRESS_OF_RESPONDENT VARCHAR(500) DEFAULT '' AFTER RESPONDENT", (alterErr) => {
          if (alterErr) console.error("Error adding ADDRESS_OF_RESPONDENT column:", alterErr);
          else console.log("✅ Added ADDRESS_OF_RESPONDENT column to cases table.");
        });
      }
    });

    // Add DATE_OF_COMMISSION column
    db.query("SHOW COLUMNS FROM cases LIKE 'DATE_OF_COMMISSION'", (err, results) => {
      if (!err && results.length === 0) {
        db.query("ALTER TABLE cases ADD COLUMN DATE_OF_COMMISSION DATE DEFAULT NULL AFTER OFFENSE", (alterErr) => {
          if (alterErr) console.error("Error adding DATE_OF_COMMISSION column:", alterErr);
          else console.log("✅ Added DATE_OF_COMMISSION column to cases table.");
        });
      }
    });

    // Migrate DATEFILED_IN_COURT from DATE to VARCHAR(500) to support JSON arrays (per-respondent dates)
    db.query("SHOW COLUMNS FROM cases LIKE 'DATEFILED_IN_COURT'", (err, results) => {
      if (!err && results.length > 0 && results[0].Type.toLowerCase() === 'date') {
        db.query("ALTER TABLE cases MODIFY COLUMN DATEFILED_IN_COURT VARCHAR(500) DEFAULT NULL", (alterErr) => {
          if (alterErr) console.error("Error migrating DATEFILED_IN_COURT column:", alterErr);
          else console.log("✅ Migrated DATEFILED_IN_COURT column from DATE to VARCHAR(500).");
        });
      }
    });

    // Migrate MR_FILED_BY from VARCHAR(200) to VARCHAR(1000) to support JSON arrays
    db.query("SHOW COLUMNS FROM cases LIKE 'MR_FILED_BY'", (err, results) => {
      if (!err && results.length > 0 && results[0].Type.toLowerCase().includes('varchar(200)')) {
        db.query("ALTER TABLE cases MODIFY COLUMN MR_FILED_BY VARCHAR(1000) DEFAULT NULL", (alterErr) => {
          if (alterErr) console.error("Error migrating MR_FILED_BY column:", alterErr);
          else console.log("✅ Migrated MR_FILED_BY column to VARCHAR(1000).");
        });
      }
    });

    // Migrate DATE_MR_FILING from DATE to VARCHAR(500) to support JSON arrays
    db.query("SHOW COLUMNS FROM cases LIKE 'DATE_MR_FILING'", (err, results) => {
      if (!err && results.length > 0 && results[0].Type.toLowerCase() === 'date') {
        db.query("ALTER TABLE cases MODIFY COLUMN DATE_MR_FILING VARCHAR(500) DEFAULT NULL", (alterErr) => {
          if (alterErr) console.error("Error migrating DATE_MR_FILING column:", alterErr);
          else console.log("✅ Migrated DATE_MR_FILING column from DATE to VARCHAR(500).");
        });
      }
    });

    // Migrate DATE_MR_RESOLVED from DATE to VARCHAR(500) to support JSON arrays
    db.query("SHOW COLUMNS FROM cases LIKE 'DATE_MR_RESOLVED'", (err, results) => {
      if (!err && results.length > 0 && results[0].Type.toLowerCase() === 'date') {
        db.query("ALTER TABLE cases MODIFY COLUMN DATE_MR_RESOLVED VARCHAR(500) DEFAULT NULL", (alterErr) => {
          if (alterErr) console.error("Error migrating DATE_MR_RESOLVED column:", alterErr);
          else console.log("✅ Migrated DATE_MR_RESOLVED column from DATE to VARCHAR(500).");
        });
      }
    });

    // Migrate MR_FINDING from VARCHAR(500) to VARCHAR(1000) to support JSON arrays
    db.query("SHOW COLUMNS FROM cases LIKE 'MR_FINDING'", (err, results) => {
      if (!err && results.length > 0 && results[0].Type.toLowerCase().includes('varchar(500)')) {
        db.query("ALTER TABLE cases MODIFY COLUMN MR_FINDING VARCHAR(1000) DEFAULT NULL", (alterErr) => {
          if (alterErr) console.error("Error migrating MR_FINDING column:", alterErr);
          else console.log("✅ Migrated MR_FINDING column to VARCHAR(1000).");
        });
      }
    });
  };

  const runInitialDbSetup = () => {
    // Run column migration
    addNewColumns();

    // Create users table if it doesn't exist
    const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('Admin', 'Clerk', 'Staff') DEFAULT 'Clerk',
      profile_picture VARCHAR(500) DEFAULT NULL,
      is_active TINYINT DEFAULT 1,
      last_login TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    `;

    db.query(createUsersTable, async (err) => {
      if (err) {
        console.error("Error creating users table:", err);
      } else {
        console.log("Users table ready.");
      
        // Add last_login column if it doesn't exist (for existing tables)
        db.query("SHOW COLUMNS FROM users LIKE 'last_login'", (err, results) => {
          if (!err && results.length === 0) {
            db.query("ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL AFTER profile_picture", (alterErr) => {
              if (alterErr) console.error("Error adding last_login column:", alterErr);
              else console.log("Added last_login column to users table.");
            });
          }
        });
      
        // Add is_active column if it doesn't exist (for existing tables)
        db.query("SHOW COLUMNS FROM users LIKE 'is_active'", (err, results) => {
          if (!err && results.length === 0) {
            db.query("ALTER TABLE users ADD COLUMN is_active TINYINT DEFAULT 1 AFTER profile_picture", (alterErr) => {
              if (alterErr) console.error("Error adding is_active column:", alterErr);
              else console.log("✅ Added is_active column to users table.");
            });
          }
        });
      
        // Add is_online column if it doesn't exist (for real-time online status)
        db.query("SHOW COLUMNS FROM users LIKE 'is_online'", (err, results) => {
          if (!err && results.length === 0) {
            db.query("ALTER TABLE users ADD COLUMN is_online TINYINT DEFAULT 0 AFTER is_active", (alterErr) => {
              if (alterErr) console.error("Error adding is_online column:", alterErr);
              else console.log("✅ Added is_online column to users table.");
            });
          }
        });
      
        // Update role enum to include Staff if it doesn't
        db.query("SHOW COLUMNS FROM users LIKE 'role'", (err, results) => {
          if (!err && results.length > 0 && !results[0].Type.includes("'Staff'")) {
            db.query("ALTER TABLE users MODIFY role ENUM('Admin', 'Clerk', 'Staff') DEFAULT 'Clerk'", (alterErr) => {
              if (alterErr) console.error("Error updating role enum:", alterErr);
              else console.log("✅ Updated role enum to include Staff.");
            });
          }
        });
      
        // Create default admin account if not exists
        const adminEmail = "james@gmail.com";
        const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || bcrypt.hashSync("ChangeMe@123456", 10);
        const adminName = "James Admin";

        db.query("SELECT * FROM users WHERE email = ?", [adminEmail], async (err, results) => {
          if (err) {
            console.error("Error checking for admin:", err);
            return;
          }

          if (results.length === 0) {
            // Create admin account
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            db.query(
              "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'Admin')",
              [adminName, adminEmail, hashedPassword],
              (insertErr) => {
                if (insertErr) {
                  console.error("Error creating admin account:", insertErr);
                } else {
                  console.log("Default admin account created (james@gmail.com)");
                }
              }
            );
          } else {
            console.log("Admin account already exists.");
          }
        });
      
        // Auto-delete accounts inactive for more than 1 year (except Admin)
        const deleteInactiveAccounts = () => {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

          // First check if last_login column exists
          db.query("SHOW COLUMNS FROM users LIKE 'last_login'", (checkErr, cols) => {
            if (checkErr || cols.length === 0) {
              console.log("Skipping cleanup - last_login column not ready yet.");
              return;
            }

            db.query(
              `DELETE FROM users 
               WHERE role != 'Admin' 
               AND (
                 (last_login IS NOT NULL AND last_login < ?) 
                 OR (last_login IS NULL AND created_at < ?)
               )`,
              [oneYearAgo, oneYearAgo],
              (err, result) => {
                if (err) {
                  console.error("Error cleaning up inactive accounts:", err);
                } else if (result.affectedRows > 0) {
                  console.log(`Deleted ${result.affectedRows} inactive account(s).`);
                }
              }
            );
          });
        };

        // Run cleanup after a delay to allow column to be added
        setTimeout(deleteInactiveAccounts, 3000);

        // Run cleanup every 24 hours
        setInterval(deleteInactiveAccounts, 24 * 60 * 60 * 1000);
      }
    });
  };
}

const isDbConnectionReady = () => {
  return !!db && (db.state === "connected" || db.state === "authenticated");
};

// Lightweight health endpoint for local diagnostics and reverse-proxy checks
app.get('/api/health', (req, res) => {
  const connected = isDbConnectionReady();
  const payload = {
    success: connected,
    status: connected ? 'ok' : 'degraded',
    dbState: db?.state || 'disconnected',
    serverPort: PORT,
    timestamp: new Date().toISOString()
  };

  if (!connected) {
    return res.status(503).json({
      ...payload,
      message: 'Database is not connected. Start XAMPP MySQL and verify DB_PORT in .env.'
    });
  }

  res.json(payload);
});

// Initialize database connection
handleDisconnect();

// ==================== USER AUTHENTICATION ROUTES ====================

// Register new user
app.post("/api/auth/register", loginLimiter, validateRequest(UserRegisterSchema), async (req, res) => {
  const { name, email, password, role } = req.body;
  
  try {
    // Check if user already exists
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json(ApiResponse.error("Database error", 500));
      }
      
      if (results.length > 0) {
        return res.status(400).json(ApiResponse.error("Email already registered", 400));
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert new user
      const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
      db.query(sql, [name, email, hashedPassword, role || 'Clerk'], (err, result) => {
        if (err) {
          console.error("Error registering user:", err);
          return res.status(500).json(ApiResponse.error("Failed to register user", 500));
        }
        
        // Return user data (without password)
        const userData = {
          id: result.insertId,
          name,
          email,
          role: role || 'Clerk',
          profile_picture: null,
          created_at: new Date().toISOString()
        };
        
        res.status(201).json(ApiResponse.success("Registration successful", userData, 201));
      });
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json(ApiResponse.error("Server error", 500));
  }
});

// Get all users (Admin only)
app.get("/api/users", authMiddleware, adminOnly, (req, res) => {
  // Query that safely handles the is_online field
  const query = `
    SELECT 
      id, 
      name, 
      email, 
      role, 
      profile_picture, 
      last_login, 
      created_at, 
      is_active, 
      COALESCE(is_online, 0) as is_online 
    FROM users 
    ORDER BY created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      // If is_online column doesn't exist, fall back to a simpler query
      if (err.message.includes('is_online')) {
        console.log('is_online column not found, using fallback query');
        db.query("SELECT id, name, email, role, profile_picture, last_login, created_at, is_active FROM users ORDER BY created_at DESC", (err, results) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
          }
          // Add is_online field with default value for UI consistency
          const resultsWithOnlineStatus = results.map(user => ({
            ...user,
            is_online: 0
          }));
          res.json({ success: true, users: resultsWithOnlineStatus });
        });
      } else {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
    } else {
      res.json({ success: true, users: results });
    }
  });
});

// Delete user (Admin only)
app.delete("/api/user/:id", authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  
  // Check if user exists and get their role and email
  db.query("SELECT role, email FROM users WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // If trying to delete an admin, check if it's the last one
    if (results[0].role === 'Admin') {
      db.query("SELECT COUNT(*) as adminCount FROM users WHERE role = 'Admin'", (countErr, countResults) => {
        if (countErr) {
          console.error("Database error:", countErr);
          return res.status(500).json({ success: false, message: "Database error" });
        }
        
        if (countResults[0].adminCount <= 1) {
          return res.status(403).json({ success: false, message: "Cannot delete the last admin account" });
        }
        
        // Safe to delete this admin
        // Log the deletion action before deleting
        securityLogger.accountDeleted(req.user.id, id, results[0].email);
        
        db.query("DELETE FROM users WHERE id = ?", [id], (deleteErr) => {
          if (deleteErr) {
            console.error("Error deleting user:", deleteErr);
            return res.status(500).json({ success: false, message: "Failed to delete user" });
          }
          res.json({ success: true, message: "User deleted successfully" });
        });
      });
    } else {
      // Non-admin user, safe to delete
      // Log the deletion action before deleting
      securityLogger.accountDeleted(req.user.id, id, results[0].email);
      
      db.query("DELETE FROM users WHERE id = ?", [id], (deleteErr) => {
        if (deleteErr) {
          console.error("Error deleting user:", deleteErr);
          return res.status(500).json({ success: false, message: "Failed to delete user" });
        }
        res.json({ success: true, message: "User deleted successfully" });
      });
    }
  });
});

// Toggle user active status (Admin only)
// Toggle user status (Admin only)
app.put("/api/user/:id/toggle-status", authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  
  // Get user details (status and role)
  db.query("SELECT id, role, is_active FROM users WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error. The is_active column may not exist." });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const user = results[0];
    const currentStatus = user.is_active;
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    // Check if trying to deactivate an admin
    if (user.role === 'Admin' && newStatus === 0) {
      // Count active admins
      db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Admin' AND is_active = 1", (countErr, countResults) => {
        if (countErr) {
          console.error("Database error:", countErr);
          return res.status(500).json({ success: false, message: "Database error" });
        }
        
        const activeAdminCount = countResults[0].count;
        
        // Prevent deactivation if this is the last admin
        if (activeAdminCount <= 1) {
          console.log(`⛔ Cannot deactivate user ${id}: This is the last active admin`);
          return res.status(403).json({ 
            success: false, 
            message: "Cannot deactivate the last active admin account. At least one active admin must remain." 
          });
        }
        
        // Proceed with deactivation
        performToggle();
      });
    } else {
      // For non-admins or reactivation, proceed directly
      performToggle();
    }
    
    function performToggle() {
      console.log(`Toggling user ${id}: current status = ${currentStatus}, new status = ${newStatus}`);
      
      db.query("UPDATE users SET is_active = ? WHERE id = ?", [newStatus, id], (updateErr) => {
        if (updateErr) {
          console.error("Error toggling user status:", updateErr);
          return res.status(500).json({ success: false, message: "Failed to toggle user status" });
        }
        console.log(`✅ User ${id} is_active updated to ${newStatus}`);
        res.json({ success: true, message: "User status updated", isActive: newStatus === 1 });
      });
    }
  });
});

// Update user role (Admin only)
app.put("/api/user/:id/role", authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ success: false, message: "Role is required" });
  }

  const validRoles = ['Clerk', 'Staff', 'Admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }
  
  // Log the role change
  securityLogger.log('ACCOUNT_UPDATED', {
    adminId: req.user.id,
    adminEmail: req.user.email,
    userId: id,
    action: 'ROLE_CHANGED',
    newRole: role,
    timestamp: new Date().toISOString()
  });

  db.query("UPDATE users SET role = ? WHERE id = ?", [role, id], (err) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ success: false, message: "Failed to update user role" });
    }
    res.json({ success: true, message: "User role updated successfully" });
  });
});


// Login user
app.post("/api/auth/login", loginLimiter, validateRequest(UserLoginSchema), (req, res) => {
  const { email, password } = req.body;

  if (!isDbConnectionReady()) {
    return res.status(503).json(ApiResponse.error(
      "Database connection is not available. Please start XAMPP MySQL and verify DB_PORT in .env (3306 or 3307).",
      503
    ));
  }
  
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      if (["PROTOCOL_CONNECTION_LOST", "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR", "ECONNREFUSED"].includes(err.code)) {
        return res.status(503).json(ApiResponse.error(
          "Database connection is not available. Please start XAMPP MySQL and verify DB_PORT in .env (3306 or 3307).",
          503
        ));
      }
      return res.status(500).json(ApiResponse.error("Database error", 500));
    }
    
    if (results.length === 0) {
      return res.status(401).json(ApiResponse.error("Invalid email or password", 401));
    }
    
    const user = results[0];
    
    // Check if account is active
    if (user.is_active === 0) {
      console.log(`❌ Login blocked: User ${email} account is deactivated (is_active = ${user.is_active})`);
      return res.status(403).json(ApiResponse.error("Your account has been deactivated. Please contact the administrator.", 403));
    }

    // Enforce single active session per account.
    // If account is already online, block another login from a second device/browser.
    if (user.is_online === 1) {
      console.log(`⛔ Login blocked: User ${email} is already signed in on another session`);
      return res.status(409).json(ApiResponse.error("This account is already active on another device. Please log out from the first session before signing in again.", 409));
    }
    
    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      // Log failed login attempt
      securityLogger.loginFailed(user.id, user.email, req.ip);
      return res.status(401).json(ApiResponse.error("Invalid credentials", 401));
    }
    
    console.log(`✅ Login successful: ${email} (is_active = ${user.is_active}, is_online -> 1)`);
    
    // Log successful login
    securityLogger.loginSuccess(user.id, user.email, req.ip);
    
    // Update last_login timestamp and set is_online to 1
    db.query("UPDATE users SET last_login = NOW(), is_online = 1 WHERE id = ?", [user.id]);
    
    // Return user data (without password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile_picture: user.profile_picture,
      last_login: new Date().toISOString(),
      created_at: user.created_at
    };
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json(ApiResponse.success("Login successful", { ...userData, token }));
  });
});

// Refresh JWT token
app.post("/api/auth/refresh", (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json(ApiResponse.error("Token is required", 400));
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    
    // Generate new token
    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json(ApiResponse.success("Token refreshed", { token: newToken }));
  } catch (error) {
    return res.status(401).json(ApiResponse.error("Invalid token", 401));
  }
});

// Get user profile
app.get("/api/user/:id", (req, res) => {
  const { id } = req.params;
  
  db.query("SELECT id, name, email, role, profile_picture, created_at FROM users WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({ success: true, user: results[0] });
  });
});

// Logout endpoint - set user offline and update last_login to track when they were last active
app.post("/api/auth/logout", (req, res) => {
  const { userId } = req.body;
  
  console.log("🚪 Logout request received for userId:", userId);
  
  if (!userId) {
    console.log("❌ No userId provided in logout request");
    return res.status(400).json({ success: false, message: "User ID is required" });
  }
  
  // Update is_online to 0 and set last_login to NOW() to track when user was last active
  db.query("UPDATE users SET is_online = 0, last_login = NOW() WHERE id = ?", [userId], (err, result) => {
    if (err) {
      console.error("❌ Database error during logout:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    // Log logout event
    securityLogger.logout(userId);
    
    console.log(`✅ User ${userId} logged out successfully. Rows affected:`, result.affectedRows);
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// Check user account status (for real-time deactivation)
app.get("/api/user/:id/status", (req, res) => {
  const { id } = req.params;
  
  db.query("SELECT is_active FROM users WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const isActive = results[0].is_active === 1;
    res.json({ success: true, isActive });
  });
});

// Update user profile
// Update profile (Authenticated users)
app.put("/api/user/:id", authMiddleware, requirePermission('profile:update'), (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ success: false, message: "Name and email are required" });
  }
  
  // Check if email is taken by another user
  db.query("SELECT * FROM users WHERE email = ? AND id != ?", [email, id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (results.length > 0) {
      return res.status(400).json({ success: false, message: "Email already taken by another user" });
    }
    
    // Update user
    db.query("UPDATE users SET name = ?, email = ? WHERE id = ?", [name, email, id], (err, result) => {
      if (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ success: false, message: "Failed to update profile" });
      }
      
      // Get updated user data
      db.query("SELECT id, name, email, role, profile_picture, created_at FROM users WHERE id = ?", [id], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, message: "Profile updated successfully", user: results[0] });
      });
    });
  });
});

// Change password
// Change password (Authenticated users)
app.put("/api/user/:id/password", authMiddleware, requirePermission('profile:update'), async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Current and new password are required" });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
  }
  
  // Get current user
  db.query("SELECT * FROM users WHERE id = ?", [id], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const user = results[0];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id], (err) => {
      if (err) {
        console.error("Error updating password:", err);
        return res.status(500).json({ success: false, message: "Failed to update password" });
      }
      
      res.json({ success: true, message: "Password updated successfully" });
    });
  });
});

// Upload profile picture
app.post("/api/user/:id/upload-picture", upload.single('profilePicture'), (req, res) => {
  const { id } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  
  const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
  
  // Get old profile picture to delete
  db.query("SELECT profile_picture FROM users WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    // Delete old profile picture file if exists
    if (results.length > 0 && results[0].profile_picture) {
      const oldPath = path.join(__dirname, results[0].profile_picture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    // Update database with new picture path
    db.query("UPDATE users SET profile_picture = ? WHERE id = ?", [profilePictureUrl, id], (err) => {
      if (err) {
        console.error("Error updating profile picture:", err);
        return res.status(500).json({ success: false, message: "Failed to update profile picture" });
      }
      
      // Get updated user data
      db.query("SELECT id, name, email, role, profile_picture, created_at FROM users WHERE id = ?", [id], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, message: "Profile picture updated successfully", user: results[0] });
      });
    });
  });
});

// Remove profile picture
app.delete("/api/user/:id/picture", (req, res) => {
  const { id } = req.params;
  
  // Get current profile picture
  db.query("SELECT profile_picture FROM users WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    // Delete file if exists
    if (results.length > 0 && results[0].profile_picture) {
      const filePath = path.join(__dirname, results[0].profile_picture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Update database
    db.query("UPDATE users SET profile_picture = NULL WHERE id = ?", [id], (err) => {
      if (err) {
        console.error("Error removing profile picture:", err);
        return res.status(500).json({ success: false, message: "Failed to remove profile picture" });
      }
      
      // Get updated user data
      db.query("SELECT id, name, email, role, profile_picture, created_at FROM users WHERE id = ?", [id], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, message: "Profile picture removed successfully", user: results[0] });
      });
    });
  });
});

// Get all cases para sad makuha nag lin sa gdrive
app.get("/cases", (req, res) => {
  if (!db || db.state === 'disconnected') {
    return res.status(503).json({
      success: false,
      message: "Database connection is not available. Please ensure MySQL/XAMPP is running.",
      error: "SERVICE_UNAVAILABLE"
    });
  }
  
  db.query("SELECT * FROM cases", (err, results) => {
    if (err) {
      console.error("Error fetching cases:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch cases from database",
        error: err.message
      });
    }

    const normalizeDateOnly = (value) => {
      if (value === null || value === undefined || value === '') return value;
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      return String(value).split('T')[0];
    };

    const normalizedResults = results.map((row) => ({
      ...row,
      DATE_FILED: normalizeDateOnly(row.DATE_FILED),
      DATE_OF_COMMISSION: normalizeDateOnly(row.DATE_OF_COMMISSION),
      DATE_RESOLVED: normalizeDateOnly(row.DATE_RESOLVED),
      DATEFILED_IN_COURT: normalizeDateOnly(row.DATEFILED_IN_COURT),
      DECISION_DATE: normalizeDateOnly(row.DECISION_DATE),
    }));

    // Keep paths and other fields unchanged; normalize date-only fields for consistent exports.
    console.log(`📊 /cases endpoint: Returning ${normalizedResults.length} active cases`);
    res.json(normalizedResults);
  });
});

// Diagnostic endpoint - Show all cases including deleted
app.get("/admin/all-cases-diagnostic", (req, res) => {
  if (!db || db.state === 'disconnected') {
    return res.status(503).json({
      success: false,
      message: "Database connection is not available",
      error: "SERVICE_UNAVAILABLE"
    });
  }
  
  // Get active cases count
  db.query("SELECT COUNT(*) as active_count FROM cases", (err, activeResults) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Get terminated cases count
    db.query("SELECT COUNT(*) as terminated_count FROM terminated_cases", (err, terminatedResults) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Get all cases 
      db.query("SELECT id, DOCKET_NO FROM cases ORDER BY id", (err, allCases) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        console.log(`🔍 Diagnostic Report: Active=${activeResults[0].active_count}, Terminated=${terminatedResults[0].terminated_count}, Total Active Cases=${allCases.length}`);
        
        res.json({
          summary: {
            active_count: activeResults[0].active_count,
            terminated_count: terminatedResults[0].terminated_count,
            total_active_count: allCases.length
          },
          cases: allCases
        });
      });
    });
  });
});

// Add a new case (Staff or Admin)
app.post("/add-case", indexCardUpload.single('indexCardImage'), async (req, res) => {
  console.log("Received Data:", req.body); // debug
  console.log("Received File:", req.file); // debug
  
  try {
    // Validate the request body with Zod
    const validatedData = await CaseCreateSchema.parseAsync(req.body);
    
    // Check if DOCKET_NO already exists (BEFORE inserting)
    db.query("SELECT id FROM cases WHERE DOCKET_NO = ? AND is_deleted = 0", [validatedData.DOCKET_NO], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking duplicate case:", checkErr);
        return res.status(500).json(ApiResponse.error("Database error", 500));
      }
      
      if (checkResults && checkResults.length > 0) {
        // Duplicate found
        console.warn("Attempted to add duplicate case:", validatedData.DOCKET_NO);
        return res.status(409).json(ApiResponse.error("This case (Docket No: " + validatedData.DOCKET_NO + ") already exists in the system.", 409));
      }
      
      // No duplicate, proceed with insert
      const INDEX_CARDS = req.file ? `/uploads/index_cards/${req.file.filename}` : 'N/A';
      let normalizedDecision = 'Pending';
      if (validatedData.REMARKS_DECISION && validatedData.REMARKS_DECISION.trim()) {
        const rawDecision = validatedData.REMARKS_DECISION.trim();
        try {
          const parsedDecision = JSON.parse(rawDecision);
          if (Array.isArray(parsedDecision)) {
            normalizedDecision = JSON.stringify(
              parsedDecision.map((entry) => {
                const value = (entry || '').toString().trim();
                return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : 'Pending';
              })
            );
          } else {
            normalizedDecision = rawDecision.charAt(0).toUpperCase() + rawDecision.slice(1).toLowerCase();
          }
        } catch {
          normalizedDecision = rawDecision.charAt(0).toUpperCase() + rawDecision.slice(1).toLowerCase();
        }
      }

      const sql = `INSERT INTO cases (DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, ADDRESS_OF_RESPONDENT, OFFENSE, DATE_OF_COMMISSION, DATE_RESOLVED, RESOLVING_PROSECUTOR, CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, FINAL_OFFENSE, REMARKS_DECISION, PENALTY, DECISION_DATE, STATUS, INDEX_CARDS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      db.query(sql, [
      validatedData.DOCKET_NO, 
      validatedData.DATE_FILED, 
      validatedData.COMPLAINANT, 
      validatedData.RESPONDENT, 
      validatedData.ADDRESS_OF_RESPONDENT, 
      validatedData.OFFENSE, 
      validatedData.DATE_OF_COMMISSION, 
      validatedData.DATE_RESOLVED || null, 
      validatedData.RESOLVING_PROSECUTOR || null, 
      validatedData.CRIM_CASE_NO || 'N/A', 
      validatedData.BRANCH, 
      validatedData.DATEFILED_IN_COURT || null, 
      validatedData.FINAL_OFFENSE || null,
      normalizedDecision, 
      validatedData.PENALTY || null, 
      validatedData.DECISION_DATE || null,
      validatedData.STATUS || null,
      INDEX_CARDS
    ], (err, result) => {
      if (err) {
        console.error("Error inserting data:", err);
        return res.status(500).json(ApiResponse.error("Failed to add case", 500));
      }
      
      // Sync Excel file after adding new case
      exportCasesToExcel()
        .then(() => {
          console.log("Excel file synced after adding new case");
        })
        .catch(excelErr => {
          console.error("Error syncing Excel file:", excelErr);
        });
      
      // Emit real-time event
      emitRealtimeEvent('case_added', { id: result.insertId, docketNo: validatedData.DOCKET_NO });
      
      res.status(200).json(ApiResponse.success("Case added successfully", { 
        id: result.insertId,
        indexCardPath: INDEX_CARDS 
      }));
      });
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error.name === 'ZodError' || error.issues) {
      const zodErrors = error.errors || error.issues || [];
      const errors = Array.isArray(zodErrors)
        ? zodErrors.map(err => ({
            field: err.path ? err.path.join('.') : 'unknown',
            message: err.message || 'Validation error',
          }))
        : [{ field: 'unknown', message: 'Validation failed' }];
      return res.status(400).json(ApiResponse.error("Validation failed", 400, { errors }));
    }
    
    console.error("Error adding case:", error);
    return res.status(500).json(ApiResponse.error("Internal server error", 500));
  }
});

// search sa edit case
app.get("/get-case", (req, res) => {
const { docket_no, respondent, resolving_prosecutor, remarks, start_date, end_date } = req.query;

  let sql = "SELECT * FROM cases WHERE 1=1";
  let values = [];

  if (!docket_no && !respondent && !resolving_prosecutor && !remarks && !start_date && !end_date) {
    return res.status(400).json({ error: "At least one search criteria is required." });
  }

  if (docket_no) {
    sql += " AND LOWER(DOCKET_NO) LIKE ?";
    values.push(`%${docket_no.toLowerCase()}%`);
  }

  if (respondent) {
    sql += " AND LOWER(RESPONDENT) LIKE ?";
    values.push(`%${respondent.toLowerCase()}%`);
  }

  if (resolving_prosecutor) {
    sql += " AND LOWER(RESOLVING_PROSECUTOR) LIKE ?";
    values.push(`%${resolving_prosecutor.toLowerCase()}%`);
  }

  if (remarks) {
    sql += " AND LOWER(REMARKS) LIKE ?";
    values.push(`%${remarks.toLowerCase()}%`);
  }

  if (start_date && end_date) {
    sql += " AND DATE_FILED BETWEEN ? AND ?";
    values.push(start_date, end_date);
  } else if (start_date) {
    sql += " AND DATE_FILED >= ?";
    values.push(start_date);
  } else if (end_date) {
    sql += " AND DATE_FILED <= ?";
    values.push(end_date);
  }

  console.log("🟢 SQL:", sql);
  console.log("📦 Values:", values);

  db.query(sql, values, (err, results) => {
    if (err) {
      console.error("Error searching data:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }

    if (results.length > 0) {
      return res.json(results);
    } else {
      return res.status(404).json({ error: "No matching cases found" });
    }
  });
});

// edit case
// Update case (Staff or Admin)
app.post("/update-case", async (req, res) => {
  if (!db || db.state === 'disconnected') {
    return res.status(503).json({
      success: false,
      message: "Database connection is not available. Please ensure MySQL/XAMPP is running.",
      error: "SERVICE_UNAVAILABLE"
    });
  }
  
  console.log("📝 Update case request received:", JSON.stringify(req.body, null, 2));
  
  try {
    // Simple validation - just check for required id and updated_fields
    const { id, updated_fields } = req.body;

    if (!id || typeof id !== 'number') {
      return res.status(400).json(ApiResponse.error("Valid case ID is required", 400));
    }

    if (!updated_fields || Object.keys(updated_fields).length === 0) {
      return res.status(400).json(ApiResponse.error("No fields to update", 400));
    }

    console.log("✅ Validation passed. ID:", id, "Fields:", Object.keys(updated_fields || {}));

    if (Object.prototype.hasOwnProperty.call(updated_fields, 'REMARKS_DECISION')) {
      const rawDecision = updated_fields.REMARKS_DECISION;
      if (!rawDecision || !String(rawDecision).trim()) {
        updated_fields.REMARKS_DECISION = 'Pending';
      } else {
        const trimmedDecision = String(rawDecision).trim();
        // If it's a JSON array (per-respondent recommendations), preserve it as-is
        try {
          const parsed = JSON.parse(trimmedDecision);
          updated_fields.REMARKS_DECISION = Array.isArray(parsed)
            ? trimmedDecision
            : trimmedDecision.charAt(0).toUpperCase() + trimmedDecision.slice(1).toLowerCase();
        } catch {
          updated_fields.REMARKS_DECISION = trimmedDecision.charAt(0).toUpperCase() + trimmedDecision.slice(1).toLowerCase();
        }
      }
    }

    // Helper function to format dates for MySQL (YYYY-MM-DD)
    const formatDateForMySQL = (value, fieldName) => {
      if (!value || value === '0000-00-00' || value.startsWith('0000-')) {
        return null;
      }
      
      // Check if this is a date field
      // Note: DATEFILED_IN_COURT is excluded because it stores a JSON array of per-respondent dates
      const dateFields = ['DATE_FILED', 'DATE_OF_COMMISSION', 'DATE_RESOLVED', 'DECISION_DATE'];
      if (dateFields.includes(fieldName) && typeof value === 'string') {
        // Handle ISO date strings like '2024-01-09T16:00:00.000Z'
        if (value.includes('T')) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]; // Returns 'YYYY-MM-DD'
          }
        }
        // Already in YYYY-MM-DD format or similar
        return value.split('T')[0];
      }
      
      return value;
    };

    let updateQuery = "UPDATE cases SET ";
    const updateValues = [];

    // Whitelist of allowed fields to prevent SQL injection
    const ALLOWED_FIELDS = [
      'DOCKET_NO', 'DATE_FILED', 'COMPLAINANT', 'RESPONDENT', 'ADDRESS_OF_RESPONDENT',
      'OFFENSE', 'FINAL_OFFENSE', 'DATE_OF_COMMISSION', 'DATE_RESOLVED', 'status',
      'RESOLVING_PROSECUTOR', 'CRIM_CASE_NO', 'BRANCH', 'DATEFILED_IN_COURT',
      'REMARKS_DECISION', 'PENALTY', 'DECISION_DATE', 'INDEX_CARDS',
      'MR_FILED_BY', 'DATE_MR_FILING', 'DATE_MR_RESOLVED', 'MR_FINDING'
    ];

    const fields = Object.keys(updated_fields)
      .filter(field => ALLOWED_FIELDS.includes(field) && updated_fields[field] !== undefined);
    
    if (fields.length === 0) {
      return res.status(400).json(ApiResponse.error("No valid fields to update", 400));
    }

    fields.forEach((field, index) => {
      updateQuery += `${field} = ?`;
      if (index < fields.length - 1) updateQuery += ", ";
      
      // Format the value (handles dates and invalid values)
      let value = formatDateForMySQL(updated_fields[field], field);
      
      updateValues.push(value);
    });

    updateQuery += " WHERE id = ?";
    updateValues.push(id);

    console.log("Executing Update:", updateQuery);
    console.log("With values:", updateValues);

    db.query(updateQuery, updateValues, (err, result) => {
      if (err) {
        console.error("❌ Error updating case - Query:", updateQuery);
        console.error("❌ Error updating case - Values:", updateValues);
        console.error("❌ Error updating case - Error Details:", err);
        return res.status(500).json(ApiResponse.error("Error updating case: " + err.message, 500));
      }
      if (result.affectedRows === 0) {
        return res.status(404).json(ApiResponse.error("No matching case found", 404));
      }
      
      // Sync Excel file after successful update
      exportCasesToExcel()
        .then(() => {
          console.log("Excel file synced after case update");
        })
        .catch(excelErr => {
          console.error("Error syncing Excel file:", excelErr);
        });
      
      // Emit real-time event
      emitRealtimeEvent('case_updated', { id });
      
      return res.json(ApiResponse.success("Case updated successfully"));
    });
  } catch (error) {
    console.error("❌ Error in update-case endpoint:", error);
    return res.status(500).json(ApiResponse.error("Internal server error: " + error.message, 500));
  }
});

// Update case with image upload
// Update case with image (Staff or Admin)
app.post("/update-case-with-image", indexCardUpload.single('indexCardImage'), (req, res) => {
  if (!db || db.state === 'disconnected') {
    return res.status(503).json({
      success: false,
      message: "Database connection is not available. Please ensure MySQL/XAMPP is running.",
      error: "SERVICE_UNAVAILABLE"
    });
  }
  
  console.log("Update request received");
  console.log("Request body:", req.body);
  console.log("Request file:", req.file);
  
  const { id } = req.body;

  if (!id) {
    console.log("Missing case ID");
    return res.status(400).json({ message: "Missing case ID." });
  }

  let updateQuery = "UPDATE cases SET ";
  const updateValues = [];
  const fields = [];

  // Whitelist of allowed fields
  const ALLOWED_FIELDS = [
    'DOCKET_NO', 'DATE_FILED', 'COMPLAINANT', 'RESPONDENT', 'ADDRESS_OF_RESPONDENT',
    'OFFENSE', 'FINAL_OFFENSE', 'DATE_OF_COMMISSION', 'DATE_RESOLVED', 'status',
    'RESOLVING_PROSECUTOR', 'CRIM_CASE_NO', 'BRANCH', 'DATEFILED_IN_COURT',
    'REMARKS_DECISION', 'PENALTY', 'DECISION_DATE', 'INDEX_CARDS',
    'MR_FILED_BY', 'DATE_MR_FILING', 'DATE_MR_RESOLVED', 'MR_FINDING'
  ];

  // Add the image path
  if (req.file) {
    fields.push('INDEX_CARDS');
    updateValues.push(`/uploads/index_cards/${req.file.filename}`);
    console.log("Image uploaded:", req.file.filename);
  }

  // Add other updated fields - with whitelist validation
  const excludedFields = ['id', 'indexCardImage', 'created_by', 'created_at', 'updated_by', 'updated_at'];
  Object.keys(req.body).forEach((key) => {
    if (!excludedFields.includes(key) && ALLOWED_FIELDS.includes(key)) {
      let value = req.body[key];
      // Normalize REMARKS_DECISION — preserve JSON arrays as-is
      if (key === 'REMARKS_DECISION' && typeof value === 'string') {
        const trimmedDecision = value.trim();
        if (!trimmedDecision) {
          value = 'Pending';
        } else {
          try {
            const parsed = JSON.parse(trimmedDecision);
            value = Array.isArray(parsed)
              ? trimmedDecision
              : trimmedDecision.charAt(0).toUpperCase() + trimmedDecision.slice(1).toLowerCase();
          } catch {
            value = trimmedDecision.charAt(0).toUpperCase() + trimmedDecision.slice(1).toLowerCase();
          }
        }
      }
      fields.push(key);
      updateValues.push(value);
    }
  });

  // Automatically set updated_at to current timestamp
  fields.push('updated_at');
  updateValues.push(new Date());

  console.log("Fields to update:", fields);
  console.log("Values:", updateValues);

  if (fields.length === 0) {
    console.log("No fields to update");
    return res.status(400).json({ message: "No fields to update." });
  }

  fields.forEach((field, index) => {
    updateQuery += `${field} = ?`;
    if (index < fields.length - 1) updateQuery += ", ";
  });

  updateQuery += " WHERE id = ?";
  updateValues.push(id);

  console.log("Executing Update with Image:", updateQuery);
  console.log("With values:", updateValues);

  db.query(updateQuery, updateValues, (err, result) => {
    if (err) {
      console.error("Error updating case:", err);
      return res.status(500).json({ message: "Error updating case: " + err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No matching case found." });
    }
    
    // Sync Excel file after successful update
    exportCasesToExcel()
      .then(() => {
        console.log("Excel file synced after case update with image");
      })
      .catch(excelErr => {
        console.error("Error syncing Excel file:", excelErr);
      });
    
    console.log("Update successful!");
    emitRealtimeEvent('case_updated', { docketNo: req.body.DOCKET_NO });
    return res.json({ message: "Case updated successfully!" });
  });
});


//delete case (move to terminated_cases table)

const parseCaseValueList = (value) => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item ?? '').trim()).filter(Boolean);
      }
    } catch (parseError) {
      // Treat non-JSON values as a single entry.
    }

    return [trimmed];
  }

  return [String(value).trim()].filter(Boolean);
};

const serializeCaseValueList = (values) => {
  const cleaned = (values || [])
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);

  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned[0];
  return JSON.stringify(cleaned);
};

const removeCaseValueAtIndex = (values, index) => values.filter((_, valueIndex) => valueIndex !== index);

const appendCaseValue = (values, value) => [...values, value].filter((item) => String(item ?? '').trim() !== '');

const appendCaseValues = (values, valuesToAppend) => [...values, ...(valuesToAppend || [])].filter((item) => String(item ?? '').trim() !== '');

const normalizeTerminatedStatus = (value, fallback = 'Pending') => {
  const raw = String(value ?? '').trim();
  const safe = raw || String(fallback ?? '').trim() || 'Pending';
  return safe.slice(0, 50);
};

const dbQuery = (query, params = []) => new Promise((resolve, reject) => {
  db.query(query, params, (err, results) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(results);
  });
});

const normalizeCaseText = (value) => String(value ?? '').trim().toLowerCase();

const findCaseValueIndex = (values, respondent, fallbackIndex = 0) => {
  const normalizedRespondent = normalizeCaseText(respondent);

  if (normalizedRespondent) {
    const exactMatchIndex = values.findIndex((item) => normalizeCaseText(item) === normalizedRespondent);
    if (exactMatchIndex >= 0) return exactMatchIndex;
  }

  if (Number.isInteger(fallbackIndex) && fallbackIndex >= 0 && fallbackIndex < values.length) {
    return fallbackIndex;
  }

  return 0;
};

// Delete case (Admin only)
app.delete("/delete-case", (req, res) => {
  console.log("Delete request received with body:", req.body); // Debugging log

  const { docket_no, respondent_index, respondent } = req.body;

  if (!docket_no) {
      console.error("No docket number provided.");
      return res.status(400).json({ message: "Docket number is required for deletion." });
  }

  const normalizedDocket = docket_no.trim().toLowerCase();
  const requestedRespondentIndex = Number.parseInt(respondent_index, 10);
  const hasRespondentIndex = Number.isInteger(requestedRespondentIndex) && requestedRespondentIndex >= 0;

  // First, get the case data to move
  const selectQuery = "SELECT * FROM cases WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))";

  db.query(selectQuery, [normalizedDocket], (err, results) => {
      if (err) {
          console.error("Error finding case:", err);
          return res.status(500).json({ message: "Error finding case.", error: err.message });
      }

      if (results.length === 0) {
          console.warn("No matching case found for deletion.");
          return res.status(404).json({ message: "No matching case found." });
      }

      const caseData = results[0];

      const respondents = parseCaseValueList(caseData.RESPONDENT);
      if (respondents.length === 0) {
        return res.status(400).json({ message: "No respondent records found for this case." });
      }

      const targetIndex = findCaseValueIndex(respondents, respondent, hasRespondentIndex ? requestedRespondentIndex : 0);
      const removedRespondent = respondents[targetIndex] || respondents[0];

      const addresses = parseCaseValueList(caseData.ADDRESS_OF_RESPONDENT);
      const decisions = parseCaseValueList(caseData.REMARKS_DECISION);
      const finalOffenses = parseCaseValueList(caseData.FINAL_OFFENSE);
      const crimCaseNos = parseCaseValueList(caseData.CRIM_CASE_NO);
      const branches = parseCaseValueList(caseData.BRANCH);
      const datesFiledInCourt = parseCaseValueList(caseData.DATEFILED_IN_COURT);

      const removedAddress = addresses[targetIndex] || '';
      const removedDecision = decisions[targetIndex] || decisions[0] || caseData.status || 'Pending';
      const removedFinalOffense = finalOffenses[targetIndex] || '';
      const removedCrimCaseNo = crimCaseNos[targetIndex] || '';
      const removedBranch = branches[targetIndex] || '';
      const removedDateFiledInCourt = datesFiledInCourt[targetIndex] || '';

      const remainingRespondents = removeCaseValueAtIndex(respondents, targetIndex);
      const remainingAddresses = removeCaseValueAtIndex(addresses, targetIndex);
      const remainingDecisions = removeCaseValueAtIndex(decisions, targetIndex);
      const remainingFinalOffenses = removeCaseValueAtIndex(finalOffenses, targetIndex);
      const remainingCrimCaseNos = removeCaseValueAtIndex(crimCaseNos, targetIndex);
      const remainingBranches = removeCaseValueAtIndex(branches, targetIndex);
      const remainingDatesFiledInCourt = removeCaseValueAtIndex(datesFiledInCourt, targetIndex);

      const terminatedSelectQuery = "SELECT * FROM terminated_cases WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))";

      db.query(terminatedSelectQuery, [normalizedDocket], (terminatedErr, terminatedResults) => {
          if (terminatedErr) {
              console.error("Error checking terminated_cases:", terminatedErr);
              return res.status(500).json({ message: "Error checking terminated cases.", error: terminatedErr.message });
          }

          const terminatedExists = terminatedResults.length > 0;
          const terminatedData = terminatedExists ? terminatedResults[0] : null;

          const terminatedRespondents = parseCaseValueList(terminatedData?.RESPONDENT);
          const terminatedAddresses = parseCaseValueList(terminatedData?.ADDRESS_OF_RESPONDENT);
          const terminatedDecisions = parseCaseValueList(terminatedData?.REMARKS_DECISION);
          const terminatedFinalOffenses = parseCaseValueList(terminatedData?.FINAL_OFFENSE);
          const terminatedCrimCaseNos = parseCaseValueList(terminatedData?.CRIM_CASE_NO);
          const terminatedBranches = parseCaseValueList(terminatedData?.BRANCH);
          const terminatedDatesFiledInCourt = parseCaseValueList(terminatedData?.DATEFILED_IN_COURT);

          const nextTerminatedRespondents = appendCaseValue(terminatedRespondents, removedRespondent);
          const nextTerminatedAddresses = appendCaseValue(terminatedAddresses, removedAddress);
          const nextTerminatedDecisions = appendCaseValue(terminatedDecisions, removedDecision);
          const nextTerminatedCrimCaseNos = appendCaseValue(terminatedCrimCaseNos, removedCrimCaseNo);
          const nextTerminatedBranches = appendCaseValue(terminatedBranches, removedBranch);
          const nextTerminatedDatesFiledInCourt = appendCaseValue(terminatedDatesFiledInCourt, removedDateFiledInCourt);

          const terminationReason = `Case terminated for respondent ${removedRespondent}`;

          const saveTerminatedCase = (afterSave) => {
              if (terminatedExists) {
                  const updateTerminatedQuery = `UPDATE terminated_cases SET
                    RESPONDENT = ?,
                    ADDRESS_OF_RESPONDENT = ?,
                    REMARKS_DECISION = ?,
                    CRIM_CASE_NO = ?,
                    BRANCH = ?,
                    DATEFILED_IN_COURT = ?,
                    status = ?,
                    termination_reason = ?,
                    terminated_at = NOW(),
                    updated_at = NOW()
                  WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))`;

                  const updateValues = [
                    serializeCaseValueList(nextTerminatedRespondents),
                    serializeCaseValueList(nextTerminatedAddresses),
                    serializeCaseValueList(nextTerminatedDecisions),
                    serializeCaseValueList(nextTerminatedCrimCaseNos),
                    serializeCaseValueList(nextTerminatedBranches),
                    serializeCaseValueList(nextTerminatedDatesFiledInCourt),
                    removedDecision,
                    terminationReason,
                    normalizedDocket,
                  ];

                  db.query(updateTerminatedQuery, updateValues, (updateErr) => {
                    if (updateErr) {
                      console.error("Error updating terminated case:", updateErr);
                      return res.status(500).json({ message: "Error saving terminated case.", error: updateErr.message });
                    }

                    afterSave();
                  });
                  return;
              }

              const insertQuery = `INSERT INTO terminated_cases (
                DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, ADDRESS_OF_RESPONDENT,
                OFFENSE, DATE_OF_COMMISSION, DATE_RESOLVED, status, RESOLVING_PROSECUTOR,
                CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, REMARKS_DECISION, PENALTY,
                DECISION_DATE, INDEX_CARDS, terminated_at, terminated_by_user_id, terminated_by_name,
                termination_reason, created_at, created_by, updated_at, updated_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL, ?, ?, ?, ?, ?)`;

              const insertValues = [
                caseData.DOCKET_NO,
                caseData.DATE_FILED,
                caseData.COMPLAINANT,
                serializeCaseValueList(nextTerminatedRespondents),
                serializeCaseValueList(nextTerminatedAddresses),
                caseData.OFFENSE,
                caseData.DATE_OF_COMMISSION,
                caseData.DATE_RESOLVED,
                removedDecision,
                caseData.RESOLVING_PROSECUTOR,
                serializeCaseValueList(nextTerminatedCrimCaseNos),
                serializeCaseValueList(nextTerminatedBranches),
                serializeCaseValueList(nextTerminatedDatesFiledInCourt),
                serializeCaseValueList(nextTerminatedDecisions),
                caseData.PENALTY,
                caseData.DECISION_DATE,
                caseData.INDEX_CARDS,
                terminationReason,
                caseData.created_at,
                caseData.created_by,
                caseData.updated_at,
                caseData.updated_by,
              ];

              db.query(insertQuery, insertValues, (insertErr) => {
                  if (insertErr) {
                      console.error("Error moving case to terminated_cases:", insertErr);
                      return res.status(500).json({ message: "Error terminating case.", error: insertErr.message });
                  }

                  afterSave();
              });
          };

          const finalizeDelete = () => {
              if (remainingRespondents.length === 0) {
                  const deleteQuery = "DELETE FROM cases WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))";
                  db.query(deleteQuery, [normalizedDocket], (deleteErr) => {
                      if (deleteErr) {
                          console.error("Error removing case from cases table:", deleteErr);
                          return res.status(500).json({ message: "Error completing case termination.", error: deleteErr.message });
                      }

                      emitRealtimeEvent('case_deleted', { docketNo: docket_no, respondentIndex: targetIndex });

                      exportCasesToExcel()
                        .then(() => {
                          console.log("Excel file synced after case termination");
                        })
                        .catch(excelErr => {
                          console.error("Error syncing Excel file:", excelErr);
                        });

                      return res.json({ message: "Case terminated successfully!" });
                  });
                  return;
              }

              const updateQuery = `UPDATE cases SET
                RESPONDENT = ?,
                ADDRESS_OF_RESPONDENT = ?,
                REMARKS_DECISION = ?,
                FINAL_OFFENSE = ?,
                CRIM_CASE_NO = ?,
                BRANCH = ?,
                DATEFILED_IN_COURT = ?
              WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))`;

              const updateValues = [
                serializeCaseValueList(remainingRespondents),
                serializeCaseValueList(remainingAddresses),
                serializeCaseValueList(remainingDecisions),
                serializeCaseValueList(remainingFinalOffenses),
                serializeCaseValueList(remainingCrimCaseNos),
                serializeCaseValueList(remainingBranches),
                serializeCaseValueList(remainingDatesFiledInCourt),
                normalizedDocket,
              ];

              db.query(updateQuery, updateValues, (updateErr) => {
                  if (updateErr) {
                      console.error("Error updating active case after respondent termination:", updateErr);
                      return res.status(500).json({ message: "Error completing case termination.", error: updateErr.message });
                  }

                  emitRealtimeEvent('case_deleted', { docketNo: docket_no, respondentIndex: targetIndex });

                  exportCasesToExcel()
                    .then(() => {
                      console.log("Excel file synced after case termination");
                    })
                    .catch(excelErr => {
                      console.error("Error syncing Excel file:", excelErr);
                    });

                  return res.json({ message: "Case terminated successfully!" });
              });
          };

          saveTerminatedCase(finalizeDelete);
      });
  });
});

// Bulk move all active cases to terminated_cases
app.post('/delete-all-cases', async (req, res) => {
  try {
    const allCases = await dbQuery('SELECT * FROM cases');

    if (allCases.length === 0) {
      return res.json({
        message: 'No active cases to move.',
        movedCases: 0,
        movedRespondents: 0,
      });
    }

    let movedCases = 0;
    let movedRespondents = 0;

    for (const caseData of allCases) {
      const normalizedDocket = String(caseData.DOCKET_NO || '').trim().toLowerCase();
      if (!normalizedDocket) {
        continue;
      }

      const respondents = parseCaseValueList(caseData.RESPONDENT);
      const addresses = parseCaseValueList(caseData.ADDRESS_OF_RESPONDENT);
      const decisions = parseCaseValueList(caseData.REMARKS_DECISION);
      const crimCaseNos = parseCaseValueList(caseData.CRIM_CASE_NO);
      const branches = parseCaseValueList(caseData.BRANCH);
      const datesFiledInCourt = parseCaseValueList(caseData.DATEFILED_IN_COURT);

      const terminatedResults = await dbQuery(
        'SELECT * FROM terminated_cases WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))',
        [normalizedDocket]
      );

      const terminatedExists = terminatedResults.length > 0;
      const terminatedData = terminatedExists ? terminatedResults[0] : null;

      const terminatedRespondents = parseCaseValueList(terminatedData?.RESPONDENT);
      const terminatedAddresses = parseCaseValueList(terminatedData?.ADDRESS_OF_RESPONDENT);
      const terminatedDecisions = parseCaseValueList(terminatedData?.REMARKS_DECISION);
      const terminatedCrimCaseNos = parseCaseValueList(terminatedData?.CRIM_CASE_NO);
      const terminatedBranches = parseCaseValueList(terminatedData?.BRANCH);
      const terminatedDatesFiledInCourt = parseCaseValueList(terminatedData?.DATEFILED_IN_COURT);

      const nextTerminatedRespondents = appendCaseValues(terminatedRespondents, respondents);
      const nextTerminatedAddresses = appendCaseValues(terminatedAddresses, addresses);
      const nextTerminatedDecisions = appendCaseValues(terminatedDecisions, decisions);
      const nextTerminatedCrimCaseNos = appendCaseValues(terminatedCrimCaseNos, crimCaseNos);
      const nextTerminatedBranches = appendCaseValues(terminatedBranches, branches);
      const nextTerminatedDatesFiledInCourt = appendCaseValues(terminatedDatesFiledInCourt, datesFiledInCourt);

      const nextStatus = normalizeTerminatedStatus(caseData.status, 'Terminated');
      const terminationReason = respondents.length > 0
        ? `Bulk move from Manage Cases (${respondents.length} respondent${respondents.length > 1 ? 's' : ''})`
        : 'Bulk move from Manage Cases';

      if (terminatedExists) {
        const updateTerminatedQuery = `UPDATE terminated_cases SET
          DATE_FILED = ?,
          COMPLAINANT = ?,
          RESPONDENT = ?,
          ADDRESS_OF_RESPONDENT = ?,
          OFFENSE = ?,
          DATE_OF_COMMISSION = ?,
          DATE_RESOLVED = ?,
          status = ?,
          RESOLVING_PROSECUTOR = ?,
          CRIM_CASE_NO = ?,
          BRANCH = ?,
          DATEFILED_IN_COURT = ?,
          REMARKS_DECISION = ?,
          PENALTY = ?,
          DECISION_DATE = ?,
          INDEX_CARDS = ?,
          termination_reason = ?,
          terminated_at = NOW(),
          updated_at = NOW()
        WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))`;

        const updateValues = [
          caseData.DATE_FILED,
          caseData.COMPLAINANT,
          serializeCaseValueList(nextTerminatedRespondents),
          serializeCaseValueList(nextTerminatedAddresses),
          caseData.OFFENSE,
          caseData.DATE_OF_COMMISSION,
          caseData.DATE_RESOLVED,
          nextStatus,
          caseData.RESOLVING_PROSECUTOR,
          serializeCaseValueList(nextTerminatedCrimCaseNos),
          serializeCaseValueList(nextTerminatedBranches),
          serializeCaseValueList(nextTerminatedDatesFiledInCourt),
          serializeCaseValueList(nextTerminatedDecisions),
          caseData.PENALTY,
          caseData.DECISION_DATE,
          caseData.INDEX_CARDS,
          terminationReason,
          normalizedDocket,
        ];

        await dbQuery(updateTerminatedQuery, updateValues);
      } else {
        const insertQuery = `INSERT INTO terminated_cases (
          DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, ADDRESS_OF_RESPONDENT,
          OFFENSE, DATE_OF_COMMISSION, DATE_RESOLVED, status, RESOLVING_PROSECUTOR,
          CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, REMARKS_DECISION, PENALTY,
          DECISION_DATE, INDEX_CARDS, terminated_at, terminated_by_user_id, terminated_by_name,
          termination_reason, created_at, created_by, updated_at, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL, ?, ?, ?, ?, ?)`;

        const insertValues = [
          caseData.DOCKET_NO,
          caseData.DATE_FILED,
          caseData.COMPLAINANT,
          serializeCaseValueList(respondents),
          serializeCaseValueList(addresses),
          caseData.OFFENSE,
          caseData.DATE_OF_COMMISSION,
          caseData.DATE_RESOLVED,
          normalizeTerminatedStatus(caseData.status, 'Terminated'),
          caseData.RESOLVING_PROSECUTOR,
          serializeCaseValueList(crimCaseNos),
          serializeCaseValueList(branches),
          serializeCaseValueList(datesFiledInCourt),
          serializeCaseValueList(decisions),
          caseData.PENALTY,
          caseData.DECISION_DATE,
          caseData.INDEX_CARDS,
          terminationReason,
          caseData.created_at,
          caseData.created_by,
          caseData.updated_at,
          caseData.updated_by,
        ];

        await dbQuery(insertQuery, insertValues);
      }

      await dbQuery('DELETE FROM cases WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))', [normalizedDocket]);

      movedCases += 1;
      movedRespondents += Math.max(respondents.length, 1);
      emitRealtimeEvent('case_deleted', { docketNo: caseData.DOCKET_NO, bulkMove: true });
    }

    exportCasesToExcel()
      .then(() => {
        console.log('Excel file synced after bulk case termination');
      })
      .catch((excelErr) => {
        console.error('Error syncing Excel file:', excelErr);
      });

    return res.json({
      message: 'All active cases were moved to terminated cases successfully.',
      movedCases,
      movedRespondents,
    });
  } catch (err) {
    console.error('Error moving all cases:', err);
    return res.status(500).json({
      message: 'Error moving all cases to terminated cases.',
      error: err.message,
    });
  }
});

// Get terminated cases
app.get("/deleted-cases", (req, res) => {
  db.query("SELECT * FROM terminated_cases ORDER BY terminated_at DESC", (err, results) => {
    if (err) {
      console.error("Error fetching terminated cases:", err);
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// Restore terminated case
app.patch("/restore-case", (req, res) => {
  try {
    console.log("Restore request received with body:", req.body);

  const { docket_no, respondent_index, respondent } = req.body;

    if (!docket_no) {
        console.error("No docket number provided.");
        return res.status(400).json({ message: "Docket number is required for restoration." });
    }

  const normalizedDocket = docket_no.trim().toLowerCase();
  const requestedRespondentIndex = Number.parseInt(respondent_index, 10);
  const hasRespondentIndex = Number.isInteger(requestedRespondentIndex) && requestedRespondentIndex >= 0;

    // Get case data from terminated_cases table
  const selectQuery = "SELECT * FROM terminated_cases WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))";

  db.query(selectQuery, [normalizedDocket], (err, results) => {
        if (err) {
            console.error("Error finding terminated case:", err);
            return res.status(500).json({ message: "Error finding terminated case.", error: err.message });
        }

        if (results.length === 0) {
            console.warn("No matching terminated case found for restoration.");
            return res.status(404).json({ message: "No matching terminated case found." });
        }

        const caseData = results[0];

        const terminatedRespondents = parseCaseValueList(caseData.RESPONDENT);
        if (terminatedRespondents.length === 0) {
            return res.status(400).json({ message: "No terminated respondent records found for this case." });
        }

        const terminatedAddresses = parseCaseValueList(caseData.ADDRESS_OF_RESPONDENT);
        const terminatedDecisions = parseCaseValueList(caseData.REMARKS_DECISION);
        const terminatedFinalOffenses = parseCaseValueList(caseData.FINAL_OFFENSE);
        const terminatedCrimCaseNos = parseCaseValueList(caseData.CRIM_CASE_NO);
        const terminatedBranches = parseCaseValueList(caseData.BRANCH);
        const terminatedDatesFiledInCourt = parseCaseValueList(caseData.DATEFILED_IN_COURT);

        const selectedIndex = findCaseValueIndex(
          terminatedRespondents,
          respondent,
          hasRespondentIndex ? requestedRespondentIndex : 0
        );

        const targetIndices = [selectedIndex];

        const respondentsToRestore = targetIndices.map((index) => terminatedRespondents[index]).filter(Boolean);
        const addressesToRestore = targetIndices.map((index) => terminatedAddresses[index]).filter((value) => value !== undefined && value !== null);
        const decisionsToRestore = targetIndices.map((index) => terminatedDecisions[index]).filter((value) => value !== undefined && value !== null);
        const finalOffensesToRestore = targetIndices.map((index) => terminatedFinalOffenses[index]).filter((value) => value !== undefined && value !== null);
        const crimCaseNosToRestore = targetIndices.map((index) => terminatedCrimCaseNos[index]).filter((value) => value !== undefined && value !== null);
        const branchesToRestore = targetIndices.map((index) => terminatedBranches[index]).filter((value) => value !== undefined && value !== null);
        const datesFiledToRestore = targetIndices.map((index) => terminatedDatesFiledInCourt[index]).filter((value) => value !== undefined && value !== null);

        const remainingRespondents = terminatedRespondents.filter((_, index) => !targetIndices.includes(index));
        const remainingAddresses = terminatedAddresses.filter((_, index) => !targetIndices.includes(index));
        const remainingDecisions = terminatedDecisions.filter((_, index) => !targetIndices.includes(index));
        const remainingFinalOffenses = terminatedFinalOffenses.filter((_, index) => !targetIndices.includes(index));
        const remainingCrimCaseNos = terminatedCrimCaseNos.filter((_, index) => !targetIndices.includes(index));
        const remainingBranches = terminatedBranches.filter((_, index) => !targetIndices.includes(index));
        const remainingDatesFiledInCourt = terminatedDatesFiledInCourt.filter((_, index) => !targetIndices.includes(index));

        const activeSelectQuery = "SELECT * FROM cases WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))";

        db.query(activeSelectQuery, [normalizedDocket], (activeErr, activeResults) => {
            if (activeErr) {
                console.error("Error finding active case for restoration:", activeErr);
                return res.status(500).json({ message: "Error finding active case.", error: activeErr.message });
            }

            const activeCaseExists = activeResults.length > 0;
            const activeCaseData = activeCaseExists ? activeResults[0] : null;

            const activeRespondents = parseCaseValueList(activeCaseData?.RESPONDENT);
            const activeAddresses = parseCaseValueList(activeCaseData?.ADDRESS_OF_RESPONDENT);
            const activeDecisions = parseCaseValueList(activeCaseData?.REMARKS_DECISION);
            const activeFinalOffenses = parseCaseValueList(activeCaseData?.FINAL_OFFENSE);
            const activeCrimCaseNos = parseCaseValueList(activeCaseData?.CRIM_CASE_NO);
            const activeBranches = parseCaseValueList(activeCaseData?.BRANCH);
            const activeDatesFiledInCourt = parseCaseValueList(activeCaseData?.DATEFILED_IN_COURT);

            const nextActiveRespondents = appendCaseValues(activeRespondents, respondentsToRestore);
            const nextActiveAddresses = appendCaseValues(activeAddresses, addressesToRestore);
            const nextActiveDecisions = appendCaseValues(activeDecisions, decisionsToRestore);
            const nextActiveFinalOffenses = appendCaseValues(activeFinalOffenses, finalOffensesToRestore);
            const nextActiveCrimCaseNos = appendCaseValues(activeCrimCaseNos, crimCaseNosToRestore);
            const nextActiveBranches = appendCaseValues(activeBranches, branchesToRestore);
            const nextActiveDatesFiledInCourt = appendCaseValues(activeDatesFiledInCourt, datesFiledToRestore);

            const saveActiveCase = (afterSave) => {
                if (activeCaseExists) {
                    const updateQuery = `UPDATE cases SET
                      RESPONDENT = ?,
                      ADDRESS_OF_RESPONDENT = ?,
                      REMARKS_DECISION = ?,
                      FINAL_OFFENSE = ?,
                      CRIM_CASE_NO = ?,
                      BRANCH = ?,
                      DATEFILED_IN_COURT = ?
                    WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))`;

                    const updateValues = [
                        serializeCaseValueList(nextActiveRespondents),
                        serializeCaseValueList(nextActiveAddresses),
                        serializeCaseValueList(nextActiveDecisions),
                        serializeCaseValueList(nextActiveFinalOffenses),
                        serializeCaseValueList(nextActiveCrimCaseNos),
                        serializeCaseValueList(nextActiveBranches),
                        serializeCaseValueList(nextActiveDatesFiledInCourt),
                        normalizedDocket,
                    ];

                    db.query(updateQuery, updateValues, (updateErr) => {
                        if (updateErr) {
                            console.error("Error restoring into active case:", updateErr);
                            return res.status(500).json({ message: "Error restoring case.", error: updateErr.message });
                        }

                        afterSave();
                    });
                    return;
                }

                const insertQuery = `INSERT INTO cases (
                  DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, ADDRESS_OF_RESPONDENT,
                  OFFENSE, DATE_OF_COMMISSION, DATE_RESOLVED, status, RESOLVING_PROSECUTOR,
                  CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, REMARKS_DECISION, PENALTY,
                  FINAL_OFFENSE, DECISION_DATE, INDEX_CARDS, created_at, created_by, updated_at, updated_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL)`;

                const insertValues = [
                    caseData.DOCKET_NO,
                    caseData.DATE_FILED,
                    caseData.COMPLAINANT,
                    serializeCaseValueList(respondentsToRestore),
                    serializeCaseValueList(addressesToRestore),
                    caseData.OFFENSE,
                    caseData.DATE_OF_COMMISSION,
                    caseData.DATE_RESOLVED,
                    decisionsToRestore[0] || caseData.status || 'Pending',
                    caseData.RESOLVING_PROSECUTOR,
                    serializeCaseValueList(crimCaseNosToRestore),
                    serializeCaseValueList(branchesToRestore),
                    serializeCaseValueList(datesFiledToRestore),
                    serializeCaseValueList(decisionsToRestore),
                    caseData.PENALTY,
                    serializeCaseValueList(finalOffensesToRestore),
                    caseData.DECISION_DATE,
                    caseData.INDEX_CARDS,
                    caseData.created_at,
                    caseData.created_by,
                ];

                db.query(insertQuery, insertValues, (insertErr) => {
                    if (insertErr) {
                        console.error("Error inserting restored case:", insertErr);
                        return res.status(500).json({ message: "Error restoring case.", error: insertErr.message });
                    }

                    afterSave();
                });
            };

            const finalizeRestore = () => {
                if (remainingRespondents.length > 0) {
                    const updateTerminatedQuery = `UPDATE terminated_cases SET
                      RESPONDENT = ?,
                      ADDRESS_OF_RESPONDENT = ?,
                      REMARKS_DECISION = ?,
                      FINAL_OFFENSE = ?,
                      CRIM_CASE_NO = ?,
                      BRANCH = ?,
                      DATEFILED_IN_COURT = ?,
                      status = ?,
                      updated_at = NOW()
                    WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))`;

                    const updateTerminatedValues = [
                        serializeCaseValueList(remainingRespondents),
                        serializeCaseValueList(remainingAddresses),
                        serializeCaseValueList(remainingDecisions),
                        serializeCaseValueList(remainingFinalOffenses),
                        serializeCaseValueList(remainingCrimCaseNos),
                        serializeCaseValueList(remainingBranches),
                        serializeCaseValueList(remainingDatesFiledInCourt),
                        remainingDecisions[0] || caseData.status || 'Pending',
                        normalizedDocket,
                    ];

                    db.query(updateTerminatedQuery, updateTerminatedValues, (updateErr) => {
                        if (updateErr) {
                            console.error("Error trimming terminated case after restoration:", updateErr);
                            return res.status(500).json({ message: "Error completing case restoration.", error: updateErr.message });
                        }

                        emitRealtimeEvent('case_restored', { docketNo: caseData.DOCKET_NO });

                        exportCasesToExcel()
                          .then(() => {
                            console.log("Excel file synced after case restoration");
                          })
                          .catch(excelErr => {
                            console.error("Error syncing Excel file:", excelErr);
                          });

                        return res.json({ message: "Case restored successfully!" });
                    });
                    return;
                }

                const deleteQuery = "DELETE FROM terminated_cases WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))";
                db.query(deleteQuery, [normalizedDocket], (deleteErr) => {
                    if (deleteErr) {
                        console.error("Error removing from terminated_cases:", deleteErr);
                        return res.status(500).json({ message: "Error completing case restoration.", error: deleteErr.message });
                    }

                    const logQuery = `INSERT INTO case_movements (docket_no, movement_type, moved_from_table,
                                    moved_to_table, reason) VALUES (?, 'RESTORED', 'terminated_cases', 'cases', 'Case restored by user')`;
                    db.query(logQuery, [docket_no], (logErr) => {
                        if (logErr) console.warn("Could not log case movement:", logErr.message);
                    });

                    emitRealtimeEvent('case_restored', { docketNo: caseData.DOCKET_NO });

                    exportCasesToExcel()
                      .then(() => {
                        console.log("Excel file synced after case restoration");
                      })
                      .catch(excelErr => {
                        console.error("Error syncing Excel file:", excelErr);
                      });

                    console.log("Case restored successfully.");
                    return res.json({ message: "Case restored successfully!" });
                });
            };

            saveActiveCase(finalizeRestore);
        });
    });
  } catch (error) {
    console.error("Unexpected error in restore-case endpoint:", error);
    res.status(500).json({ message: "Unexpected error occurred", error: error.message });
  }
});

// Permanently delete case (hard delete)
app.delete("/permanent-delete-case", (req, res) => {
  console.log("Permanent delete request received with body:", req.body);

  const { docket_no } = req.body;

  if (!docket_no) {
    console.error("No docket number provided.");
    return res.status(400).json({ message: "Docket number is required for permanent deletion." });
  }

  // Check if the case exists in terminated_cases table
  const checkQuery = "SELECT * FROM terminated_cases WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))";
  
  db.query(checkQuery, [docket_no.trim().toLowerCase()], (err, results) => {
    if (err) {
      console.error("Error checking terminated case:", err);
      return res.status(500).json({ message: "Error checking terminated case.", error: err.message });
    }

    if (results.length === 0) {
      console.warn("No matching terminated case found for permanent deletion.");
      return res.status(404).json({ message: "No matching terminated case found." });
    }

    // Permanently delete from terminated_cases table
    const deleteQuery = "DELETE FROM terminated_cases WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))";
    
    db.query(deleteQuery, [docket_no.trim().toLowerCase()], (err, result) => {
      if (err) {
        console.error("Error permanently deleting case:", err);
        return res.status(500).json({ message: "Error permanently deleting case.", error: err.message });
      }

      if (result.affectedRows === 0) {
        console.warn("No matching terminated case found for permanent deletion.");
        return res.status(404).json({ message: "No matching terminated case found." });
      }

      // Log the movement
      const logQuery = `INSERT INTO case_movements (docket_no, movement_type, moved_from_table,
                      moved_to_table, reason) VALUES (?, 'PERMANENTLY_DELETED', 'terminated_cases', NULL, 'Permanently deleted by user')`;
      db.query(logQuery, [docket_no], (err) => {
          if (err) console.warn("Could not log case movement:", err.message);
      });

      // Sync Excel file after permanently deleting case
      exportCasesToExcel()
        .then(() => {
          console.log("Excel file synced after permanent case deletion");
        })
        .catch(excelErr => {
          console.error("Error syncing Excel file:", excelErr);
        });

      console.log(`Case ${docket_no} permanently deleted from database.`);
      emitRealtimeEvent('case_permanent_deleted', { docketNo: docket_no });
      return res.json({ message: "Case permanently deleted successfully!" });
    });
  });
});

// Permanently delete ALL terminated cases (bulk hard delete)
app.delete("/permanent-delete-all-cases", (req, res) => {
  console.log("Permanent delete ALL cases request received");

  // First count how many cases will be deleted
  const countQuery = "SELECT COUNT(*) as count FROM terminated_cases";
  
  db.query(countQuery, (err, countResults) => {
    if (err) {
      console.error("Error counting terminated cases:", err);
      return res.status(500).json({ message: "Error counting terminated cases.", error: err.message });
    }

    const caseCount = countResults[0].count;

    if (caseCount === 0) {
      return res.status(404).json({ message: "No terminated cases found to delete." });
    }

    // Get all docket numbers for logging before deletion
    const getDocketsQuery = "SELECT DOCKET_NO FROM terminated_cases";
    
    db.query(getDocketsQuery, (err, docketResults) => {
      if (err) {
        console.error("Error getting docket numbers:", err);
        return res.status(500).json({ message: "Error getting case information.", error: err.message });
      }

      const docketNumbers = docketResults.map(row => row.DOCKET_NO);

      // Permanently delete all records from terminated_cases table
      const deleteQuery = "DELETE FROM terminated_cases";
      
      db.query(deleteQuery, (err, result) => {
        if (err) {
          console.error("Error permanently deleting all cases:", err);
          return res.status(500).json({ message: "Error permanently deleting cases.", error: err.message });
        }

        const deletedCount = result.affectedRows;

        // Log the movement for each deleted case
        const logPromises = docketNumbers.map(docketNo => {
          return new Promise((resolve) => {
            const logQuery = `INSERT INTO case_movements (docket_no, movement_type, moved_from_table,
                            moved_to_table, reason) VALUES (?, 'PERMANENTLY_DELETED', 'terminated_cases', NULL, 'Bulk permanent deletion by user')`;
            db.query(logQuery, [docketNo], (err) => {
              if (err) console.warn("Could not log case movement for:", docketNo, err.message);
              resolve();
            });
          });
        });

        Promise.all(logPromises).then(() => {
          // Sync Excel file after permanently deleting all cases
          exportCasesToExcel()
            .then(() => {
              console.log("Excel file synced after bulk permanent case deletion");
            })
            .catch(excelErr => {
              console.error("Error syncing Excel file:", excelErr);
            });

          console.log(`All ${deletedCount} terminated cases permanently deleted from database.`);
          return res.json({ 
            message: "All terminated cases permanently deleted successfully!",
            deletedCount: deletedCount
          });
        });
      });
    });
  });
});

// Auto-delete configuration endpoint
app.post("/configure-auto-delete", (req, res) => {
  const { scheduleType, dayOfWeek, dayOfMonth, time } = req.body;
  
  console.log("Auto-delete configuration received:", {
    scheduleType,
    dayOfWeek,
    dayOfMonth,
    time
  });
  
  try {
    // Cancel any existing schedule
    if (activeSchedules.autoDelete) {
      activeSchedules.autoDelete.cancel();
      console.log("Previous schedule cancelled");
    }

    // Create cron expression based on schedule type
    let cronExpression;
    const [hours, minutes] = time.split(':');
    
    if (scheduleType === 'daily') {
      cronExpression = `${minutes} ${hours} * * *`; // Daily at specified time
    } else if (scheduleType === 'weekly') {
      const dayMap = {
        'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
        'Friday': 5, 'Saturday': 6, 'Sunday': 0
      };
      const dayNum = dayMap[dayOfWeek];
      cronExpression = `${minutes} ${hours} * * ${dayNum}`; // Weekly on specified day
    } else if (scheduleType === 'monthly') {
      cronExpression = `${minutes} ${hours} ${dayOfMonth} * *`; // Monthly on specified day
    }

    console.log(`Scheduling cron: ${cronExpression}`);

    // Schedule the deletion
    activeSchedules.autoDelete = schedule.scheduleJob(cronExpression, () => {
      console.log("⏰ Auto-delete scheduled time reached! Deleting cases...");
      
      // Permanently delete all terminated cases
      const deleteQuery = `DELETE FROM terminated_cases`;
      
      db.query(deleteQuery, (err, results) => {
        if (err) {
          console.error("Error permanently deleting cases:", err);
          return;
        }
        
        console.log(`✅ Permanently deleted ${results.affectedRows} terminated cases`);
        
        // Update Excel file after deletion
        exportCasesToExcel()
          .then(() => {
            console.log("✅ Excel file updated after auto-deletion");
          })
          .catch(err => {
            console.error("Error updating Excel file:", err);
          });
      });
    });

    res.json({
      success: true,
      message: `Auto-delete schedule configured: ${scheduleType} at ${time}${dayOfWeek ? ` on ${dayOfWeek}` : ''}${dayOfMonth ? ` on day ${dayOfMonth}` : ''}`,
      config: {
        scheduleType,
        dayOfWeek,
        dayOfMonth,
        time,
        cronExpression
      }
    });
    
    console.log("✅ Auto-delete schedule configured successfully");
  } catch (error) {
    console.error("Error configuring auto-delete:", error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to configure auto-delete schedule: ' + error.message
    });
  }
});

// Serve static files from the React app build directory
// Only serve static files if not in Docker (where frontend has its own container)
if (process.env.NODE_ENV === 'production' && !process.env.DOCKER_ENV) {
  app.use(express.static(path.join(__dirname, 'build')));
  
  // Catch all handler: send back React's index.html file for all non-API routes
  // Express 5 uses '{*path}' instead of '*' for wildcard routes
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'build/index.html'));
  });
} else {
  // Root route for development or Docker environment
  app.get("/", (req, res) => {
    res.json({ message: "Backend server is running successfully!" });
  });
}

// =====================================================
// PDF GENERATION ENDPOINT
// =====================================================

// Generate PDF for clearance certificate
app.get("/api/clearances/:id/generate-pdf", (req, res) => {
  const { id } = req.params;
  
  db.query(
    `SELECT * FROM clearances WHERE id = ? AND deleted_at IS NULL`,
    [id],
    (err, results) => {
      if (err) {
        console.error("Error fetching clearance for PDF:", err);
        return res.status(500).json({ error: "Failed to generate PDF" });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: "Clearance not found" });
      }
      
      const clearance = results[0];
      
      // Generate HTML content based on format
      const htmlContent = generateClearanceHTML(clearance);
      
      // Log the PDF generation as a download
      db.query(
        `INSERT INTO clearance_audit_log (clearance_id, action, action_by_user_id, action_by_name)
         VALUES (?, 'DOWNLOAD', ?, ?)`,
        [id, 0, 'System'],
        (auditErr) => {
          if (auditErr) console.error("Error logging PDF generation:", auditErr);
        }
      );
      
      // Send HTML content with PDF header
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    }
  );
});

// Helper function to generate clearance HTML
const generateClearanceHTML = (clearance) => {
  const {
    or_number,
    format_type,
    first_name,
    middle_name,
    last_name,
    suffix,
    alias,
    age,
    civil_status,
    nationality,
    address,
    has_criminal_record,
    case_numbers,
    crime_description,
    legal_statute,
    date_of_commission,
    date_information_filed,
    case_status,
    court_branch,
    purpose,
    date_issued,
    prc_id_number,
    validity_expiry,
    issued_by_name
  } = clearance;
  
  const fullName = [first_name, middle_name, last_name, suffix].filter(Boolean).join(' ');
  const issuedDate = new Date(date_issued).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const expiryDate = new Date(validity_expiry).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  const getFormatLabel = (type) => {
    const labels = {
      'A': 'INDIVIDUAL - NO CRIMINAL RECORD',
      'B': 'INDIVIDUAL - WITH CRIMINAL RECORD',
      'C': 'FAMILY/REQUESTER - NO CRIMINAL RECORD',
      'D': 'FAMILY/REQUESTER - WITH CRIMINAL RECORD',
      'E': 'INDIVIDUAL - NO DEROGATORY RECORD',
      'F': 'INDIVIDUAL - BALSAFF APPLICATION'
    };
    return labels[type] || 'UNKNOWN';
  };
  
  // Build certificate body based on format
  let bodyContent = '';
  
  if (format_type === 'E') {
    // Format E: No Derogatory Record
    bodyContent = `
      <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
      <p>This is to certify that per records of this office show that one <strong>${fullName}</strong>, 
      ${age} years old, ${civil_status}, ${nationality}, residing at ${address} 
      has <span style="font-weight: bold; color: green; font-size: 18px;">NO DEROGATORY RECORD</span> 
      found in this office.</p>
    `;
  } else if (format_type === 'F') {
    // Format F: Balsaff Case
    bodyContent = `
      <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
      <p>This is to certify that per records of this office show that one <strong>${fullName}</strong>, 
      ${age} years old, ${civil_status}, ${nationality}, residing at ${address} 
      has been charged of the following:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="border: 1px solid black; padding: 8px; font-weight: bold; width: 30%;">Criminal Case No.:</td>
          <td style="border: 1px solid black; padding: 8px;">${case_numbers || 'N/A'}</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; font-weight: bold;">Date Info Filed:</td>
          <td style="border: 1px solid black; padding: 8px;">${date_information_filed ? new Date(date_information_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; font-weight: bold;">Crime:</td>
          <td style="border: 1px solid black; padding: 8px;">${crime_description || 'N/A'}</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; font-weight: bold;">Status:</td>
          <td style="border: 1px solid black; padding: 8px;">${case_status || 'N/A'}</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; font-weight: bold;">Court/Branch:</td>
          <td style="border: 1px solid black; padding: 8px;">${court_branch || 'N/A'}</td>
        </tr>
      </table>
      <p>This certifies that the above-mentioned accused is neither a habitual delinquent nor a recidivist as per records found in this office.</p>
    `;
  } else if (has_criminal_record && (format_type === 'B' || format_type === 'D')) {
    // Format B/D: With Criminal Record
    bodyContent = `
      <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
      <p>This is to certify that <strong>${fullName}</strong>
      ${alias ? ` alias "${alias}"` : ''}, ${age} years old, 
      ${civil_status}, ${nationality}, with residence at ${address}, 
      is <span style="font-weight: bold; color: red;">CHARGED</span> with criminal offense as follows:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="border: 1px solid black; padding: 8px; font-weight: bold; width: 30%;">Criminal Case No.:</td>
          <td style="border: 1px solid black; padding: 8px;">${case_numbers || 'N/A'}</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; font-weight: bold;">Crime/Offense:</td>
          <td style="border: 1px solid black; padding: 8px;">${crime_description || 'N/A'}</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; font-weight: bold;">Legal Statute:</td>
          <td style="border: 1px solid black; padding: 8px;">${legal_statute || 'N/A'}</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; font-weight: bold;">Date of Commission:</td>
          <td style="border: 1px solid black; padding: 8px;">${date_of_commission ? new Date(date_of_commission).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; font-weight: bold;">Date Information Filed:</td>
          <td style="border: 1px solid black; padding: 8px;">${date_information_filed ? new Date(date_information_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; font-weight: bold;">Status:</td>
          <td style="border: 1px solid black; padding: 8px;">${case_status || 'N/A'}</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; font-weight: bold;">Court/Branch:</td>
          <td style="border: 1px solid black; padding: 8px;">${court_branch || 'N/A'}</td>
        </tr>
      </table>
    `;
  } else {
    // Format A/C: No Criminal Record
    bodyContent = `
      <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
      <p>This is to certify that <strong>${fullName}</strong>, ${age} years old, 
      ${civil_status}, ${nationality}, with residence at ${address}, 
      has <span style="font-weight: bold; color: green; font-size: 18px;">NO CRIMINAL RECORD</span> 
      on file in this office based on available records.</p>
    `;
  }
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Clearance - ${or_number}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      margin: 20px;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .certificate {
      background-color: white;
      padding: 40px;
      margin: 0 auto;
      max-width: 800px;
      border: 2px solid #000;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
    }
    .header p {
      margin: 5px 0;
      font-size: 12px;
    }
    .title {
      text-align: center;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
      text-decoration: underline;
    }
    .body {
      text-align: justify;
      font-size: 13px;
      line-height: 1.6;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      text-align: right;
    }
    .signature-line {
      margin-top: 40px;
      border-top: 1px solid #000;
      text-align: center;
      font-size: 12px;
      padding-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin: 15px 0;
    }
    table td {
      padding: 8px;
      border: 1px solid #000;
    }
    .info-section {
      margin: 15px 0;
      font-size: 12px;
    }
    .info-row {
      margin: 5px 0;
    }
    .info-label {
      font-weight: bold;
      display: inline-block;
      width: 150px;
    }
    .no-print {
      display: none;
    }
    @media print {
      body {
        background-color: white;
        margin: 0;
        padding: 0;
      }
      .certificate {
        box-shadow: none;
        margin: 0;
        max-width: 100%;
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <!-- Header -->
    <div class="header">
      <h1>OFFICE OF THE CITY PROSECUTOR</h1>
      <p>TAGBILARAN CITY, BOHOL</p>
      <p style="font-weight: bold;">CERTIFICATE OF CLEARANCE</p>
    </div>
    
    <!-- Format Type -->
    <div class="title">
      ${getFormatLabel(format_type)}
    </div>
    
    <!-- OR Number and Basic Info -->
    <div class="info-section">
      <div class="info-row">
        <span class="info-label">O.R. No.:</span>
        <span>${or_number}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date Issued:</span>
        <span>${issuedDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Valid Until:</span>
        <span>${expiryDate}</span>
      </div>
    </div>
    
    <!-- Certificate Body -->
    <div class="body">
      ${bodyContent}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p><strong>${issued_by_name}</strong></p>
      <p>City Prosecutor / Authorized Representative</p>
      ${prc_id_number ? `<p>PRC ID: ${prc_id_number}</p>` : ''}
    </div>
    
    <!-- Information -->
    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 11px; color: #666;">
      <p style="margin: 5px 0;">Purpose: ${purpose}</p>
      <p style="margin: 5px 0;">This certificate is valid only within the date issued and validity period stated above.</p>
      <p style="margin: 5px 0;">Document ID: ${or_number} | Generated: ${new Date().toLocaleString('en-US')}</p>
    </div>
  </div>
  
  <script>
    // Auto-print for PDF generation
    if (window.location.search.includes('print=true')) {
      window.print();
    }
  </script>
</body>
</html>
  `;
};

// =====================================================
// FORMAT MANAGEMENT API ENDPOINTS
// =====================================================

// Path for clearance formats JSON file
const FORMATS_FILE_PATH = path.join(__dirname, 'uploads', 'clearance_formats.json');

// Helper function to read formats from JSON file
const readFormatsFromFile = () => {
  try {
    if (fs.existsSync(FORMATS_FILE_PATH)) {
      const data = fs.readFileSync(FORMATS_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading formats file:', error);
    return [];
  }
};

// Helper function to write formats to JSON file
const writeFormatsToFile = (formats) => {
  try {
    const dir = path.dirname(FORMATS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FORMATS_FILE_PATH, JSON.stringify(formats, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing formats file:', error);
    return false;
  }
};

// Helper function to generate TSX template file from format data
const generateTemplateTSX = (format) => {
  const formatKey = format.format_key.toUpperCase();
  const hasCR = format.has_criminal_record;
  const formatName = format.name || 'Custom Format';
  const formatDesc = format.description || 'Auto-generated from Format Editor';
  const templateHtml = format.template_html || '';
  
  // Process the HTML template for print version - convert placeholders to template literals
  const processTemplateForPrint = (html) => {
    return html
      .replace(/\{\{FULL_NAME\}\}/g, '${fullName || "[FULL NAME]"}${formData.alias ? ` y ${formData.alias.toUpperCase()}` : ""}')
      .replace(/\{\{AGE\}\}/g, '${formData.age || "[AGE]"}')
      .replace(/\{\{CIVIL_STATUS\}\}/g, '${formData.civil_status || "[STATUS]"}')
      .replace(/\{\{NATIONALITY\}\}/g, '${formData.nationality || "Filipino"}')
      .replace(/\{\{ADDRESS\}\}/g, '${formData.address || "[ADDRESS]"}')
      .replace(/\{\{REQUESTER\}\}/g, '${formData.issued_upon_request_by || fullName || "[REQUESTER]"}')
      .replace(/\{\{PURPOSE\}\}/g, '${(formData.purpose === "Other" ? formData.custom_purpose : formData.purpose)?.toUpperCase() || "[PURPOSE]"}')
      .replace(/\{\{DAY\}\}/g, '${new Date(formData.date_issued).getDate()}')
      .replace(/\{\{DAY_SUFFIX\}\}/g, '${getOrdinalSuffix ? getOrdinalSuffix(new Date(formData.date_issued).getDate()) : ""}')
      .replace(/\{\{MONTH_YEAR\}\}/g, '${new Date(formData.date_issued).toLocaleDateString("en-US", { month: "long", year: "numeric" })}')
      .replace(/\{\{OR_NUMBER\}\}/g, '${generatedOR || formData.or_number || "[OR NUMBER]"}')
      .replace(/\{\{DATE_ISSUED\}\}/g, '${new Date(formData.date_issued).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}')
      .replace(/\{\{ISSUED_BY_NAME\}\}/g, '${formData.issued_by || "[ISSUED BY]"}')
      .replace(/\[ISSUED_BY_NAME\]/g, '${formData.issued_by || "[ISSUED BY]"}');
  };

  // Process the HTML template for preview version - convert placeholders to JSX expressions
  const processTemplateForPreview = (html) => {
    return html
      .replace(/\{\{FULL_NAME\}\}/g, '{fullName || "[FULL NAME]"}{formData.alias && ` y ${formData.alias.toUpperCase()}`}')
      .replace(/\{\{AGE\}\}/g, '{formData.age || "[AGE]"}')
      .replace(/\{\{CIVIL_STATUS\}\}/g, '{formData.civil_status || "[STATUS]"}')
      .replace(/\{\{NATIONALITY\}\}/g, '{formData.nationality || "Filipino"}')
      .replace(/\{\{ADDRESS\}\}/g, '{formData.address || "[ADDRESS]"}')
      .replace(/\{\{REQUESTER\}\}/g, '{formData.issued_upon_request_by || fullName || "[REQUESTER]"}')
      .replace(/\{\{PURPOSE\}\}/g, '{(formData.purpose === "Other" ? formData.custom_purpose : formData.purpose)?.toUpperCase() || "[PURPOSE]"}')
      .replace(/\{\{DAY\}\}/g, '{new Date(formData.date_issued).getDate()}')
      .replace(/\{\{DAY_SUFFIX\}\}/g, '{getOrdinalSuffix ? getOrdinalSuffix(new Date(formData.date_issued).getDate()) : ""}')
      .replace(/\{\{MONTH_YEAR\}\}/g, '{new Date(formData.date_issued).toLocaleDateString("en-US", { month: "long", year: "numeric" })}')
      .replace(/\{\{OR_NUMBER\}\}/g, '{generatedOR || formData.or_number || "[OR NUMBER]"}')
      .replace(/\{\{DATE_ISSUED\}\}/g, '{new Date(formData.date_issued).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}')
      .replace(/\{\{ISSUED_BY_NAME\}\}/g, '{formData.issued_by || "[ISSUED BY]"}')
      .replace(/\[ISSUED_BY_NAME\]/g, '{formData.issued_by || "[ISSUED BY]"}')
      .replace(/class=/g, 'className=');
  };

  const printTemplateContent = processTemplateForPrint(templateHtml);
  
  const templateContent = `/**
 * FORMAT ${formatKey} - ${formatName}
 * 
 * ${formatDesc}
 * Generated on: ${new Date().toISOString()}
 * 
 * This file is auto-generated by the Format Editor.
 * Changes made here will be overwritten when the format is updated in the editor.
 */

import React from 'react';
import { TemplateProps, PreviewTemplateProps } from './types';
import { getOrdinalSuffix } from './constants';

// ============================================
// PRINT TEMPLATE - Format ${formatKey}
// ============================================
export const getFormat${formatKey}PrintTemplate = (props: TemplateProps): string => {
  const { formData, fullName, generatedOR } = props;
  
  return \`
    <!-- Format ${formatKey} - ${hasCR ? 'With Criminal Record' : 'No Criminal Record'} -->
    ${printTemplateContent}
  \`;
};

// ============================================
// PREVIEW COMPONENT - Format ${formatKey}
// ============================================
export const Format${formatKey}Preview: React.FC<PreviewTemplateProps> = ({ formData, fullName, textColor, generatedOR, getOrdinalSuffix }) => {
  // Use dangerouslySetInnerHTML to render the template with dynamic data
  const getPreviewContent = () => {
    const content = \`${printTemplateContent}\`;
    return content;
  };

  return (
    <div dangerouslySetInnerHTML={{ __html: getPreviewContent() }} />
  );
};

export default {
  getPrintTemplate: getFormat${formatKey}PrintTemplate,
  Preview: Format${formatKey}Preview,
};
`;

  return templateContent;
};

// Helper function to write TSX template file
const writeTemplateTSXFile = (format) => {
  try {
    const formatKey = format.format_key.toUpperCase();
    const templatesDir = path.join(__dirname, 'src', 'pages', 'clearances', 'templates');
    
    // Ensure templates directory exists
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    const filePath = path.join(templatesDir, `Format${formatKey}.tsx`);
    const content = generateTemplateTSX(format);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Template file written: ${filePath}`);
    return true;
  } catch (error) {
    console.error('Error writing template TSX file:', error);
    return false;
  }
};

// Get all clearance formats
app.get("/api/formats", (req, res) => {
  try {
    const formats = readFormatsFromFile();
    res.json(formats);
  } catch (error) {
    console.error("Error fetching formats:", error);
    res.status(500).json({ message: "Failed to fetch formats" });
  }
});

// Get single format by ID
app.get("/api/formats/:id", (req, res) => {
  try {
    const formats = readFormatsFromFile();
    const format = formats.find(f => f.id === parseInt(req.params.id));
    
    if (!format) {
      return res.status(404).json({ message: "Format not found" });
    }
    
    res.json(format);
  } catch (error) {
    console.error("Error fetching format:", error);
    res.status(500).json({ message: "Failed to fetch format" });
  }
});

// Get format by key (A, B, C, D, etc.)
app.get("/api/formats/key/:key", (req, res) => {
  try {
    const formats = readFormatsFromFile();
    const format = formats.find(f => f.format_key.toUpperCase() === req.params.key.toUpperCase());
    
    if (!format) {
      return res.status(404).json({ message: "Format not found" });
    }
    
    res.json(format);
  } catch (error) {
    console.error("Error fetching format:", error);
    res.status(500).json({ message: "Failed to fetch format" });
  }
});

// Create new format
app.post("/api/formats", (req, res) => {
  try {
    const {
      name,
      format_key,
      description,
      template_html,
      styles,
      logo_url,
      has_criminal_record,
      is_family,
    } = req.body;

    // Validation
    if (!name || !format_key || !template_html) {
      return res.status(400).json({ message: "Name, format key, and template HTML are required" });
    }

    const formats = readFormatsFromFile();
    
    // Check for duplicate format_key
    if (formats.some(f => f.format_key.toUpperCase() === format_key.toUpperCase())) {
      return res.status(400).json({ message: "A format with this key already exists" });
    }

    // Generate new ID
    const maxId = formats.length > 0 ? Math.max(...formats.map(f => f.id)) : 0;
    const newId = maxId + 1;

    const newFormat = {
      id: newId,
      name,
      format_key: format_key.toUpperCase(),
      description: description || '',
      template_html,
      styles: styles || {
        fontFamily: 'Century Gothic, Arial, sans-serif',
        fontSize: '12pt',
        lineHeight: '1.4',
        marginTop: '0.25in',
        marginBottom: '0.25in',
        marginLeft: '0.2in',
        marginRight: '0.2in',
        textColor: '#000000',
      },
      logo_url: logo_url || '/images/logos/doj-seal.png',
      has_criminal_record: has_criminal_record || false,
      is_family: is_family || false,
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    formats.push(newFormat);
    
    if (writeFormatsToFile(formats)) {
      // Also create the TSX template file
      writeTemplateTSXFile(newFormat);
      res.status(201).json(newFormat);
    } else {
      res.status(500).json({ message: "Failed to save format" });
    }
  } catch (error) {
    console.error("Error creating format:", error);
    res.status(500).json({ message: "Failed to create format" });
  }
});

// Update existing format
app.put("/api/formats/:id", (req, res) => {
  try {
    const formatId = parseInt(req.params.id);
    const {
      name,
      format_key,
      description,
      template_html,
      styles,
      logo_url,
      has_criminal_record,
      is_family,
    } = req.body;

    const formats = readFormatsFromFile();
    const formatIndex = formats.findIndex(f => f.id === formatId);
    
    if (formatIndex === -1) {
      return res.status(404).json({ message: "Format not found" });
    }

    // Check for duplicate format_key (excluding current format)
    if (format_key && formats.some(f => f.id !== formatId && f.format_key.toUpperCase() === format_key.toUpperCase())) {
      return res.status(400).json({ message: "A format with this key already exists" });
    }

    // Update format
    formats[formatIndex] = {
      ...formats[formatIndex],
      name: name || formats[formatIndex].name,
      format_key: format_key ? format_key.toUpperCase() : formats[formatIndex].format_key,
      description: description !== undefined ? description : formats[formatIndex].description,
      template_html: template_html || formats[formatIndex].template_html,
      styles: styles || formats[formatIndex].styles,
      logo_url: logo_url || formats[formatIndex].logo_url,
      has_criminal_record: has_criminal_record !== undefined ? has_criminal_record : formats[formatIndex].has_criminal_record,
      is_family: is_family !== undefined ? is_family : formats[formatIndex].is_family,
      updated_at: new Date().toISOString(),
    };

    // Write formats file
    const filesWritten = writeFormatsToFile(formats);
    if (!filesWritten) {
      return res.status(500).json({ message: "Failed to save format to file" });
    }

    // Also sync the TSX template file
    const templateWritten = writeTemplateTSXFile(formats[formatIndex]);
    if (!templateWritten) {
      console.warn(`Warning: Template file write failed for Format ${formats[formatIndex].format_key}, but format was saved`);
    }
    
    res.json(formats[formatIndex]);
  } catch (error) {
    console.error("Error updating format:", error);
    res.status(500).json({ message: "Failed to update format: " + error.message });
  }
});

// Delete format
app.delete("/api/formats/:id", (req, res) => {
  try {
    const formatId = parseInt(req.params.id);
    const formats = readFormatsFromFile();
    
    const formatIndex = formats.findIndex(f => f.id === formatId);
    
    if (formatIndex === -1) {
      return res.status(404).json({ message: "Format not found" });
    }

    // Don't allow deleting default formats
    if (formats[formatIndex].is_default) {
      return res.status(400).json({ message: "Cannot delete default formats" });
    }

    formats.splice(formatIndex, 1);

    if (writeFormatsToFile(formats)) {
      res.json({ message: "Format deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete format" });
    }
  } catch (error) {
    console.error("Error deleting format:", error);
    res.status(500).json({ message: "Failed to delete format" });
  }
});

// Configure multer for logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const logoDir = path.join(__dirname, 'public', 'images', 'logos');
    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true });
    }
    cb(null, logoDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Upload logo endpoint
app.post("/api/formats/upload-logo", logoUpload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const logoUrl = `/images/logos/${req.file.filename}`;
    res.json({ url: logoUrl, filename: req.file.filename });
  } catch (error) {
    console.error("Error uploading logo:", error);
    res.status(500).json({ message: "Failed to upload logo" });
  }
});

// Serve static files from public directory for logos
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Test endpoint to verify security middleware is active
app.get('/api/security-test', authMiddleware, adminOnly, (req, res) => {
  res.json({ success: true, message: 'Security middleware is active!' });
});

// =====================================================
// IP WHITELIST MANAGEMENT API ENDPOINTS  
// =====================================================

// Get current IP whitelist information
app.get('/api/admin/ip-whitelist', authMiddleware, adminOnly, (req, res) => {
  try {
    const whitelistInfo = getWhitelistInfo();
    const clientIP = getRealIP(req);
    
    res.json({
      success: true,
      data: {
        ...whitelistInfo,
        yourCurrentIP: clientIP
      }
    });
  } catch (error) {
    console.error('Error getting whitelist info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get whitelist information'
    });
  }
});

// Add IP to whitelist
app.post('/api/admin/ip-whitelist/add', authMiddleware, adminOnly, (req, res) => {
  try {
    const { ip, description } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }
    
    // Basic IP validation
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipPattern.test(ip)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IP address format'
      });
    }
    
    const { addIPToWhitelist } = require('./middleware/ipWhitelist');
    const added = addIPToWhitelist(ip);
    
    if (added) {
      // Log the action
      securityLogger.log('IP_WHITELIST_ADD', {
        adminUser: req.user.username,
        addedIP: ip,
        description: description || 'No description',
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: `IP ${ip} added to whitelist successfully`,
        data: { ip, description }
      });
    } else {
      res.status(409).json({
        success: false,
        message: `IP ${ip} already exists in whitelist`
      });
    }
  } catch (error) {
    console.error('Error adding IP to whitelist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add IP to whitelist'
    });
  }
});

// Remove IP from whitelist
app.delete('/api/admin/ip-whitelist/:ip', authMiddleware, adminOnly, (req, res) => {
  try {
    const ip = decodeURIComponent(req.params.ip);
    
    const { removeIPFromWhitelist } = require('./middleware/ipWhitelist');
    const removed = removeIPFromWhitelist(ip);
    
    if (removed) {
      // Log the action
      securityLogger.log('IP_WHITELIST_REMOVE', {
        adminUser: req.user.username,
        removedIP: ip,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: `IP ${ip} removed from whitelist successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        message: `IP ${ip} not found in whitelist`
      });
    }
  } catch (error) {
    console.error('Error removing IP from whitelist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove IP from whitelist'
    });
  }
});

// Get current client IP (helpful for users to know their IP)
app.get('/api/my-ip', (req, res) => {
  const clientIP = getRealIP(req);
  res.json({
    success: true,
    data: {
      ip: clientIP,
      timestamp: new Date().toISOString()
    }
  });
});

// =====================================================
// END IP WHITELIST MANAGEMENT API ENDPOINTS
// =====================================================

// =====================================================
// END FORMAT MANAGEMENT API ENDPOINTS
// =====================================================

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error('Another backend instance is likely already running.');
    console.error(`Use this command to check: netstat -ano | findstr :${PORT}`);
    return process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("📡 Socket.io real-time updates enabled");

  if (!isDbConnectionReady()) {
    console.log("ℹ️ Skipping initial Excel generation until DB connection is ready.");
  }
});

// ==================== EXCEL EXPORT ENDPOINTS ====================

// Download Excel file (auto-downloads to user's computer)
app.get("/download-excel", (req, res) => {
  if (!isDbConnectionReady()) {
    return res.status(503).json({ error: 'Database is not connected. Start XAMPP MySQL first.' });
  }

  // First, regenerate the Excel file with latest data
  exportCasesToExcel()
    .then(() => {
      // Check if file exists
      if (!fs.existsSync(EXCEL_FILE_PATH)) {
        return res.status(404).json({ error: 'Excel file not found' });
      }
      
      // Set headers for download
      res.setHeader('Content-Disposition', 'attachment; filename="cases.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      // Send file
      res.sendFile(EXCEL_FILE_PATH);
    })
    .catch(err => {
      console.error("Error generating Excel for download:", err);
      res.status(500).json({ error: 'Failed to generate Excel file' });
    });
});

// Manually trigger Excel sync (useful for bulk operations)
app.post("/sync-excel", (req, res) => {
  if (!isDbConnectionReady()) {
    return res.status(503).json({ success: false, error: 'Database is not connected. Start XAMPP MySQL first.' });
  }

  exportCasesToExcel()
    .then(() => {
      res.json({ 
        success: true, 
        message: "Excel file synced successfully",
        filePath: "/uploads/cases.xlsx"
      });
    })
    .catch(err => {
      console.error("Error syncing Excel:", err);
      res.status(500).json({ success: false, error: 'Failed to sync Excel file' });
    });
});

// Get Excel file info
app.get("/excel-info", (req, res) => {
  if (fs.existsSync(EXCEL_FILE_PATH)) {
    const stats = fs.statSync(EXCEL_FILE_PATH);
    res.json({
      exists: true,
      filePath: "/uploads/cases.xlsx",
      lastModified: stats.mtime,
      size: stats.size
    });
  } else {
    res.json({ exists: false });
  }
});

// Bulk update/insert from Excel
app.post("/bulk-update-cases", express.json(), (req, res) => {
  const { cases } = req.body;
  
  if (!cases || !Array.isArray(cases)) {
    return res.status(400).json({ success: false, message: "Invalid data format" });
  }
  
  let updatedCount = 0;
  let insertedCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // Map Excel column names to database columns
  const columnMap = {
    'Docket No': 'DOCKET_NO',
    'Date Filed': 'DATE_FILED',
    'Complainant': 'COMPLAINANT',
    'Respondent': 'RESPONDENT',
    'Offense': 'OFFENSE',
    'Date Resolved': 'DATE_RESOLVED',
    'Resolving Prosecutor': 'RESOLVING_PROSECUTOR',
    'Criminal Case No': 'CRIM_CASE_NO',
    'Branch': 'BRANCH',
    'Date Filed in Court': 'DATEFILED_IN_COURT',
    'Remarks': 'REMARKS',
    'Remarks Decision': 'REMARKS_DECISION',
    'Penalty': 'PENALTY',
    'Decision Date': 'DECISION_DATE',
    'Index Cards': 'INDEX_CARDS'
  };
  
  // Process each case - using DOCKET_NO as unique identifier to prevent duplicates
  const processCase = (caseData, index) => {
    return new Promise((resolve) => {
      const { ID, ...fields } = caseData;
      
      // Get mapped values
      const mappedData = {};
      Object.keys(fields).forEach(key => {
        const dbColumn = columnMap[key];
        if (dbColumn && fields[key] !== undefined && fields[key] !== '') {
          mappedData[dbColumn] = fields[key];
        }
      });
      
      // Must have DOCKET_NO to process
      if (!mappedData.DOCKET_NO) {
        errors.push(`Row ${index + 1}: Missing Docket No - skipped`);
        errorCount++;
        return resolve();
      }
      
      const docketNo = mappedData.DOCKET_NO;
      
      // First, check if a case with this DOCKET_NO already exists (and is not deleted)
      db.query('SELECT id FROM cases WHERE DOCKET_NO = ?', [docketNo], (err, existingRows) => {
        if (err) {
          console.error(`Error checking existing case:`, err);
          errors.push(`Row ${index + 1}: Database error`);
          errorCount++;
          return resolve();
        }
        
        if (existingRows.length > 0) {
          // Case exists - UPDATE it (use the found ID, not the one from Excel)
          const existingId = existingRows[0].id;
          const updateFields = [];
          const values = [];
          
          Object.keys(mappedData).forEach(col => {
            updateFields.push(`${col} = ?`);
            values.push(mappedData[col]);
          });
          
          if (updateFields.length === 0) {
            updatedCount++;
            return resolve();
          }
          
          const updateQuery = `UPDATE cases SET ${updateFields.join(', ')} WHERE id = ?`;
          values.push(existingId);
          
          db.query(updateQuery, values, (err, result) => {
            if (err) {
              console.error(`Error updating case (Docket: ${docketNo}):`, err);
              errors.push(`Row ${index + 1} (Docket ${docketNo}): ${err.message}`);
              errorCount++;
            } else {
              updatedCount++;
            }
            resolve();
          });
        } else {
          // Case doesn't exist - INSERT new one
          const columns = Object.keys(mappedData);
          const placeholders = columns.map(() => '?').join(', ');
          const values = columns.map(col => mappedData[col]);
          
          const insertQuery = `INSERT INTO cases (${columns.join(', ')}) VALUES (${placeholders})`;
          
          db.query(insertQuery, values, (err, result) => {
            if (err) {
              console.error(`Error inserting new case:`, err);
              errors.push(`Row ${index + 1}: ${err.message}`);
              errorCount++;
            } else {
              console.log(`Inserted new case (Docket: ${docketNo}) with ID: ${result.insertId}`);
              insertedCount++;
            }
            resolve();
          });
        }
      });
    });
  };
  
  // Process cases sequentially to avoid race conditions
  const processAllCases = async () => {
    for (let i = 0; i < cases.length; i++) {
      await processCase(cases[i], i);
    }
  };
  
  processAllCases().then(() => {
    // Sync Excel file after bulk operations
    exportCasesToExcel()
      .then(() => {
        console.log(`Bulk operation completed: ${updatedCount} updated, ${insertedCount} inserted, ${errorCount} errors`);
      })
      .catch(err => {
        console.error("Error syncing Excel after bulk operation:", err);
      });
    
    res.json({
      success: errorCount === 0,
      message: `Updated ${updatedCount}, Added ${insertedCount} cases${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
      updatedCount,
      insertedCount,
      errorCount,
      errors: errorCount > 0 ? errors : undefined
    });
  });
});

// CSV endpoint for Excel Power Query - Excel can refresh from this URL
app.get("/cases-csv", (req, res) => {
  const query = `SELECT 
    id AS ID,
    DOCKET_NO AS 'Docket No',
    DATE_FILED AS 'Date Filed',
    COMPLAINANT AS 'Complainant',
    RESPONDENT AS 'Respondent',
    OFFENSE AS 'Offense',
    DATE_RESOLVED AS 'Date Resolved',
    RESOLVING_PROSECUTOR AS 'Resolving Prosecutor',
    CRIM_CASE_NO AS 'Criminal Case No',
    BRANCH AS 'Branch',
    DATEFILED_IN_COURT AS 'Date Filed in Court',
    REMARKS AS 'Remarks',
    REMARKS_DECISION AS 'Remarks Decision',
    PENALTY AS 'Penalty',
    DECISION_DATE AS 'Decision Date',
    INDEX_CARDS AS 'Index Cards'
  FROM cases ORDER BY id ASC`;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching cases for CSV:", err);
      return res.status(500).send("Database error");
    }
    
    // Format dates
    const formattedResults = results.map(row => {
      const formattedRow = { ...row };
      if (formattedRow['Date Filed']) formattedRow['Date Filed'] = new Date(formattedRow['Date Filed']).toLocaleDateString('en-CA');
      if (formattedRow['Date Resolved']) formattedRow['Date Resolved'] = new Date(formattedRow['Date Resolved']).toLocaleDateString('en-CA');
      if (formattedRow['Date Filed in Court']) formattedRow['Date Filed in Court'] = new Date(formattedRow['Date Filed in Court']).toLocaleDateString('en-CA');
      return formattedRow;
    });
    
    // Convert to CSV
    if (formattedResults.length === 0) {
      return res.type('text/csv').send('No data');
    }
    
    const headers = Object.keys(formattedResults[0]);
    const csvRows = [headers.join(',')];
    
    formattedResults.forEach(row => {
      const values = headers.map(h => {
        const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
        // Escape quotes and wrap in quotes if contains comma or quote
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvRows.push(values.join(','));
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(csvRows.join('\n'));
  });
});

// ==================== EXCEL IMPORT/EXPORT ENDPOINTS ====================

// Download Excel file with all current cases
app.get("/api/excel/download", async (req, res) => {
  try {
    // Generate fresh Excel file with current data
    await exportCasesToExcel();
    
    // Check if file exists
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      return res.status(404).json({ error: 'Excel file not found' });
    }
    
    // Send file for download
    res.download(EXCEL_FILE_PATH, 'cases.xlsx', (err) => {
      if (err) {
        console.error("Error downloading Excel file:", err);
        res.status(500).json({ error: 'Error downloading file' });
      }
    });
  } catch (error) {
    console.error("Error exporting cases to Excel:", error);
    res.status(500).json({ error: 'Error exporting cases' });
  }
});

// Upload Excel file to import/update cases
const excelUpload = multer({
  dest: path.join(__dirname, 'uploads', 'temp'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'));
  }
});

app.post("/api/excel/upload", excelUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Read the uploaded Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      fs.unlinkSync(req.file.path); // Clean up
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    // Helper function to convert Excel serial date to MySQL date format
    const excelDateToMySQLDate = (excelDate) => {
      if (!excelDate) return null;
      
      // If it's already a string date, try to parse and format it
      if (typeof excelDate === 'string') {
        // Check if it's already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
          return excelDate;
        }
        // Try parsing other date formats
        const parsed = new Date(excelDate);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0];
        }
        return null;
      }
      
      // If it's a number, treat it as Excel serial date
      if (typeof excelDate === 'number') {
        // Excel serial date: days since 1899-12-30 (Excel's epoch)
        // Note: Excel incorrectly considers 1900 a leap year, so we adjust
        const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
        const date = new Date(excelEpoch.getTime() + excelDate * 86400000);
        
        // Format as YYYY-MM-DD for MySQL
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      return null;
    };

    // Helper function to find column value with flexible matching
    const getColumnValue = (row, possibleNames) => {
      for (let name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return row[name];
        }
      }
      return null;
    };

    // Helper function to get date column value with Excel date conversion
    const getDateColumnValue = (row, possibleNames) => {
      const value = getColumnValue(row, possibleNames);
      return excelDateToMySQLDate(value);
    };

    const parseArrayField = (value) => {
      if (value === null || value === undefined) return [];
      const raw = String(value).trim();
      if (!raw || raw.toLowerCase() === 'n/a') return [];

      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
            .filter(Boolean);
        }
      } catch {
        // Not JSON; treat as plain string.
      }

      const split = raw
        .split(/\r?\n+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.replace(/^\d+[.)]\s*/, '').trim())
        .filter(Boolean);

      return split.length > 0 ? split : [raw];
    };

    const normalizeText = (value) => (value || '').toString().trim();
    const normalizeCaseInsensitive = (value) => normalizeText(value).toLowerCase();
    const respondentKey = (name, address, index = 0) => {
      const normalizedName = normalizeCaseInsensitive(name);
      if (normalizedName) return normalizedName;

      const normalizedAddress = normalizeCaseInsensitive(address);
      if (normalizedAddress) return `__addr__${normalizedAddress}`;

      return `__empty__${index}`;
    };

    const collapseRespondentRows = ({
      respondents,
      addresses,
      recommendations,
      crimNos,
      branches,
      courtDates,
      finalOffenses
    }) => {
      const nextRespondents = [];
      const nextAddresses = [];
      const nextRecommendations = [];
      const nextCrimNos = [];
      const nextBranches = [];
      const nextCourtDates = [];
      const nextFinalOffenses = [];
      const keyToIndex = new Map();

      for (let idx = 0; idx < respondents.length; idx++) {
        const key = respondentKey(respondents[idx], addresses[idx], idx);
        if (!keyToIndex.has(key)) {
          keyToIndex.set(key, nextRespondents.length);
          nextRespondents.push(respondents[idx] || '');
          nextAddresses.push(addresses[idx] || '');
          nextRecommendations.push(recommendations[idx] || 'Pending');
          nextCrimNos.push(crimNos[idx] || '');
          nextBranches.push(branches[idx] || '');
          nextCourtDates.push(courtDates[idx] || '');
          nextFinalOffenses.push(finalOffenses[idx] || '');
          continue;
        }

        const targetIndex = keyToIndex.get(key);
        if (normalizeText(respondents[idx])) nextRespondents[targetIndex] = respondents[idx];
        if (normalizeText(addresses[idx])) nextAddresses[targetIndex] = addresses[idx];
        if (normalizeText(recommendations[idx])) nextRecommendations[targetIndex] = recommendations[idx];
        if (normalizeText(crimNos[idx])) nextCrimNos[targetIndex] = crimNos[idx];
        if (normalizeText(branches[idx])) nextBranches[targetIndex] = branches[idx];
        if (normalizeText(courtDates[idx])) nextCourtDates[targetIndex] = courtDates[idx];
        if (normalizeText(finalOffenses[idx])) nextFinalOffenses[targetIndex] = finalOffenses[idx];
      }

      return {
        respondents: nextRespondents,
        addresses: nextAddresses,
        recommendations: nextRecommendations,
        crimNos: nextCrimNos,
        branches: nextBranches,
        courtDates: nextCourtDates,
        finalOffenses: nextFinalOffenses
      };
    };

    let added = 0;
    let updated = 0;
    let errors = [];
    let warnings = [];

    // Check for common column name issues
    const firstRow = data[0];
    const columnNames = Object.keys(firstRow);
    const commonIssues = {
      'Date Filing': 'Date Filed',
      'Respondents': 'Respondent',
      'Complainants': 'Complainant',
      'Offenses': 'Offense',
      'Address of Respondents': 'Address of Respondent'
    };

    for (let wrongName in commonIssues) {
      if (columnNames.includes(wrongName)) {
        warnings.push(`Column "${wrongName}" detected - should be "${commonIssues[wrongName]}". Attempting to process anyway.`);
      }
    }

    // Build grouped payloads by docket number so multiple rows with the same docket
    // become one case containing per-respondent arrays.
    const groupedByDocket = new Map();
    let lastSeenDocketNo = '';

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        const rowData = {
          DOCKET_NO: normalizeText(getColumnValue(row, ['Docket No', 'DOCKET_NO', 'Docket Number', 'DocketNo']) || ''),
          DATE_FILED: getDateColumnValue(row, ['Date Filed', 'DATE_FILED', 'Date Filing', 'DateFiled']),
          COMPLAINANT: getColumnValue(row, ['Complainant', 'COMPLAINANT', 'Complainants']) || '',
          RESPONDENT: getColumnValue(row, ['Respondent', 'RESPONDENT', 'Respondents']) || '',
          ADDRESS_OF_RESPONDENT: getColumnValue(row, ['Address of Respondent', 'ADDRESS_OF_RESPONDENT', 'Address of Respondents', 'Respondent Address']) || '',
          OFFENSE: getColumnValue(row, ['Offense', 'OFFENSE', 'Offenses']) || '',
          DATE_OF_COMMISSION: getDateColumnValue(row, ['Date of Commission', 'DATE_OF_COMMISSION', 'Commission Date']),
          DATE_RESOLVED: getDateColumnValue(row, ['Date Resolved', 'DATE_RESOLVED', 'Resolution Date']),
          RESOLVING_PROSECUTOR: getColumnValue(row, ['Resolving Prosecutor', 'RESOLVING_PROSECUTOR', 'Prosecutor']) || '',
          CRIM_CASE_NO: getColumnValue(row, ['Criminal Case No', 'CRIM_CASE_NO', 'Case Number', 'Case No']) || '',
          BRANCH: getColumnValue(row, ['Branch', 'BRANCH']) || '',
          DATEFILED_IN_COURT: getDateColumnValue(row, ['Date Filed in Court', 'DATEFILED_IN_COURT', 'Court Filing Date']),
          FINAL_OFFENSE: getColumnValue(row, ['Final Offense', 'FINAL_OFFENSE', 'FinalOffense']) || '',
          REMARKS_DECISION: getColumnValue(row, ['Remarks Decision', 'REMARKS_DECISION', 'Decision', 'Remarks']) || '',
          PENALTY: getColumnValue(row, ['Penalty', 'PENALTY']) || '',
          DECISION_DATE: getDateColumnValue(row, ['Decision Date', 'DECISION_DATE', 'DecisionDate']),
          INDEX_CARDS: getColumnValue(row, ['Index Cards', 'INDEX_CARDS', 'IndexCards']) || 'N/A'
        };

        // Excel files often leave repeated docket cells blank for subsequent respondent rows.
        if (!rowData.DOCKET_NO && lastSeenDocketNo) {
          rowData.DOCKET_NO = lastSeenDocketNo;
        }

        if (!rowData.DOCKET_NO) {
          errors.push(`Row ${i + 2}: Missing Docket Number`);
          continue;
        }

        lastSeenDocketNo = rowData.DOCKET_NO;

        if (!groupedByDocket.has(rowData.DOCKET_NO)) {
          groupedByDocket.set(rowData.DOCKET_NO, {
            DOCKET_NO: rowData.DOCKET_NO,
            DATE_FILED: rowData.DATE_FILED || null,
            COMPLAINANT: [],
            OFFENSE: normalizeText(rowData.OFFENSE),
            DATE_OF_COMMISSION: rowData.DATE_OF_COMMISSION,
            DATE_RESOLVED: rowData.DATE_RESOLVED,
            RESOLVING_PROSECUTOR: normalizeText(rowData.RESOLVING_PROSECUTOR),
            PENALTY: normalizeText(rowData.PENALTY),
            DECISION_DATE: rowData.DECISION_DATE,
            INDEX_CARDS: normalizeText(rowData.INDEX_CARDS) || 'N/A',
            respondentRows: []
          });
        }

        const bucket = groupedByDocket.get(rowData.DOCKET_NO);

        parseArrayField(rowData.COMPLAINANT).forEach((name) => {
          if (!bucket.COMPLAINANT.some((c) => normalizeCaseInsensitive(c) === normalizeCaseInsensitive(name))) {
            bucket.COMPLAINANT.push(name);
          }
        });

        if (rowData.DATE_FILED) bucket.DATE_FILED = rowData.DATE_FILED;
        if (normalizeText(rowData.OFFENSE)) bucket.OFFENSE = normalizeText(rowData.OFFENSE);
        if (rowData.DATE_OF_COMMISSION) bucket.DATE_OF_COMMISSION = rowData.DATE_OF_COMMISSION;
        if (rowData.DATE_RESOLVED) bucket.DATE_RESOLVED = rowData.DATE_RESOLVED;
        if (normalizeText(rowData.RESOLVING_PROSECUTOR)) bucket.RESOLVING_PROSECUTOR = normalizeText(rowData.RESOLVING_PROSECUTOR);
        if (normalizeText(rowData.PENALTY)) bucket.PENALTY = normalizeText(rowData.PENALTY);
        if (rowData.DECISION_DATE) bucket.DECISION_DATE = rowData.DECISION_DATE;
        if (normalizeText(rowData.INDEX_CARDS)) bucket.INDEX_CARDS = normalizeText(rowData.INDEX_CARDS);

        const respondents = parseArrayField(rowData.RESPONDENT);
        const addresses = parseArrayField(rowData.ADDRESS_OF_RESPONDENT);
        const recs = parseArrayField(rowData.REMARKS_DECISION);
        const crimNos = parseArrayField(rowData.CRIM_CASE_NO);
        const branches = parseArrayField(rowData.BRANCH);
        const courtDates = parseArrayField(rowData.DATEFILED_IN_COURT);
        const finalOffenses = parseArrayField(rowData.FINAL_OFFENSE);

        const respondentCount = Math.max(respondents.length, addresses.length, recs.length, crimNos.length, branches.length, courtDates.length, finalOffenses.length, 1);

        for (let idx = 0; idx < respondentCount; idx++) {
          const respondentName = normalizeText(respondents[idx] || respondents[0] || rowData.RESPONDENT || '');
          const respondentAddress = normalizeText(addresses[idx] || addresses[0] || rowData.ADDRESS_OF_RESPONDENT || '');

          bucket.respondentRows.push({
            respondent: respondentName,
            address: respondentAddress,
            recommendation: normalizeText(recs[idx] || recs[0] || rowData.REMARKS_DECISION || 'Pending') || 'Pending',
            crimCaseNo: normalizeText(crimNos[idx] || crimNos[0] || rowData.CRIM_CASE_NO || ''),
            branch: normalizeText(branches[idx] || branches[0] || rowData.BRANCH || ''),
            dateFiledInCourt: normalizeText(courtDates[idx] || courtDates[0] || rowData.DATEFILED_IN_COURT || ''),
            finalOffense: normalizeText(finalOffenses[idx] || finalOffenses[0] || rowData.FINAL_OFFENSE || '')
          });
        }

        console.log(`Row ${i + 2} prepared for docket ${rowData.DOCKET_NO}`);
      } catch (rowError) {
        console.error(`Row ${i + 2} error:`, rowError.message);
        errors.push(`Row ${i + 2}: ${rowError.message}`);
      }
    }

    for (const docketPayload of groupedByDocket.values()) {
      const checkQuery = "SELECT * FROM cases WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))";

      const existingRows = await new Promise((resolve, reject) => {
        db.query(checkQuery, [docketPayload.DOCKET_NO], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (!docketPayload.DATE_FILED && (!existingRows || existingRows.length === 0)) {
        errors.push(`Docket ${docketPayload.DOCKET_NO}: Missing or invalid Date Filed`);
        continue;
      }

      const importedRespondents = [];
      const importedAddresses = [];
      const importedRecommendations = [];
      const importedCrimNos = [];
      const importedBranches = [];
      const importedCourtDates = [];
      const importedFinalOffenses = [];

      const importedKeyToIndex = new Map();
      docketPayload.respondentRows.forEach((entry, idx) => {
        const key = respondentKey(entry.respondent, entry.address, idx);
        if (!importedKeyToIndex.has(key)) {
          importedKeyToIndex.set(key, importedRespondents.length);
          importedRespondents.push(entry.respondent);
          importedAddresses.push(entry.address);
          importedRecommendations.push(entry.recommendation || 'Pending');
          importedCrimNos.push(entry.crimCaseNo || '');
          importedBranches.push(entry.branch || '');
          importedCourtDates.push(entry.dateFiledInCourt || '');
          importedFinalOffenses.push(entry.finalOffense || '');
        } else {
          const existingIndex = importedKeyToIndex.get(key);
          if (entry.respondent) importedRespondents[existingIndex] = entry.respondent;
          if (entry.address) importedAddresses[existingIndex] = entry.address;
          if (entry.recommendation) importedRecommendations[existingIndex] = entry.recommendation;
          if (entry.crimCaseNo) importedCrimNos[existingIndex] = entry.crimCaseNo;
          if (entry.branch) importedBranches[existingIndex] = entry.branch;
          if (entry.dateFiledInCourt) importedCourtDates[existingIndex] = entry.dateFiledInCourt;
          if (entry.finalOffense) importedFinalOffenses[existingIndex] = entry.finalOffense;
        }
      });

      if (existingRows.length > 0) {
        const existingCase = existingRows[0];

        const mergedComplainants = parseArrayField(existingCase.COMPLAINANT);
        docketPayload.COMPLAINANT.forEach((name) => {
          if (!mergedComplainants.some((c) => normalizeCaseInsensitive(c) === normalizeCaseInsensitive(name))) {
            mergedComplainants.push(name);
          }
        });

        let mergedRespondents = parseArrayField(existingCase.RESPONDENT);
        let mergedAddresses = parseArrayField(existingCase.ADDRESS_OF_RESPONDENT);
        let mergedRecommendations = parseArrayField(existingCase.REMARKS_DECISION);
        let mergedCrimNos = parseArrayField(existingCase.CRIM_CASE_NO);
        let mergedBranches = parseArrayField(existingCase.BRANCH);
        let mergedCourtDates = parseArrayField(existingCase.DATEFILED_IN_COURT);
        let mergedFinalOffenses = parseArrayField(existingCase.FINAL_OFFENSE);

        while (mergedAddresses.length < mergedRespondents.length) mergedAddresses.push('');
        while (mergedRecommendations.length < mergedRespondents.length) mergedRecommendations.push('Pending');
        while (mergedCrimNos.length < mergedRespondents.length) mergedCrimNos.push('');
        while (mergedBranches.length < mergedRespondents.length) mergedBranches.push('');
        while (mergedCourtDates.length < mergedRespondents.length) mergedCourtDates.push('');
        while (mergedFinalOffenses.length < mergedRespondents.length) mergedFinalOffenses.push('');

        const collapsed = collapseRespondentRows({
          respondents: mergedRespondents,
          addresses: mergedAddresses,
          recommendations: mergedRecommendations,
          crimNos: mergedCrimNos,
          branches: mergedBranches,
          courtDates: mergedCourtDates,
          finalOffenses: mergedFinalOffenses
        });

        mergedRespondents = collapsed.respondents;
        mergedAddresses = collapsed.addresses;
        mergedRecommendations = collapsed.recommendations;
        mergedCrimNos = collapsed.crimNos;
        mergedBranches = collapsed.branches;
        mergedCourtDates = collapsed.courtDates;
        mergedFinalOffenses = collapsed.finalOffenses;

        const mergedKeyToIndex = new Map();
        for (let idx = 0; idx < mergedRespondents.length; idx++) {
          mergedKeyToIndex.set(respondentKey(mergedRespondents[idx], mergedAddresses[idx], idx), idx);
        }

        for (let idx = 0; idx < importedRespondents.length; idx++) {
          const key = respondentKey(importedRespondents[idx], importedAddresses[idx], idx);
          if (mergedKeyToIndex.has(key)) {
            const target = mergedKeyToIndex.get(key);
            mergedRespondents[target] = importedRespondents[idx] || mergedRespondents[target];
            mergedAddresses[target] = importedAddresses[idx] || mergedAddresses[target] || '';
            mergedRecommendations[target] = importedRecommendations[idx] || mergedRecommendations[target] || 'Pending';
            mergedCrimNos[target] = importedCrimNos[idx] || mergedCrimNos[target] || '';
            mergedBranches[target] = importedBranches[idx] || mergedBranches[target] || '';
            mergedCourtDates[target] = importedCourtDates[idx] || mergedCourtDates[target] || '';
            mergedFinalOffenses[target] = importedFinalOffenses[idx] || mergedFinalOffenses[target] || '';
          } else {
            mergedKeyToIndex.set(key, mergedRespondents.length);
            mergedRespondents.push(importedRespondents[idx]);
            mergedAddresses.push(importedAddresses[idx] || '');
            mergedRecommendations.push(importedRecommendations[idx] || 'Pending');
            mergedCrimNos.push(importedCrimNos[idx] || '');
            mergedBranches.push(importedBranches[idx] || '');
            mergedCourtDates.push(importedCourtDates[idx] || '');
            mergedFinalOffenses.push(importedFinalOffenses[idx] || '');
          }
        }

        const computedStatus = mergedRecommendations.some((decision) => normalizeCaseInsensitive(decision) === 'filed in court')
          ? 'Filed in Court'
          : (existingCase.STATUS || null);

        const updateQuery = `UPDATE cases SET 
          DATE_FILED = ?, COMPLAINANT = ?, RESPONDENT = ?, 
          ADDRESS_OF_RESPONDENT = ?, OFFENSE = ?, DATE_OF_COMMISSION = ?,
          DATE_RESOLVED = ?, RESOLVING_PROSECUTOR = ?, 
          CRIM_CASE_NO = ?, BRANCH = ?, DATEFILED_IN_COURT = ?, 
          FINAL_OFFENSE = ?, REMARKS_DECISION = ?, PENALTY = ?, DECISION_DATE = ?, INDEX_CARDS = ?, STATUS = ?
          WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))`;

        await new Promise((resolve, reject) => {
          db.query(updateQuery, [
            docketPayload.DATE_FILED || existingCase.DATE_FILED,
            JSON.stringify(mergedComplainants),
            JSON.stringify(mergedRespondents),
            JSON.stringify(mergedAddresses),
            docketPayload.OFFENSE || existingCase.OFFENSE || '',
            docketPayload.DATE_OF_COMMISSION || existingCase.DATE_OF_COMMISSION || null,
            docketPayload.DATE_RESOLVED || existingCase.DATE_RESOLVED || null,
            docketPayload.RESOLVING_PROSECUTOR || existingCase.RESOLVING_PROSECUTOR || '',
            JSON.stringify(mergedCrimNos),
            JSON.stringify(mergedBranches),
            JSON.stringify(mergedCourtDates),
            JSON.stringify(mergedFinalOffenses),
            JSON.stringify(mergedRecommendations),
            docketPayload.PENALTY || existingCase.PENALTY || '',
            docketPayload.DECISION_DATE || existingCase.DECISION_DATE || null,
            docketPayload.INDEX_CARDS || existingCase.INDEX_CARDS || 'N/A',
            computedStatus,
            docketPayload.DOCKET_NO
          ], (updateErr) => {
            if (updateErr) reject(updateErr);
            else resolve();
          });
        });

        updated++;
      } else {
        const insertedComplainants = docketPayload.COMPLAINANT;
        const computedStatus = importedRecommendations.some((decision) => normalizeCaseInsensitive(decision) === 'filed in court')
          ? 'Filed in Court'
          : null;

        const insertQuery = `INSERT INTO cases 
          (DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, ADDRESS_OF_RESPONDENT,
          OFFENSE, DATE_OF_COMMISSION, DATE_RESOLVED, RESOLVING_PROSECUTOR, 
          CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, FINAL_OFFENSE, REMARKS_DECISION, PENALTY, DECISION_DATE, INDEX_CARDS, STATUS) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await new Promise((resolve, reject) => {
          db.query(insertQuery, [
            docketPayload.DOCKET_NO,
            docketPayload.DATE_FILED,
            JSON.stringify(insertedComplainants),
            JSON.stringify(importedRespondents),
            JSON.stringify(importedAddresses),
            docketPayload.OFFENSE || '',
            docketPayload.DATE_OF_COMMISSION || null,
            docketPayload.DATE_RESOLVED || null,
            docketPayload.RESOLVING_PROSECUTOR || '',
            JSON.stringify(importedCrimNos),
            JSON.stringify(importedBranches),
            JSON.stringify(importedCourtDates),
            JSON.stringify(importedFinalOffenses),
            JSON.stringify(importedRecommendations),
            docketPayload.PENALTY || '',
            docketPayload.DECISION_DATE || null,
            docketPayload.INDEX_CARDS || 'N/A',
            computedStatus
          ], (insertErr) => {
            if (insertErr) reject(insertErr);
            else resolve();
          });
        });

        added++;
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Sync Excel file with updated database
    await exportCasesToExcel();

    res.json({
      success: true,
      message: `Import completed: ${added} added, ${updated} updated${warnings.length > 0 ? ' (with warnings)' : ''}`,
      added,
      updated,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    });

  } catch (error) {
    console.error("Error importing Excel file:", error);
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Error importing Excel file: ' + error.message });
  }
});

// =====================================================
// CLEARANCE CERTIFICATION API ENDPOINTS
// =====================================================

// Helper function to generate unique OR number
const generateORNumber = () => {
  return new Promise((resolve, reject) => {
    const year = new Date().getFullYear();
    
    // Get and increment sequence for current year
    db.query(
      `INSERT INTO clearance_or_sequence (year, last_sequence) VALUES (?, 8254600)
       ON DUPLICATE KEY UPDATE last_sequence = last_sequence + 1`,
      [year],
      (err) => {
        if (err) return reject(err);
        
        db.query(
          `SELECT last_sequence FROM clearance_or_sequence WHERE year = ?`,
          [year],
          (err, results) => {
            if (err) return reject(err);
            const sequence = results[0]?.last_sequence || 8254601;
            resolve(`OCP-${year}-${sequence}`);
          }
        );
      }
    );
  });
};

// Get all clearance purposes with fees
app.get("/api/clearances/purposes", (req, res) => {
  db.query(
    `SELECT * FROM clearance_purposes WHERE is_active = TRUE ORDER BY sort_order ASC`,
    (err, results) => {
      if (err) {
        console.error("Error fetching purposes:", err);
        return res.status(500).json({ error: "Failed to fetch purposes" });
      }
      res.json(results);
    }
  );
});

// ============================================
// SPECIFIC ROUTES MUST COME BEFORE PARAMETRIZED ROUTES (:id)
// ============================================

// Get clearance statistics
app.get("/api/clearances/stats/overview", (req, res) => {
  const queries = {
    total: `SELECT COUNT(*) as count FROM clearances WHERE deleted_at IS NULL`,
    thisMonth: `SELECT COUNT(*) as count FROM clearances WHERE deleted_at IS NULL AND MONTH(date_issued) = MONTH(CURRENT_DATE) AND YEAR(date_issued) = YEAR(CURRENT_DATE)`,
    noCriminalRecord: `SELECT COUNT(*) as count FROM clearances WHERE deleted_at IS NULL AND has_criminal_record = FALSE`,
    hasCriminalRecord: `SELECT COUNT(*) as count FROM clearances WHERE deleted_at IS NULL AND has_criminal_record = TRUE`,
    byFormat: `SELECT format_type, COUNT(*) as count FROM clearances WHERE deleted_at IS NULL GROUP BY format_type`
  };
  
  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;
  
  Object.entries(queries).forEach(([key, query]) => {
    db.query(query, (err, result) => {
      if (err) {
        console.error(`Error fetching ${key} stats:`, err);
        results[key] = key === 'byFormat' ? [] : 0;
      } else {
        results[key] = key === 'byFormat' ? result : result[0].count;
      }
      
      completed++;
      if (completed === totalQueries) {
        res.json(results);
      }
    });
  });
});

// Get users who have issued clearances (for filter dropdown)
app.get("/api/clearances/issuers", (req, res) => {
  db.query(
    `SELECT DISTINCT issued_by_user_id, issued_by_name FROM clearances WHERE deleted_at IS NULL ORDER BY issued_by_name`,
    (err, results) => {
      if (err) {
        console.error("Error fetching issuers:", err);
        return res.status(500).json({ error: "Failed to fetch issuers" });
      }
      res.json(results);
    }
  );
});

// Get archived clearances (paginated)
app.get("/api/clearances/archived", (req, res) => {
  console.log('\n🔷 ROUTE HIT: /api/clearances/archived');
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    format_type = '', 
    date_from = '', 
    date_to = '' 
  } = req.query;

  console.log('📦 ARCHIVED REQUEST:', { page, limit, search, format_type, date_from, date_to });

  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let whereConditions = ['deleted_at IS NOT NULL'];
  let params = [];
  
  if (search) {
    whereConditions.push(`(
      CONCAT(first_name, ' ', IFNULL(middle_name, ''), ' ', last_name) LIKE ? OR
      or_number LIKE ?
    )`);
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (format_type) {
    whereConditions.push('format_type = ?');
    params.push(format_type);
  }
  
  if (date_from) {
    whereConditions.push('date_issued >= ?');
    params.push(date_from);
  }
  
  if (date_to) {
    whereConditions.push('date_issued <= ?');
    params.push(date_to);
  }
  
  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
  
  console.log('📦 WHERE CLAUSE:', whereClause);
  console.log('📦 PARAMS:', params);
  
  // Get total count
  db.query(
    `SELECT COUNT(*) as total FROM clearances ${whereClause}`,
    params,
    (err, countResults) => {
      if (err) {
        console.error("Error counting archived clearances:", err);
        return res.status(500).json({ error: "Failed to fetch archived clearances" });
      }
      
      const total = countResults[0].total;
      console.log('📦 Total archived clearances found:', total);
      const totalPages = Math.ceil(total / parseInt(limit));
      
      // Get paginated clearances
      db.query(
        `SELECT * FROM clearances ${whereClause} ORDER BY deleted_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset],
        (err, clearances) => {
          if (err) {
            console.error("Error fetching archived clearances:", err);
            return res.status(500).json({ error: "Failed to fetch archived clearances" });
          }
          
          console.log('📦 Archived clearances returned:', clearances.length);
          
          res.json({
            clearances,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              totalPages
            }
          });
        }
      );
    }
  );
});

// ============================================
// GENERAL LIST ROUTE
// ============================================

// Get all clearances with filtering and pagination
app.get("/api/clearances", (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    format_type = '', 
    has_criminal_record = '', 
    date_from = '', 
    date_to = '',
    issued_by = '',
    status = ''
  } = req.query;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let whereConditions = ['deleted_at IS NULL'];
  let params = [];
  
  if (search) {
    whereConditions.push(`(first_name LIKE ? OR last_name LIKE ? OR or_number LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  if (format_type) {
    whereConditions.push(`format_type = ?`);
    params.push(format_type);
  }
  
  if (has_criminal_record !== '') {
    whereConditions.push(`has_criminal_record = ?`);
    params.push(has_criminal_record === 'true' ? 1 : 0);
  }
  
  if (date_from) {
    whereConditions.push(`date_issued >= ?`);
    params.push(date_from);
  }
  
  if (date_to) {
    whereConditions.push(`date_issued <= ?`);
    params.push(date_to);
  }
  
  if (issued_by) {
    whereConditions.push(`issued_by_user_id = ?`);
    params.push(issued_by);
  }
  
  if (status) {
    whereConditions.push(`status = ?`);
    params.push(status);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  // Count total records
  db.query(
    `SELECT COUNT(*) as total FROM clearances ${whereClause}`,
    params,
    (err, countResults) => {
      if (err) {
        console.error("Error counting clearances:", err);
        return res.status(500).json({ error: "Failed to fetch clearances" });
      }
      
      const total = countResults[0].total;
      
      // Fetch paginated results
      db.query(
        `SELECT * FROM clearances ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset],
        (err, results) => {
          if (err) {
            console.error("Error fetching clearances:", err);
            return res.status(500).json({ error: "Failed to fetch clearances" });
          }
          
          res.json({
            data: results,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              totalPages: Math.ceil(total / parseInt(limit))
            }
          });
        }
      );
    }
  );
});

// Get single clearance by ID
app.get("/api/clearances/:id", (req, res) => {
  const { id } = req.params;
  console.log('\n🔶 ROUTE HIT: /api/clearances/:id with id =', id);
  
  db.query(
    `SELECT * FROM clearances WHERE id = ? AND deleted_at IS NULL`,
    [id],
    (err, results) => {
      if (err) {
        console.error("Error fetching clearance:", err);
        return res.status(500).json({ error: "Failed to fetch clearance" });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: "Clearance not found" });
      }
      
      res.json(results[0]);
    }
  );
});

// Create new clearance
app.post("/api/clearances", async (req, res) => {
  try {
    const {
      format_type,
      first_name,
      middle_name,
      last_name,
      suffix,
      alias,
      age,
      civil_status,
      nationality,
      address,
      has_criminal_record,
      case_numbers,
      crime_description,
      legal_statute,
      date_of_commission,
      date_information_filed,
      case_status,
      court_branch,
      purpose,
      purpose_fee,
      issued_upon_request_by,
      date_issued,
      prc_id_number,
      validity_period,
      validity_expiry,
      issued_by_user_id,
      issued_by_name,
      notes
    } = req.body;
    
    // Generate OR number
    const or_number = await generateORNumber();
    
    const query = `
      INSERT INTO clearances (
        or_number, format_type, first_name, middle_name, last_name, suffix, alias,
        age, civil_status, nationality, address, has_criminal_record,
        case_numbers, crime_description, legal_statute, date_of_commission,
        date_information_filed, case_status, court_branch, purpose, purpose_fee,
        issued_upon_request_by, date_issued, prc_id_number, validity_period,
        validity_expiry, issued_by_user_id, issued_by_name, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [
      or_number, format_type, first_name, middle_name || null, last_name, suffix || null, alias || null,
      age, civil_status, nationality || 'Filipino', address, has_criminal_record || false,
      case_numbers || null, crime_description || null, legal_statute || null, date_of_commission || null,
      date_information_filed || null, case_status || null, court_branch || null, purpose, purpose_fee || 0,
      issued_upon_request_by || null, date_issued, prc_id_number || null, validity_period || '6 Months',
      validity_expiry, issued_by_user_id, issued_by_name, notes || null
    ], (err, result) => {
      if (err) {
        console.error("Error creating clearance:", err);
        return res.status(500).json({ error: "Failed to create clearance: " + err.message });
      }
      
      // Log the creation in audit log
      db.query(
        `INSERT INTO clearance_audit_log (clearance_id, action, action_by_user_id, action_by_name, new_values)
         VALUES (?, 'CREATE', ?, ?, ?)`,
        [result.insertId, issued_by_user_id, issued_by_name, JSON.stringify(req.body)],
        (auditErr) => {
          if (auditErr) console.error("Error logging audit:", auditErr);
        }
      );
      
      emitRealtimeEvent('clearance_added', { id: result.insertId, or_number });
      
      res.status(201).json({
        success: true,
        message: "Clearance created successfully",
        data: {
          id: result.insertId,
          or_number
        }
      });
    });
    
  } catch (error) {
    console.error("Error creating clearance:", error);
    res.status(500).json({ error: "Failed to create clearance: " + error.message });
  }
});

// Update clearance
app.put("/api/clearances/:id", (req, res) => {
  try {
    const { id } = req.params;
    const {
      format_type,
      first_name,
      middle_name,
      last_name,
      suffix,
      alias,
      age,
      civil_status,
      nationality,
      address,
      has_criminal_record,
      case_numbers,
      crime_description,
      legal_statute,
      date_of_commission,
      date_information_filed,
      case_status,
      court_branch,
      purpose,
      purpose_fee,
      issued_upon_request_by,
      date_issued,
      prc_id_number,
      validity_period,
      validity_expiry,
      notes,
      updated_by_user_id,
      updated_by_name
    } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name || !date_issued || !validity_expiry) {
      return res.status(400).json({ error: "Missing required fields: first_name, last_name, date_issued, validity_expiry are required" });
    }
    
    // First get old values for audit log
    db.query(`SELECT * FROM clearances WHERE id = ?`, [id], (err, oldResults) => {
      if (err) {
        console.error("Error fetching clearance for update:", err);
        return res.status(500).json({ error: "Failed to fetch clearance: " + err.message });
      }
      
      if (oldResults.length === 0) {
        return res.status(404).json({ error: "Clearance not found" });
      }
      
      const oldValues = oldResults[0];
      
      const query = `
        UPDATE clearances SET
          format_type = ?, first_name = ?, middle_name = ?, last_name = ?, suffix = ?, alias = ?,
          age = ?, civil_status = ?, nationality = ?, address = ?, has_criminal_record = ?,
          case_numbers = ?, crime_description = ?, legal_statute = ?, date_of_commission = ?,
          date_information_filed = ?, case_status = ?, court_branch = ?, purpose = ?, purpose_fee = ?,
          issued_upon_request_by = ?, date_issued = ?, prc_id_number = ?, validity_period = ?,
          validity_expiry = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL
      `;
      
      db.query(query, [
        format_type, first_name, middle_name || null, last_name, suffix || null, alias || null,
        age, civil_status, nationality || 'Filipino', address, has_criminal_record || false,
        case_numbers || null, crime_description || null, legal_statute || null, date_of_commission || null,
        date_information_filed || null, case_status || null, court_branch || null, purpose, purpose_fee || 0,
        issued_upon_request_by || null, date_issued, prc_id_number || null, validity_period || '6 Months',
        validity_expiry, notes || null, id
      ], (err, result) => {
        if (err) {
          console.error("Error updating clearance:", err);
          return res.status(500).json({ error: "Failed to update clearance: " + err.message });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Clearance not found or already deleted" });
        }
        
        // Log the update in audit log
        db.query(
          `INSERT INTO clearance_audit_log (clearance_id, action, action_by_user_id, action_by_name, old_values, new_values)
           VALUES (?, 'UPDATE', ?, ?, ?, ?)`,
          [id, updated_by_user_id || null, updated_by_name || 'Unknown', JSON.stringify(oldValues), JSON.stringify(req.body)],
          (auditErr) => {
            if (auditErr) console.error("Error logging audit:", auditErr);
          }
        );
        
        emitRealtimeEvent('clearance_updated', { id });
        
        res.json({
          success: true,
          message: "Clearance updated successfully"
        });
      });
    });
  } catch (error) {
    console.error("Error in clearance update:", error);
    res.status(500).json({ error: "Internal server error: " + error.message });
  }
});

// Soft delete clearance
app.delete("/api/clearances/:id", (req, res) => {
  const { id } = req.params;
  const { deleted_by_user_id, deleted_by_name } = req.body;
  
  console.log('🗑️  DELETE REQUEST:', { id, deleted_by_user_id, deleted_by_name });
  
  db.query(
    `UPDATE clearances SET deleted_at = CURRENT_TIMESTAMP, deleted_by_user_id = ?, deleted_by_name = ? WHERE id = ?`,
    [deleted_by_user_id, deleted_by_name, id],
    (err, result) => {
      if (err) {
        console.error("Error deleting clearance:", err);
        return res.status(500).json({ error: "Failed to delete clearance" });
      }
      
      console.log('✅ Delete result:', { affectedRows: result.affectedRows });
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Clearance not found" });
      }
      
      // Log the deletion in audit log
      db.query(
        `INSERT INTO clearance_audit_log (clearance_id, action, action_by_user_id, action_by_name)
         VALUES (?, 'DELETE', ?, ?)`,
        [id, deleted_by_user_id || 0, deleted_by_name || 'Unknown'],
        (auditErr) => {
          if (auditErr) console.error("Error logging audit:", auditErr);
        }
      );
      
      emitRealtimeEvent('clearance_deleted', { id });
      
      res.json({
        success: true,
        message: "Clearance deleted successfully"
      });
    }
  );
});

// Permanently delete all archived clearances (hard delete all)
// NOTE: This route MUST be before /api/clearances/:id/permanent so Express doesn't match 'archived' as :id
app.delete("/api/clearances/archived/all", (req, res) => {
  const { deleted_by_user_id, deleted_by_name } = req.body;
  
  console.log('🔴 DELETE ALL ARCHIVED CLEARANCES REQUEST:', { deleted_by_user_id, deleted_by_name });
  
  // Get all archived clearances before deletion for logging
  db.query(
    `SELECT id FROM clearances WHERE deleted_at IS NOT NULL`,
    (selectErr, clearances) => {
      if (selectErr) {
        console.error("Error fetching archived clearances for deletion:", selectErr);
        return res.status(500).json({ error: "Failed to fetch archived clearances" });
      }

      if (!clearances || clearances.length === 0) {
        return res.status(400).json({ error: "No archived clearances to delete" });
      }

      const clearanceIds = clearances.map(c => c.id);

      // Log the bulk deletion in audit log for each clearance
      clearanceIds.forEach(id => {
        db.query(
          `INSERT INTO clearance_audit_log (clearance_id, action, action_by_user_id, action_by_name)
           VALUES (?, 'PERMANENT_DELETE_BULK', ?, ?)`,
          [id, deleted_by_user_id || 0, deleted_by_name || 'Unknown'],
          (auditErr) => {
            if (auditErr) console.error("Error logging audit for bulk delete:", auditErr);
          }
        );
      });

      // Permanently delete all archived clearances
      db.query(
        `DELETE FROM clearances WHERE deleted_at IS NOT NULL`,
        (err, result) => {
          if (err) {
            console.error("Error permanently deleting all archived clearances:", err);
            return res.status(500).json({ error: "Failed to permanently delete archived clearances" });
          }

          console.log('✅ Deleted all archived clearances:', { affectedRows: result.affectedRows });

          emitRealtimeEvent('clearance_bulk_permanent_deleted', { count: result.affectedRows });
          
          res.json({
            success: true,
            message: `${result.affectedRows} archived clearances permanently deleted successfully`,
            deletedCount: result.affectedRows
          });
        }
      );
    }
  );
});

// Permanently delete an archived clearance (hard delete)
app.delete("/api/clearances/:id/permanent", (req, res) => {
  const { id } = req.params;
  const { deleted_by_user_id, deleted_by_name } = req.body;
  
  console.log('🔴 PERMANENT DELETE REQUEST:', { id, deleted_by_user_id, deleted_by_name });
  
  // First, log the permanent deletion in audit log
  db.query(
    `INSERT INTO clearance_audit_log (clearance_id, action, action_by_user_id, action_by_name)
     VALUES (?, 'PERMANENT_DELETE', ?, ?)`,
    [id, deleted_by_user_id || 0, deleted_by_name || 'Unknown'],
    (auditErr) => {
      if (auditErr) console.error("Error logging audit for permanent delete:", auditErr);
    }
  );
  
  // Permanently delete the clearance record
  db.query(
    `DELETE FROM clearances WHERE id = ?`,
    [id],
    (err, result) => {
      if (err) {
        console.error("Error permanently deleting clearance:", err);
        return res.status(500).json({ error: "Failed to permanently delete clearance" });
      }
      
      console.log('✅ Permanent delete result:', { affectedRows: result.affectedRows });
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Clearance not found" });
      }
      
      emitRealtimeEvent('clearance_permanent_deleted', { id });
      
      res.json({
        success: true,
        message: "Clearance permanently deleted successfully"
      });
    }
  );
});

// Log clearance download
app.post("/api/clearances/:id/log-download", (req, res) => {
  const { id } = req.params;
  const { user_id, user_name } = req.body;
  
  db.query(
    `INSERT INTO clearance_audit_log (clearance_id, action, action_by_user_id, action_by_name)
     VALUES (?, 'DOWNLOAD', ?, ?)`,
    [id, user_id, user_name],
    (err) => {
      if (err) {
        console.error("Error logging download:", err);
        return res.status(500).json({ error: "Failed to log download" });
      }
      res.json({ success: true });
    }
  );
});

// Restore archived clearance
app.patch("/api/clearances/:id/restore", (req, res) => {
  const { id } = req.params;
  const { restored_by_user_id, restored_by_name } = req.body;
  
  db.query(
    `UPDATE clearances SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL`,
    [id],
    (err, result) => {
      if (err) {
        console.error("Error restoring clearance:", err);
        return res.status(500).json({ error: "Failed to restore clearance" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Archived clearance not found" });
      }
      
      // Log the restoration in audit log
      db.query(
        `INSERT INTO clearance_audit_log (clearance_id, action, action_by_user_id, action_by_name)
         VALUES (?, 'RESTORE', ?, ?)`,
        [id, restored_by_user_id || 0, restored_by_name || 'Unknown'],
        (auditErr) => {
          if (auditErr) console.error("Error logging audit:", auditErr);
        }
      );
      
      emitRealtimeEvent('clearance_restored', { id });
      
      res.json({
        success: true,
        message: "Clearance restored successfully"
      });
    }
  );
});

// Export clearances to Excel
app.get("/api/clearances/export/excel", (req, res) => {
  const { date_from, date_to, format_type, has_criminal_record } = req.query;
  
  let whereConditions = ['deleted_at IS NULL'];
  let params = [];
  
  if (date_from) {
    whereConditions.push(`date_issued >= ?`);
    params.push(date_from);
  }
  
  if (date_to) {
    whereConditions.push(`date_issued <= ?`);
    params.push(date_to);
  }
  
  if (format_type) {
    whereConditions.push(`format_type = ?`);
    params.push(format_type);
  }
  
  if (has_criminal_record !== undefined && has_criminal_record !== '') {
    whereConditions.push(`has_criminal_record = ?`);
    params.push(has_criminal_record === 'true' ? 1 : 0);
  }
  
  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
  
  db.query(
    `SELECT 
      or_number AS 'O.R. Number',
      CONCAT(first_name, ' ', IFNULL(middle_name, ''), ' ', last_name) AS 'Applicant Name',
      age AS 'Age',
      civil_status AS 'Civil Status',
      nationality AS 'Nationality',
      address AS 'Complete Address',
      CASE format_type
        WHEN 'A' THEN 'Individual - No CR'
        WHEN 'B' THEN 'Individual - Has CR'
        WHEN 'C' THEN 'Family - No CR'
        WHEN 'D' THEN 'Family - Has CR'
      END AS 'Format',
      IFNULL(notes, '') AS 'Notes',
      purpose AS 'Purpose',
      date_issued AS 'Date Issued',
      validity_expiry AS 'Valid Until',
      issued_by_name AS 'Issued By',
      status AS 'Status'
    FROM clearances ${whereClause} ORDER BY date_issued DESC`,
    params,
    (err, results) => {
      if (err) {
        console.error("Error exporting clearances:", err);
        return res.status(500).json({ error: "Failed to export clearances" });
      }
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(results);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 18 }, { wch: 30 }, { wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 40 },
        { wch: 18 }, { wch: 35 }, { wch: 25 }, { wch: 12 }, { wch: 12 },
        { wch: 20 }, { wch: 10 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Clearances");
      
      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', `attachment; filename=clearances_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    }
  );
});

// =====================================================
// ENHANCED CLEARANCE ENDPOINTS WITH AUTH & VALIDATION
// =====================================================

// Get clearance audit logs
app.get("/api/clearances/:id/audit-logs", (req, res) => {
  const { id } = req.params;
  
  db.query(
    `SELECT * FROM clearance_audit_log WHERE clearance_id = ? ORDER BY created_at DESC`,
    [id],
    (err, results) => {
      if (err) {
        console.error("Error fetching audit logs:", err);
        return res.status(500).json({ error: "Failed to fetch audit logs" });
      }
      res.json(results);
    }
  );
});

// Revoke clearance
app.post("/api/clearances/:id/revoke", (req, res) => {
  const { id } = req.params;
  const { revoke_reason, revoked_by_user_id, revoked_by_name } = req.body;
  
  // Validate required fields
  if (!revoke_reason || !revoked_by_user_id || !revoked_by_name) {
    return res.status(400).json({ 
      error: "Missing required fields: revoke_reason, revoked_by_user_id, revoked_by_name" 
    });
  }
  
  db.query(
    `UPDATE clearances SET status = 'Revoked', notes = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ? AND deleted_at IS NULL`,
    [revoke_reason, id],
    (err, result) => {
      if (err) {
        console.error("Error revoking clearance:", err);
        return res.status(500).json({ error: "Failed to revoke clearance" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Clearance not found" });
      }
      
      // Log the revocation
      db.query(
        `INSERT INTO clearance_audit_log (clearance_id, action, action_by_user_id, action_by_name, new_values)
         VALUES (?, 'REVOKE', ?, ?, ?)`,
        [id, revoked_by_user_id, revoked_by_name, JSON.stringify({ revoke_reason })],
        (auditErr) => {
          if (auditErr) console.error("Error logging revocation:", auditErr);
        }
      );
      
      emitRealtimeEvent('clearance_revoked', { id });
      
      res.json({
        success: true,
        message: "Clearance revoked successfully"
      });
    }
  );
});

// Update clearance status
app.put("/api/clearances/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, updated_by_user_id, updated_by_name } = req.body;
  
  const validStatuses = ['Valid', 'Expired', 'Revoked', 'Cancelled'];
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
    });
  }
  
  db.query(
    `SELECT * FROM clearances WHERE id = ? AND deleted_at IS NULL`,
    [id],
    (err, oldResults) => {
      if (err) {
        console.error("Error fetching clearance:", err);
        return res.status(500).json({ error: "Failed to update status" });
      }
      
      if (oldResults.length === 0) {
        return res.status(404).json({ error: "Clearance not found" });
      }
      
      const oldStatus = oldResults[0].status;
      
      db.query(
        `UPDATE clearances SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, id],
        (err, result) => {
          if (err) {
            console.error("Error updating clearance status:", err);
            return res.status(500).json({ error: "Failed to update status" });
          }
          
          // Log the status change
          db.query(
            `INSERT INTO clearance_audit_log (clearance_id, action, action_by_user_id, action_by_name, old_values, new_values)
             VALUES (?, 'UPDATE', ?, ?, ?, ?)`,
            [id, updated_by_user_id, updated_by_name, JSON.stringify({ status: oldStatus }), JSON.stringify({ status })],
            (auditErr) => {
              if (auditErr) console.error("Error logging status update:", auditErr);
            }
          );
          
          emitRealtimeEvent('clearance_status_updated', { id, status });
          
          res.json({
            success: true,
            message: `Clearance status updated to ${status}`,
            data: { id, status }
          });
        }
      );
    }
  );
});

// Log clearance print
app.post("/api/clearances/:id/log-print", (req, res) => {
  const { id } = req.params;
  const { user_id, user_name } = req.body;
  
  if (!user_id || !user_name) {
    return res.status(400).json({ error: "Missing user_id or user_name" });
  }
  
  db.query(
    `INSERT INTO clearance_audit_log (clearance_id, action, action_by_user_id, action_by_name)
     VALUES (?, 'PRINT', ?, ?)`,
    [id, user_id, user_name],
    (err) => {
      if (err) {
        console.error("Error logging print:", err);
        return res.status(500).json({ error: "Failed to log print" });
      }
      res.json({ success: true, message: "Print logged successfully" });
    }
  );
});

// Get clearance activity logs/audit trail
app.get("/api/clearances/:id/activity", (req, res) => {
  const { id } = req.params;
  
  db.query(
    `SELECT 
      action,
      action_by_name,
      created_at,
      CASE action
        WHEN 'CREATE' THEN 'Created'
        WHEN 'UPDATE' THEN 'Updated'
        WHEN 'DELETE' THEN 'Deleted'
        WHEN 'DOWNLOAD' THEN 'Downloaded'
        WHEN 'PRINT' THEN 'Printed'
        WHEN 'REVOKE' THEN 'Revoked'
      END as action_label
    FROM clearance_audit_log 
    WHERE clearance_id = ? 
    ORDER BY created_at DESC 
    LIMIT 100`,
    [id],
    (err, results) => {
      if (err) {
        console.error("Error fetching activity logs:", err);
        return res.status(500).json({ error: "Failed to fetch activity logs" });
      }
      res.json(results);
    }
  );
});

// Bulk update clearance statuses
app.put("/api/clearances/bulk/status-update", (req, res) => {
  const { clearance_ids, new_status, updated_by_user_id, updated_by_name } = req.body;
  
  if (!Array.isArray(clearance_ids) || clearance_ids.length === 0) {
    return res.status(400).json({ error: "clearance_ids must be a non-empty array" });
  }
  
  const validStatuses = ['Valid', 'Expired', 'Revoked', 'Cancelled'];
  if (!new_status || !validStatuses.includes(new_status)) {
    return res.status(400).json({ error: "Invalid status provided" });
  }
  
  const placeholders = clearance_ids.map(() => '?').join(',');
  
  db.query(
    `UPDATE clearances SET status = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
    [new_status, ...clearance_ids],
    (err, result) => {
      if (err) {
        console.error("Error bulk updating clearances:", err);
        return res.status(500).json({ error: "Failed to update clearances" });
      }
      
      // Log bulk update for each clearance
      clearance_ids.forEach(cid => {
        db.query(
          `INSERT INTO clearance_audit_log (clearance_id, action, action_by_user_id, action_by_name, new_values)
           VALUES (?, 'UPDATE', ?, ?, ?)`,
          [cid, updated_by_user_id, updated_by_name, JSON.stringify({ status: new_status })],
          (auditErr) => {
            if (auditErr) console.error("Error logging bulk update:", auditErr);
          }
        );
      });
      
      emitRealtimeEvent('clearance_bulk_status_updated', { clearance_ids, new_status, updated_count: result.affectedRows });
      
      res.json({
        success: true,
        message: `Updated ${result.affectedRows} clearances to ${new_status}`,
        data: { updated_count: result.affectedRows }
      });
    }
  );
});

// Get clearance by OR number
app.get("/api/clearances/or/:or_number", (req, res) => {
  const { or_number } = req.params;
  
  db.query(
    `SELECT * FROM clearances WHERE or_number = ? AND deleted_at IS NULL`,
    [or_number],
    (err, results) => {
      if (err) {
        console.error("Error fetching clearance by OR number:", err);
        return res.status(500).json({ error: "Failed to fetch clearance" });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: "Clearance with this OR number not found" });
      }
      
      res.json(results[0]);
    }
  );
});

// Verify clearance validity
app.get("/api/clearances/:id/verify", (req, res) => {
  const { id } = req.params;
  
  db.query(
    `SELECT 
      id,
      or_number,
      CONCAT(first_name, ' ', IFNULL(middle_name, ''), ' ', last_name) as full_name,
      date_issued,
      validity_expiry,
      status,
      CASE 
        WHEN status = 'Revoked' THEN 'REVOKED'
        WHEN status = 'Cancelled' THEN 'CANCELLED'
        WHEN CURRENT_DATE > validity_expiry THEN 'EXPIRED'
        WHEN CURRENT_DATE <= validity_expiry AND status = 'Valid' THEN 'VALID'
        ELSE 'INVALID'
      END as verification_status
    FROM clearances 
    WHERE id = ? AND deleted_at IS NULL`,
    [id],
    (err, results) => {
      if (err) {
        console.error("Error verifying clearance:", err);
        return res.status(500).json({ error: "Failed to verify clearance" });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: "Clearance not found" });
      }
      
      res.json(results[0]);
    }
  );
});

// Export clearances to CSV
app.get("/api/clearances/export/csv", (req, res) => {
  const { date_from, date_to, format_type } = req.query;
  
  let whereConditions = ['deleted_at IS NULL'];
  let params = [];
  
  if (date_from) {
    whereConditions.push(`date_issued >= ?`);
    params.push(date_from);
  }
  
  if (date_to) {
    whereConditions.push(`date_issued <= ?`);
    params.push(date_to);
  }
  
  if (format_type) {
    whereConditions.push(`format_type = ?`);
    params.push(format_type);
  }
  
  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
  
  db.query(
    `SELECT 
      or_number,
      format_type,
      CONCAT(first_name, ' ', IFNULL(middle_name, ''), ' ', last_name) as applicant_name,
      age,
      civil_status,
      nationality,
      address,
      has_criminal_record,
      purpose,
      date_issued,
      validity_expiry,
      issued_by_name,
      status,
      created_at
    FROM clearances ${whereClause} ORDER BY date_issued DESC`,
    params,
    (err, results) => {
      if (err) {
        console.error("Error exporting clearances to CSV:", err);
        return res.status(500).json({ error: "Failed to export clearances" });
      }
      
      // Convert to CSV
      const headers = Object.keys(results[0] || {}).join(',');
      const rows = results.map(row => 
        Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');
      
      res.setHeader('Content-Disposition', `attachment; filename=clearances_export_${new Date().toISOString().split('T')[0]}.csv`);
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    }
  );
});

// Get clearance statistics by date range
app.get("/api/clearances/stats/by-date", (req, res) => {
  const { date_from, date_to } = req.query;
  
  let query = `
    SELECT 
      DATE(date_issued) as issue_date,
      COUNT(*) as total_issued,
      SUM(CASE WHEN has_criminal_record = true THEN 1 ELSE 0 END) as with_criminal_record,
      SUM(CASE WHEN has_criminal_record = false THEN 1 ELSE 0 END) as without_criminal_record,
      SUM(purpose_fee) as total_fees
    FROM clearances 
    WHERE deleted_at IS NULL
  `;
  
  let params = [];
  
  if (date_from) {
    query += ` AND date_issued >= ?`;
    params.push(date_from);
  }
  
  if (date_to) {
    query += ` AND date_issued <= ?`;
    params.push(date_to);
  }
  
  query += ` GROUP BY DATE(date_issued) ORDER BY issue_date DESC`;
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Error fetching statistics by date:", err);
      return res.status(500).json({ error: "Failed to fetch statistics" });
    }
    res.json(results);
  });
});

// Get clearance statistics by format type
app.get("/api/clearances/stats/by-format", (req, res) => {
  db.query(
    `SELECT 
      format_type,
      COUNT(*) as count,
      SUM(CASE WHEN has_criminal_record = true THEN 1 ELSE 0 END) as with_criminal_record,
      SUM(purpose_fee) as total_fees,
      CASE format_type
        WHEN 'A' THEN 'Individual - No CR'
        WHEN 'B' THEN 'Individual - Has CR'
        WHEN 'C' THEN 'Family - No CR'
        WHEN 'D' THEN 'Family - Has CR'
        WHEN 'E' THEN 'Individual - No Derogatory'
        WHEN 'F' THEN 'Individual - Balsaff'
      END as format_label
    FROM clearances 
    WHERE deleted_at IS NULL 
    GROUP BY format_type 
    ORDER BY format_type ASC`,
    (err, results) => {
      if (err) {
        console.error("Error fetching format statistics:", err);
        return res.status(500).json({ error: "Failed to fetch statistics" });
      }
      res.json(results);
    }
  );
});

// Get clearance statistics by purpose
app.get("/api/clearances/stats/by-purpose", (req, res) => {
  db.query(
    `SELECT 
      purpose,
      COUNT(*) as count,
      SUM(purpose_fee) as total_fees,
      AVG(purpose_fee) as avg_fee
    FROM clearances 
    WHERE deleted_at IS NULL 
    GROUP BY purpose 
    ORDER BY count DESC`,
    (err, results) => {
      if (err) {
        console.error("Error fetching purpose statistics:", err);
        return res.status(500).json({ error: "Failed to fetch statistics" });
      }
      res.json(results);
    }
  );
});

// Get clearance statistics by issuer
app.get("/api/clearances/stats/by-issuer", (req, res) => {
  db.query(
    `SELECT 
      issued_by_user_id,
      issued_by_name,
      COUNT(*) as clearances_issued,
      SUM(CASE WHEN has_criminal_record = true THEN 1 ELSE 0 END) as with_criminal_record,
      SUM(purpose_fee) as total_fees,
      MAX(date_issued) as last_issued
    FROM clearances 
    WHERE deleted_at IS NULL 
    GROUP BY issued_by_user_id, issued_by_name 
    ORDER BY clearances_issued DESC`,
    (err, results) => {
      if (err) {
        console.error("Error fetching issuer statistics:", err);
        return res.status(500).json({ error: "Failed to fetch statistics" });
      }
      res.json(results);
    }
  );
});

// Get clearance validity status overview
app.get("/api/clearances/stats/validity", (req, res) => {
  db.query(
    `SELECT 
      CASE 
        WHEN status = 'Revoked' THEN 'Revoked'
        WHEN status = 'Cancelled' THEN 'Cancelled'
        WHEN CURRENT_DATE > validity_expiry THEN 'Expired'
        WHEN CURRENT_DATE <= validity_expiry AND status = 'Valid' THEN 'Valid'
        ELSE 'Invalid'
      END as validity_status,
      COUNT(*) as count
    FROM clearances 
    WHERE deleted_at IS NULL
    GROUP BY validity_status`,
    (err, results) => {
      if (err) {
        console.error("Error fetching validity statistics:", err);
        return res.status(500).json({ error: "Failed to fetch statistics" });
      }
      res.json(results);
    }
  );
});

// Search clearances with advanced filters
app.post("/api/clearances/search/advanced", (req, res) => {
  const {
    applicant_name = '',
    or_number = '',
    format_type = '',
    civil_status = '',
    has_criminal_record = '',
    purpose = '',
    status = '',
    date_issued_from = '',
    date_issued_to = '',
    validity_expiry_from = '',
    validity_expiry_to = '',
    issued_by_user_id = '',
    page = 1,
    limit = 10
  } = req.body;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let whereConditions = ['deleted_at IS NULL'];
  let params = [];
  
  if (applicant_name) {
    whereConditions.push(`CONCAT(first_name, ' ', IFNULL(middle_name, ''), ' ', last_name) LIKE ?`);
    params.push(`%${applicant_name}%`);
  }
  
  if (or_number) {
    whereConditions.push(`or_number LIKE ?`);
    params.push(`%${or_number}%`);
  }
  
  if (format_type) {
    whereConditions.push(`format_type = ?`);
    params.push(format_type);
  }
  
  if (civil_status) {
    whereConditions.push(`civil_status = ?`);
    params.push(civil_status);
  }
  
  if (has_criminal_record !== '') {
    whereConditions.push(`has_criminal_record = ?`);
    params.push(has_criminal_record === 'true' ? 1 : 0);
  }
  
  if (purpose) {
    whereConditions.push(`purpose LIKE ?`);
    params.push(`%${purpose}%`);
  }
  
  if (status) {
    whereConditions.push(`status = ?`);
    params.push(status);
  }
  
  if (date_issued_from) {
    whereConditions.push(`date_issued >= ?`);
    params.push(date_issued_from);
  }
  
  if (date_issued_to) {
    whereConditions.push(`date_issued <= ?`);
    params.push(date_issued_to);
  }
  
  if (validity_expiry_from) {
    whereConditions.push(`validity_expiry >= ?`);
    params.push(validity_expiry_from);
  }
  
  if (validity_expiry_to) {
    whereConditions.push(`validity_expiry <= ?`);
    params.push(validity_expiry_to);
  }
  
  if (issued_by_user_id) {
    whereConditions.push(`issued_by_user_id = ?`);
    params.push(issued_by_user_id);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  // Count total
  db.query(
    `SELECT COUNT(*) as total FROM clearances ${whereClause}`,
    params,
    (err, countResults) => {
      if (err) {
        console.error("Error counting search results:", err);
        return res.status(500).json({ error: "Failed to search clearances" });
      }
      
      const total = countResults[0].total;
      
      // Fetch results
      db.query(
        `SELECT * FROM clearances ${whereClause} ORDER BY date_issued DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset],
        (err, results) => {
          if (err) {
            console.error("Error fetching search results:", err);
            return res.status(500).json({ error: "Failed to search clearances" });
          }
          
          res.json({
            data: results,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              totalPages: Math.ceil(total / parseInt(limit))
            }
          });
        }
      );
    }
  );
});
