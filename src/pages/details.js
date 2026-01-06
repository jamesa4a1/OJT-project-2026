
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const Details = () => {
  const { docketNo } = useParams();
  const navigate = useNavigate();
  const [caseDetails, setCaseDetails] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        console.log("Fetching details for case:", docketNo);
        const response = await axios.get(`http://localhost:5000/get-case?docket_no=${docketNo}`);
        if (response.data.length > 0) {
          setCaseDetails(response.data[0]); // Set first matching case
        } else {
          setError("No case found.");
        }
      } catch (err) {
        setError("Error fetching case details.");
        console.error("Fetch error:", err);
      }
    };

    fetchCaseDetails();
  }, [docketNo]);

  if (error) {
    return <div className="container mt-4 alert alert-danger">{error}</div>;
  }

  if (!caseDetails) {
    return <div className="container mt-4">Loading case details...</div>;
  }

  return (
    <div className="container mt-4 mb-5">
      <h2 className="text-center mb-4">Case Details</h2>
      <div className="card shadow p-4">
        <div className="row">
          <div className="col-md-6">
            <p><strong>Docket No:</strong> {caseDetails.DOCKET_NO}</p>
            <p><strong>Date Filed:</strong> {caseDetails.DATE_FILED}</p>
            <p><strong>Complainant:</strong> {caseDetails.COMPLAINANT}</p>
            <p><strong>Respondent:</strong> {caseDetails.RESPONDENT}</p>
            <p><strong>Offense:</strong> {caseDetails.OFFENSE}</p>
          </div>
          <div className="col-md-6">
            <p><strong>Date Resolved:</strong> {caseDetails.DATE_RESOLVED || "N/A"}</p>
            <p><strong>Resolving Prosecutor:</strong> {caseDetails.RESOLVING_PROSECUTOR || "N/A"}</p>
            <p><strong>Criminal Case No:</strong> {caseDetails.CRIM_CASE_NO || "N/A"}</p>
            <p><strong>Branch:</strong> {caseDetails.BRANCH || "N/A"}</p>
            <p><strong>Date Filed in Court:</strong> {caseDetails.DATEFILED_IN_COURT || "N/A"}</p>
          </div>
        </div>
        <hr />
        <p><strong>Remarks:</strong> {caseDetails.REMARKS || "N/A"}</p>
        <p><strong>Penalty:</strong> {caseDetails.PENALTY || "N/A"}</p>
        <p><strong>Index Cards:</strong> {caseDetails.INDEX_CARDS ? (
          <a href={caseDetails.INDEX_CARDS} target="_blank" rel="noopener noreferrer">
            View File
          </a>
        ) : "No file attached"}</p>

        <div className="text-center mt-3">
          <button className="btn btn-primary me-2" onClick={() => navigate(-2)}>Go to Menu</button>
        </div>
      </div>
    </div>
  );
};

export default Details;