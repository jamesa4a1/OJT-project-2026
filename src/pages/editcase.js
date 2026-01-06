import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const Editcase = () => {
  const [searchQuery, setSearchQuery] = useState({ DOCKET_NO: "", RESPONDENT: "" });
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState("");
  const [selectedFields, setSelectedFields] = useState({});
  const [editedValues, setEditedValues] = useState({});
  const [searchPerformed, setSearchPerformed] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setSearchQuery({ ...searchQuery, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.DOCKET_NO && !searchQuery.RESPONDENT) {
      setError("Please enter at least one search criteria.");
      return;
    }

    try {
      const response = await axios.get("http://localhost:5000/get-case", {
        params: {
          docket_no: searchQuery.DOCKET_NO,
          respondent: searchQuery.RESPONDENT,
        },
      });
      setCaseData(response.data);
      setError("");
    } catch (err) {
      setError("No matching case found or an error occurred.");
      setCaseData(null);
    }
    setSearchPerformed(true);
  };

  const fields = [
    { name: "DOCKET_NO", label: "Docket Number" },
    { name: "DATE_FILED", label: "Date Filed" },
    { name: "COMPLAINANT", label: "Complainant" },
    { name: "RESPONDENT", label: "Respondent" },
    { name: "OFFENSE", label: "Offense" },
    { name: "DATE_RESOLVED", label: "Date Resolved" },
    { name: "RESOLVING_PROSECUTOR", label: "Resolving Prosecutor" },
    { name: "CRIM_CASE_NO", label: "Criminal Case Number" },
    { name: "BRANCH", label: "Branch" },
    { name: "DATEFILED_IN_COURT", label: "Date Filed in Court" },
    { name: "REMARKS_DECISION", label: "Decision" },
    { name: "REMARKS", label: "Remarks" },
    { name: "PENALTY", label: "Penalty" },
    { name: "INDEX_CARDS", label: "Index Card" },
  ];

  const handleCheckboxChange = (caseIndex, field) => {
    setSelectedFields(prevState => {
      const prevFields = prevState[caseIndex] || {};
      return {
        ...prevState,
        [caseIndex]: {
          ...prevFields,
          [field]: !prevFields[field]
        }
      };
    });
  };

  const handleInputChange = (caseIndex, field, value) => {
    setEditedValues(prevState => ({
      ...prevState,
      [caseIndex]: {
        ...prevState[caseIndex],
        [field]: value
      }
    }));
  };

const handleSave = async (index) => {
  if (!editedValues[index] || Object.keys(editedValues[index]).length === 0) {
    alert("Please select at least one field and enter a value to update.");
    return;
  }

  const caseToUpdate = caseData[index];

  try {
    await axios.post("http://localhost:5000/update-case", {
      id: caseToUpdate.id,  // Use unique id here instead of docket_no
      updated_fields: editedValues[index],
    });
    alert("Case updated successfully!");
    navigate(`/details/${caseToUpdate.DOCKET_NO}`);
  } catch (error) {
    console.error("Error updating case:", error);
    alert("Failed to update case.");
  }
};



  return (
    <div>
      <h2 style={{ textAlign: 'center', marginTop: '20px' }}>SEARCH FOR A CASE</h2>

      <button type="button" className="btn btn-outline-dark"
        style={{ marginBottom: '20px', marginLeft: '120px' }}
        onClick={() => navigate("/cases")}>
        BACK
      </button>

      <div className="container custom-bg-color pt-5 pb-5 shadow">
        <form onSubmit={handleSearch}>
          <div className="input-group mb-3">
            <span className="input-group-text">Docket/IS Case Number</span>
            <input
              type="text"
              name="DOCKET_NO"
              value={searchQuery.DOCKET_NO}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter Docket/IS Case Number"
            />
          </div>

          <div className="input-group mb-3">
            <span className="input-group-text">Respondent</span>
            <input
              type="text"
              name="RESPONDENT"
              value={searchQuery.RESPONDENT}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter Respondent Name"
            />
          </div>

          <button className="btn btn-dark" type="submit" style={{ display: 'block', margin: '0 auto' }}>
            Search
          </button>
        </form>
      </div>

      <h3 style={{ textAlign: 'center', marginTop: '30px' }}>CASES THAT MATCH YOUR SEARCH</h3>

      {searchPerformed && caseData && caseData.length > 0 ? (
        <div className="container mt-4">
          <div className="row">
            {caseData.map((item, index) => (
              <div key={index} className="col-md-4 mb-4">
                <div className="card border-secondary h-100">
                  <div className="card-body">
                    <h5 className="card-title">Case:</h5>
                    <p className="card-text"><strong>Docket No:</strong> {item.DOCKET_NO}</p>
                    <p className="card-text"><strong>Respondent:</strong> {item.RESPONDENT}</p>
                    <p className="card-text"><strong>Offense:</strong> {item.OFFENSE}</p>

                    <button className="btn btn-primary" type="button" data-bs-toggle="offcanvas"
                      data-bs-target={`#offcanvas-${index}`} aria-controls={`offcanvas-${index}`}>
                      Edit this case
                    </button>

                    {/* Offcanvas */}
                    <div className="offcanvas offcanvas-bottom"
                      style={{ height: "90%" }}
                      tabIndex="-1" id={`offcanvas-${index}`}
                      aria-labelledby={`offcanvasLabel-${index}`}>
                      <div className="offcanvas-header">
                        <h5 className="offcanvas-title" id={`offcanvasLabel-${index}`}>
                          <strong>Case: {item.DOCKET_NO} -- Respondent: {item.RESPONDENT}</strong>
                        </h5>
                        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                      </div>

                      <div className="offcanvas-body small">
                        <form>
                          {fields.map((field, idx) => (
                            <div key={idx} className="form-check form-check-inline mb-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={selectedFields[index]?.[field.name] || false}
                                onChange={() => handleCheckboxChange(index, field.name)}
                                id={`fieldCheck-${index}-${field.name}`}
                              />
                              <label className="form-check-label" htmlFor={`fieldCheck-${index}-${field.name}`}>
                                {field.label}
                              </label>
                            </div>
                          ))}

                          {selectedFields[index] &&
                            Object.keys(selectedFields[index]).map(fieldName =>
                              selectedFields[index][fieldName] ? (
                                <div className="mb-3 mt-2" key={fieldName}>
                                  <label className="form-label">{fieldName}</label>
                                  <input
                                    type={fieldName.includes("DATE") ? "date" : "text"}
                                    className="form-control"
                                    placeholder={fieldName.includes("DATE") ? "YYYY-MM-DD" : ""}
                                    value={editedValues[index]?.[fieldName] || ""}
                                    onChange={(e) => handleInputChange(index, fieldName, e.target.value)}
                                  />
                                </div>
                              ) : null
                            )}

                         <button
                          type="button"
                          className="btn btn-success mt-3"
                          disabled={!selectedFields[index] || !Object.values(selectedFields[index]).includes(true)}
                          onClick={() => handleSave(index)}>
                          Save Changes
                        </button>
                       </form>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : searchPerformed && caseData && caseData.length === 0 ? (
        <p className="text-danger mt-3">No matching cases found.</p>
      ) : null}
    </div>
  );
};

export default Editcase;
