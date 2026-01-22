/**
 * Example Express route handler with Zod validation
 * Backend example showing how to use Zod schemas
 * 
 * Usage in your server.js or api routes:
 * const { createCaseHandler } = require('./handlers/caseHandler');
 * app.post('/api/cases', createCaseHandler);
 */

const { validateCaseCreateOrThrow } = require('../src/schemas/cases');
const { ApiResponse, asyncHandler } = require('./utils/apiResponse');

/**
 * Create a new case with Zod validation
 */
const createCaseHandler = asyncHandler(async (req, res) => {
  // Validate request body using Zod schema
  // This ensures type safety on the backend
  let validatedData;
  
  try {
    validatedData = validateCaseCreateOrThrow(req.body);
  } catch (validationError) {
    // Zod throws detailed validation errors
    return res.status(400).json(
      ApiResponse.validationError([
        validationError.message || 'Invalid request data',
      ])
    );
  }

  // Now validatedData is guaranteed to match CaseCreate type
  // TypeScript knows exactly what properties are available

  try {
    // Insert into database
    const query = `
      INSERT INTO cases (
        DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, 
        ADDRESS_OF_RESPONDENT, OFFENSE, DATE_OF_COMMISSION, BRANCH
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      validatedData.docketNo,
      validatedData.dateFiled,
      validatedData.complainant,
      validatedData.respondent,
      validatedData.addressOfRespondent,
      validatedData.offense,
      validatedData.dateOfCommission,
      validatedData.branch,
    ];

    // Execute query (pseudo-code)
    // const result = await db.query(query, values);

    // Return success response
    return res.status(201).json(
      ApiResponse.success('Case created successfully', {
        id: 1, // result.insertId
        ...validatedData,
      })
    );
  } catch (error) {
    return res.status(500).json(
      ApiResponse.error('Failed to create case', [error.message], 500)
    );
  }
});

/**
 * Get cases with optional filtering
 */
const getCasesHandler = asyncHandler(async (req, res) => {
  try {
    // Retrieve cases from database
    // const cases = await db.query('SELECT * FROM cases');

    // Optionally validate the response using Zod
    // const validatedCases = validateCasesArray(cases);

    return res.status(200).json(
      ApiResponse.success('Cases retrieved successfully', [
        // cases
      ])
    );
  } catch (error) {
    return res.status(500).json(
      ApiResponse.error('Failed to retrieve cases', [error.message], 500)
    );
  }
});

/**
 * Update case with validation
 */
const updateCaseHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate request body
  let validatedData;
  try {
    validatedData = validateCaseCreateOrThrow(req.body);
  } catch (validationError) {
    return res.status(400).json(
      ApiResponse.validationError([validationError.message])
    );
  }

  try {
    // Update database
    // const result = await db.query('UPDATE cases SET ... WHERE id = ?', [...values, id]);

    return res.status(200).json(
      ApiResponse.success('Case updated successfully', {
        id: parseInt(id),
        ...validatedData,
      })
    );
  } catch (error) {
    return res.status(500).json(
      ApiResponse.error('Failed to update case', [error.message], 500)
    );
  }
});

module.exports = {
  createCaseHandler,
  getCasesHandler,
  updateCaseHandler,
};
