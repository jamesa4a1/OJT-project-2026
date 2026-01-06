const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(cors()); 
app.use(express.json()); 

// Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", 
  database: "okok",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to MySQL database.");
});

// Get all cases para sad makuha nag lin sa gdrive
app.get("/cases", (req, res) => {
  db.query("SELECT * FROM cases", (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      const updatedResults = results.map((row) => {
        let driveFileId = null;
        
        if (row.INDEX_CARDS) {
          const match = row.INDEX_CARDS.match(/[-\w]{25,}/); // Extract file ID from URL
          if (match) {
            driveFileId = match[0];
          }
        }

        return {
          ...row,
          INDEX_CARDS: driveFileId
            ? `https://drive.google.com/uc?id=${driveFileId}`  // Correct public link format
            : null,
        };
      });

      res.json(updatedResults);
    }
  });
});

// Add a new case 
app.post("/add-case", (req, res) => {
  console.log("Received Data:", req.body); // debug
  const {
      DOCKET_NO,
      DATE_FILED,
      COMPLAINANT,
      RESPONDENT,
      OFFENSE,
      DATE_RESOLVED,
      RESOLVING_PROSECUTOR, 
      CRIM_CASE_NO,  
      BRANCH,
      DATEFILED_IN_COURT,
      REMARKS,
      REMARKS_DECISION,
      PENALTY,
      INDEX_CARDS
  
  } = req.body;

  const sql = `INSERT INTO cases (DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, OFFENSE, DATE_RESOLVED, RESOLVING_PROSECUTOR, CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, REMARKS, REMARKS_DECISION, PENALTY, INDEX_CARDS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, OFFENSE, DATE_RESOLVED, RESOLVING_PROSECUTOR, CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, REMARKS, REMARKS_DECISION, PENALTY, INDEX_CARDS], (err, result) => {
      if (err) {
          console.error("Error inserting data:", err);
          res.status(500).json({ message: "Failed to add case" });
      } else {
          res.status(200).json({ message: "Case added successfully" });
      }
  });
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
app.post("/update-case", (req, res) => {
  const { id, updated_fields } = req.body;

  if (!id || !updated_fields || Object.keys(updated_fields).length === 0) {
    return res.status(400).json({ message: "Missing or incomplete data." });
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
      return res.status(500).json({ message: "Error updating case." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No matching case found." });
    }
    return res.json({ message: "Case updated successfully!" });
  });
});


//delete case

app.delete("/delete-case", (req, res) => {
  console.log("Delete request received with body:", req.body); // Debugging log

  const { docket_no } = req.body;

  if (!docket_no) {
      console.error("No docket number provided.");
      return res.status(400).json({ message: "Docket number is required for deletion." });
  }

  const deleteQuery = "DELETE FROM cases WHERE TRIM(LOWER(DOCKET_NO)) = TRIM(LOWER(?))";

  db.query(deleteQuery, [docket_no.trim().toLowerCase()], (err, result) => {
      if (err) {
          console.error("Error deleting case:", err);
          return res.status(500).json({ message: "Error deleting case.", error: err.message });
      }

      if (result.affectedRows === 0) {
          console.warn("No matching case found for deletion.");
          return res.status(404).json({ message: "No matching case found." });
      }

      console.log("Case deleted successfully.");
      return res.json({ message: "Case deleted successfully!" });
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
