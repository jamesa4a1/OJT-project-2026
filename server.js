const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const XLSX = require("xlsx");
const schedule = require("node-schedule");
const { validateRequest } = require("./middleware/validateRequest");
const { UserLoginSchema, UserRegisterSchema, UserUpdateSchema } = require("./schemas/users");
const { CaseCreateSchema, CaseUpdateSchema, CaseSearchSchema } = require("./schemas/cases");
const { ApiResponse } = require("./utils/apiResponse");

const app = express();

// Store active schedules
let activeSchedules = {};

// Excel file path - stored in uploads folder
const EXCEL_FILE_PATH = path.join(__dirname, 'uploads', 'cases.xlsx');

// Function to export all cases to Excel file
const exportCasesToExcel = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT 
      DOCKET_NO AS 'Docket No',
      DATE_FILED AS 'Date Filed',
      COMPLAINANT AS 'Complainant',
      RESPONDENT AS 'Respondent',
      ADDRESS_OF_RESPONDENT AS 'Address of Respondent',
      OFFENSE AS 'Offense',
      DATE_OF_COMMISSION AS 'Date of Commission',
      DATE_RESOLVED AS 'Date Resolved',
      RESOLVING_PROSECUTOR AS 'Resolving Prosecutor',
      CRIM_CASE_NO AS 'Criminal Case No',
      BRANCH AS 'Branch',
      DATEFILED_IN_COURT AS 'Date Filed in Court',
      REMARKS_DECISION AS 'Remarks Decision',
      PENALTY AS 'Penalty',
      INDEX_CARDS AS 'Index Cards'
    FROM cases ORDER BY id ASC`;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching cases for Excel export:", err);
        return reject(err);
      }
      
      // Format dates for better Excel display
      const formattedResults = results.map(row => {
        const formattedRow = { ...row };
        if (formattedRow['Date Filed']) formattedRow['Date Filed'] = new Date(formattedRow['Date Filed']).toLocaleDateString('en-CA');
        if (formattedRow['Date of Commission']) formattedRow['Date of Commission'] = new Date(formattedRow['Date of Commission']).toLocaleDateString('en-CA');
        if (formattedRow['Date Resolved']) formattedRow['Date Resolved'] = new Date(formattedRow['Date Resolved']).toLocaleDateString('en-CA');
        if (formattedRow['Date Filed in Court']) formattedRow['Date Filed in Court'] = new Date(formattedRow['Date Filed in Court']).toLocaleDateString('en-CA');
        return formattedRow;
      });
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(formattedResults);
      
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
        { wch: 15 },  // Remarks Decision
        { wch: 12 },  // Penalty
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
      console.log("✅ Excel file updated:", EXCEL_FILE_PATH);
      resolve(EXCEL_FILE_PATH);
    });
  });
};
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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

function handleDisconnect() {
  db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", 
    database: "ocp_docketing",
  });

  db.connect((err) => {
    if (err) {
      console.error("❌ Database connection failed: " + err.message);
      console.error("⚠️  Please make sure MySQL/XAMPP is running and the 'ocp_docketing' database exists.");
      console.error("🔄 Will retry connection in 5 seconds...");
      setTimeout(handleDisconnect, 5000);
      return;
    }
    console.log("✅ Connected to MySQL database.");
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
  };

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
      const adminPassword = "james12345";
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
}

// Initialize database connection
handleDisconnect();

// ==================== USER AUTHENTICATION ROUTES ====================

// Register new user
app.post("/api/auth/register", validateRequest(UserRegisterSchema), async (req, res) => {
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
app.get("/api/users", (req, res) => {
  db.query("SELECT id, name, email, role, profile_picture, last_login, created_at, is_active, is_online FROM users ORDER BY created_at DESC", (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, users: results });
  });
});

// Delete user (Admin only)
app.delete("/api/user/:id", (req, res) => {
  const { id } = req.params;
  
  // Check if user exists and get their role
  db.query("SELECT role FROM users WHERE id = ?", [id], (err, results) => {
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
app.put("/api/user/:id/toggle-status", (req, res) => {
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
app.put("/api/user/:id/role", (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ success: false, message: "Role is required" });
  }

  const validRoles = ['Clerk', 'Staff', 'Admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  db.query("UPDATE users SET role = ? WHERE id = ?", [role, id], (err) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ success: false, message: "Failed to update user role" });
    }
    res.json({ success: true, message: "User role updated successfully" });
  });
});


// Login user
app.post("/api/auth/login", validateRequest(UserLoginSchema), (req, res) => {
  const { email, password } = req.body;
  
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
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
    
    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json(ApiResponse.error("Invalid credentials", 401));
    }
    
    console.log(`✅ Login successful: ${email} (is_active = ${user.is_active})`);
    
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
    
    res.json(ApiResponse.success("Login successful", userData));
  });
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
app.put("/api/user/:id", (req, res) => {
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
app.put("/api/user/:id/password", async (req, res) => {
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
  
  db.query("SELECT * FROM cases WHERE is_deleted = 0", (err, results) => {
    if (err) {
      console.error("Error fetching cases:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch cases from database",
        error: err.message
      });
    }
    // Return results as-is without modifying INDEX_CARDS
    // INDEX_CARDS should contain local paths like /uploads/index_cards/filename.png
    console.log(`📊 /cases endpoint: Returning ${results.length} active cases`);
    res.json(results);
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
  db.query("SELECT COUNT(*) as active_count FROM cases WHERE is_deleted = 0", (err, activeResults) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Get deleted cases count
    db.query("SELECT COUNT(*) as deleted_count FROM cases WHERE is_deleted = 1", (err, deletedResults) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Get all cases with their deletion status
      db.query("SELECT id, DOCKET_NO, is_deleted FROM cases ORDER BY id", (err, allCases) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        console.log(`🔍 Diagnostic Report: Active=${activeResults[0].active_count}, Deleted=${deletedResults[0].deleted_count}, Total=${allCases.length}`);
        
        res.json({
          summary: {
            active_count: activeResults[0].active_count,
            deleted_count: deletedResults[0].deleted_count,
            total_count: allCases.length
          },
          cases: allCases
        });
      });
    });
  });
});

// Add a new case 
app.post("/add-case", indexCardUpload.single('indexCardImage'), async (req, res) => {
  console.log("Received Data:", req.body); // debug
  console.log("Received File:", req.file); // debug
  
  try {
    // Validate the request body with Zod
    const validatedData = await CaseCreateSchema.parseAsync(req.body);
    
    // Get the image path if uploaded
    const INDEX_CARDS = req.file ? `/uploads/index_cards/${req.file.filename}` : 'N/A';

    const sql = `INSERT INTO cases (DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, ADDRESS_OF_RESPONDENT, OFFENSE, DATE_OF_COMMISSION, DATE_RESOLVED, RESOLVING_PROSECUTOR, CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, REMARKS_DECISION, PENALTY, INDEX_CARDS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [
      validatedData.DOCKET_NO, 
      validatedData.DATE_FILED, 
      validatedData.COMPLAINANT, 
      validatedData.RESPONDENT, 
      validatedData.ADDRESS_OF_RESPONDENT, 
      validatedData.OFFENSE, 
      validatedData.DATE_OF_COMMISSION, 
      validatedData.DATE_RESOLVED, 
      validatedData.RESOLVING_PROSECUTOR, 
      validatedData.CRIM_CASE_NO, 
      validatedData.BRANCH, 
      validatedData.DATEFILED_IN_COURT, 
      validatedData.REMARKS_DECISION, 
      validatedData.PENALTY, 
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
      
      res.status(200).json(ApiResponse.success("Case added successfully", { 
        id: result.insertId,
        indexCardPath: INDEX_CARDS 
      }));
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json(ApiResponse.error("Validation failed", 400, { errors }));
    }
    
    console.error("Error adding case:", error);
    return res.status(500).json(ApiResponse.error("Internal server error", 500));
  }
});

// search sa edit case
app.get("/get-case", (req, res) => {
const { docket_no, respondent, resolving_prosecutor, remarks, start_date, end_date } = req.query;

  let sql = "SELECT * FROM cases WHERE is_deleted = 0";
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
    // Validate the request body with Zod
    const validatedData = await CaseUpdateSchema.parseAsync(req.body);
    const { id, updated_fields } = validatedData;
    
    console.log("✅ Validation passed. ID:", id, "Fields:", Object.keys(updated_fields));

    if (Object.keys(updated_fields).length === 0) {
      return res.status(400).json(ApiResponse.error("No fields to update", 400));
    }

    let updateQuery = "UPDATE cases SET ";
    const updateValues = [];

    const fields = Object.keys(updated_fields);
    fields.forEach((field, index) => {
      updateQuery += `${field} = ?`;
      if (index < fields.length - 1) updateQuery += ", ";
      updateValues.push(updated_fields[field]);
    });

    updateQuery += " WHERE id = ?";
    updateValues.push(id);

    console.log("Executing Update:", updateQuery);
    console.log("With values:", updateValues);

    db.query(updateQuery, updateValues, (err, result) => {
      if (err) {
        console.error("Error updating case:", err);
        return res.status(500).json(ApiResponse.error("Error updating case", 500));
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
      
      return res.json(ApiResponse.success("Case updated successfully"));
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json(ApiResponse.error("Validation failed", 400, { errors }));
    }
    
    console.error("Error updating case:", error);
    return res.status(500).json(ApiResponse.error("Internal server error", 500));
  }
});

// Update case with image upload
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

  // Add the image path
  if (req.file) {
    fields.push('INDEX_CARDS');
    updateValues.push(`/uploads/index_cards/${req.file.filename}`);
    console.log("Image uploaded:", req.file.filename);
  }

  // Add other updated fields (exclude audit fields that shouldn't be manually updated)
  const excludedFields = ['id', 'indexCardImage', 'created_by', 'created_at', 'updated_by', 'updated_at'];
  Object.keys(req.body).forEach((key) => {
    if (!excludedFields.includes(key)) {
      let value = req.body[key];
      // Normalize REMARKS_DECISION to uppercase first letter
      if (key === 'REMARKS_DECISION' && typeof value === 'string') {
        value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
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
    return res.json({ message: "Case updated successfully!" });
  });
});


//delete case (soft delete)

app.delete("/delete-case", (req, res) => {
  console.log("Delete request received with body:", req.body); // Debugging log

  const { docket_no } = req.body;

  if (!docket_no) {
      console.error("No docket number provided.");
      return res.status(400).json({ message: "Docket number is required for deletion." });
  }

  const deleteQuery = "UPDATE cases SET is_deleted = 1, deleted_at = NOW() WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))";

  db.query(deleteQuery, [docket_no.trim().toLowerCase()], (err, result) => {
      if (err) {
          console.error("Error deleting case:", err);
          return res.status(500).json({ message: "Error deleting case.", error: err.message });
      }

      if (result.affectedRows === 0) {
          console.warn("No matching case found for deletion.");
          return res.status(404).json({ message: "No matching case found." });
      }

      // Sync Excel file after deleting case
      exportCasesToExcel()
        .then(() => {
          console.log("Excel file synced after case deletion");
        })
        .catch(excelErr => {
          console.error("Error syncing Excel file:", excelErr);
        });

      console.log("Case deleted successfully.");
      return res.json({ message: "Case deleted successfully!" });
  });
});

// Get deleted cases
app.get("/deleted-cases", (req, res) => {
  db.query("SELECT * FROM cases WHERE is_deleted = 1 ORDER BY deleted_at DESC", (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// Restore deleted case
app.patch("/restore-case", (req, res) => {
  try {
    console.log("Restore request received with body:", req.body);

    const { docket_no } = req.body;

    if (!docket_no) {
        console.error("No docket number provided.");
        return res.status(400).json({ message: "Docket number is required for restoration." });
    }

    const restoreQuery = "UPDATE cases SET is_deleted = 0, deleted_at = NULL WHERE DOCKET_NO = ? AND is_deleted = 1";

    db.query(restoreQuery, [docket_no], (err, result) => {
        if (err) {
            console.error("Error restoring case:", err);
            return res.status(500).json({ message: "Error restoring case.", error: err.message });
        }

        if (result.affectedRows === 0) {
            console.warn("No matching deleted case found for restoration.");
            return res.status(404).json({ message: "No matching deleted case found." });
        }

        // Sync Excel file after restoring case
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
  } catch (error) {
    console.error("Unexpected error in restore-case endpoint:", error);
    res.status(500).json({ message: "Unexpected error occurred", error: error.message });
  }
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
      
      // Permanently delete all soft-deleted cases
      const deleteQuery = `DELETE FROM cases WHERE is_deleted = 1`;
      
      db.query(deleteQuery, (err, results) => {
        if (err) {
          console.error("Error permanently deleting cases:", err);
          return;
        }
        
        console.log(`✅ Permanently deleted ${results.affectedRows} soft-deleted cases`);
        
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
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  // Catch all handler: send back React's index.html file for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build/index.html'));
  });
} else {
  // Root route for development
  app.get("/", (req, res) => {
    res.json({ message: "Backend server is running successfully!" });
  });
}

app.listen(5000, () => {
  console.log("Server running on port 5000");
  
  // Generate initial Excel file on server start
  exportCasesToExcel()
    .then(() => {
      console.log("Initial Excel file generated on server start");
    })
    .catch(err => {
      console.error("Error generating initial Excel file:", err);
    });
});

// ==================== EXCEL EXPORT ENDPOINTS ====================

// Download Excel file (auto-downloads to user's computer)
app.get("/download-excel", (req, res) => {
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
      db.query('SELECT id FROM cases WHERE DOCKET_NO = ? AND is_deleted = 0', [docketNo], (err, existingRows) => {
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

    // Helper function to find column value with flexible matching
    const getColumnValue = (row, possibleNames) => {
      for (let name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return row[name];
        }
      }
      return null;
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

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Map Excel columns to database fields with flexible matching
        const caseData = {
          DOCKET_NO: getColumnValue(row, ['Docket No', 'DOCKET_NO', 'Docket Number', 'DocketNo']) || '',
          DATE_FILED: getColumnValue(row, ['Date Filed', 'DATE_FILED', 'Date Filing', 'DateFiled']),
          COMPLAINANT: getColumnValue(row, ['Complainant', 'COMPLAINANT', 'Complainants']) || '',
          RESPONDENT: getColumnValue(row, ['Respondent', 'RESPONDENT', 'Respondents']) || '',
          ADDRESS_OF_RESPONDENT: getColumnValue(row, ['Address of Respondent', 'ADDRESS_OF_RESPONDENT', 'Address of Respondents', 'Respondent Address']) || '',
          OFFENSE: getColumnValue(row, ['Offense', 'OFFENSE', 'Offenses']) || '',
          DATE_OF_COMMISSION: getColumnValue(row, ['Date of Commission', 'DATE_OF_COMMISSION', 'Commission Date']),
          DATE_RESOLVED: getColumnValue(row, ['Date Resolved', 'DATE_RESOLVED', 'Resolution Date']),
          RESOLVING_PROSECUTOR: getColumnValue(row, ['Resolving Prosecutor', 'RESOLVING_PROSECUTOR', 'Prosecutor']) || '',
          CRIM_CASE_NO: getColumnValue(row, ['Criminal Case No', 'CRIM_CASE_NO', 'Case Number', 'Case No']) || '',
          BRANCH: getColumnValue(row, ['Branch', 'BRANCH']) || '',
          DATEFILED_IN_COURT: getColumnValue(row, ['Date Filed in Court', 'DATEFILED_IN_COURT', 'Court Filing Date']),
          REMARKS_DECISION: getColumnValue(row, ['Remarks Decision', 'REMARKS_DECISION', 'Decision', 'Remarks']) || '',
          PENALTY: getColumnValue(row, ['Penalty', 'PENALTY']) || '',
          INDEX_CARDS: getColumnValue(row, ['Index Cards', 'INDEX_CARDS', 'IndexCards']) || 'N/A'
        };

        // Validate required fields
        if (!caseData.DOCKET_NO) {
          errors.push(`Row ${i + 2}: Missing Docket Number`);
          continue;
        }

        // Check if case exists by DOCKET_NO (always use DOCKET_NO, not ID) and is not deleted
        const checkQuery = "SELECT id FROM cases WHERE DOCKET_NO = ? AND is_deleted = 0";

        const checkResult = await new Promise((resolve, reject) => {
          db.query(checkQuery, [caseData.DOCKET_NO], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        if (checkResult.length > 0) {
          // Update existing case
          const updateQuery = `UPDATE cases SET 
            DATE_FILED = ?, COMPLAINANT = ?, RESPONDENT = ?, 
            ADDRESS_OF_RESPONDENT = ?, OFFENSE = ?, DATE_OF_COMMISSION = ?,
            DATE_RESOLVED = ?, RESOLVING_PROSECUTOR = ?, 
            CRIM_CASE_NO = ?, BRANCH = ?, DATEFILED_IN_COURT = ?, 
            REMARKS_DECISION = ?, PENALTY = ?, INDEX_CARDS = ?
            WHERE DOCKET_NO = ?`;
          
          await new Promise((resolve, reject) => {
            db.query(updateQuery, [
              caseData.DATE_FILED, caseData.COMPLAINANT, 
              caseData.RESPONDENT, caseData.ADDRESS_OF_RESPONDENT, caseData.OFFENSE, 
              caseData.DATE_OF_COMMISSION, caseData.DATE_RESOLVED, 
              caseData.RESOLVING_PROSECUTOR, caseData.CRIM_CASE_NO, caseData.BRANCH, 
              caseData.DATEFILED_IN_COURT, caseData.REMARKS_DECISION, 
              caseData.PENALTY, caseData.INDEX_CARDS, caseData.DOCKET_NO
            ], (updateErr) => {
              if (updateErr) reject(updateErr);
              else {
                updated++;
                resolve();
              }
            });
          });
        } else {
          // Insert new case (ID will be auto-generated by database)
          const insertQuery = `INSERT INTO cases 
            (DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, ADDRESS_OF_RESPONDENT,
            OFFENSE, DATE_OF_COMMISSION, DATE_RESOLVED, RESOLVING_PROSECUTOR, 
            CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, REMARKS_DECISION, PENALTY, INDEX_CARDS) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          
          await new Promise((resolve, reject) => {
            db.query(insertQuery, [
              caseData.DOCKET_NO, caseData.DATE_FILED, caseData.COMPLAINANT, 
              caseData.RESPONDENT, caseData.ADDRESS_OF_RESPONDENT, caseData.OFFENSE, 
              caseData.DATE_OF_COMMISSION, caseData.DATE_RESOLVED, 
              caseData.RESOLVING_PROSECUTOR, caseData.CRIM_CASE_NO, caseData.BRANCH, 
              caseData.DATEFILED_IN_COURT, caseData.REMARKS_DECISION, 
              caseData.PENALTY, caseData.INDEX_CARDS
            ], (insertErr) => {
              if (insertErr) reject(insertErr);
              else {
                added++;
                resolve();
              }
            });
          });
        }

        console.log(`Row ${i + 2} processed successfully`);
      } catch (rowError) {
        console.error(`Row ${i + 2} error:`, rowError.message);
        errors.push(`Row ${i + 2}: ${rowError.message}`);
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
