import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

const Findcase = () => {
  const [searchQuery, setSearchQuery] = useState({
    DOCKET_NO: "",
    RESPONDENT: "",
    RESOLVING_PROSECUTOR: "",
    REMARKS: "",
    start_date: "", 
    end_date: ""
  });
  
  const [caseData, setCaseData] = useState([]);
  const [error, setError] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setSearchQuery({ ...searchQuery, [e.target.name]: e.target.value });
  };

  // Converts DD/MM/YYYY to YYYY-MM-DD if needed
  const convertToYMD = (input) => {
    if (!input || input.includes('-')) return input; 
    const [day, month, year] = input.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const formattedStartDate = convertToYMD(searchQuery.start_date);
    const formattedEndDate = convertToYMD(searchQuery.end_date);

    if (
      !searchQuery.DOCKET_NO &&
      !searchQuery.RESPONDENT &&
      !searchQuery.RESOLVING_PROSECUTOR &&
      !searchQuery.REMARKS &&
      !formattedStartDate &&
      !formattedEndDate 
    ) {
      setError("Please enter at least one search criteria.");
      return;
    }

    try {
      console.log("Sending to API:", {
        docket_no: searchQuery.DOCKET_NO,
        respondent: searchQuery.RESPONDENT,
        resolving_prosecutor: searchQuery.RESOLVING_PROSECUTOR,
        remarks: searchQuery.REMARKS,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
      });

      const response = await axios.get("http://localhost:5000/get-case", {
        params: {
          docket_no: searchQuery.DOCKET_NO,
          respondent: searchQuery.RESPONDENT,
          resolving_prosecutor: searchQuery.RESOLVING_PROSECUTOR,
          remarks: searchQuery.REMARKS,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        }        
      });

      console.log("API Response:", response.data);

      if (Array.isArray(response.data) && response.data.length > 0) {
        setCaseData(response.data);
        setError("");
      } else {
        setCaseData([]);
        setError("No matching case found.");
      }
    } catch (err) {
      console.error("API Error:", err.response || err);
      setError("An error occurred while fetching cases.");
      setCaseData([]);
    }

    setSearchPerformed(true);
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginTop: '20px' }}>SEARCH FOR A CASE</h2>

      <button
        type="button"
        className="btn btn-outline-dark"
        style={{ marginBottom: '20px', marginLeft: '120px' }}
        onClick={() => navigate("/cases")}
      >
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

          <div className="input-group mb-3">
            <span className="input-group-text">Prosecutor</span>
            <input
              type="text"
              name="RESOLVING_PROSECUTOR"
              value={searchQuery.RESOLVING_PROSECUTOR}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter Prosecutor Name"
            />
          </div>

          <div className="input-group mb-3">
            <span className="input-group-text">Decision</span>
            <input
              type="text"
              name="REMARKS"
              value={searchQuery.REMARKS}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter Decision"
            />
          </div>

          <div className="input-group mb-3">
            <span className="input-group-text">Date Filed: From</span>
            <input
              type="date"
              name="start_date"
              value={searchQuery.start_date}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="input-group mb-3">
            <span className="input-group-text">To</span>
            <input
              type="date"
              name="end_date"
              value={searchQuery.end_date}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <button className="btn btn-dark" type="submit" style={{ display: 'block', margin: '0 auto' }}>
            Search
          </button>

          {error && <p className="text-danger mt-3">{error}</p>}
        </form>
      </div>

      <h2 style={{ textAlign: 'center', marginTop: '20px' }}>SEARCH RESULTS</h2>

      {searchPerformed && caseData.length > 0 ? (
        <div className="container mt-4 mb-5">
          <div className="accordion mt-4" id="accordionExample">
            {caseData.map((item, index) => (
              <div className="accordion-item mb-3 border border-primary" key={index}>
                <h2 className="accordion-header">
                  <button
                    className="accordion-button"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#collapse${index}`}
                    aria-expanded="true"
                    aria-controls={`collapse${index}`}
                  >
                    <strong>DOCKET_NO:</strong> {item.DOCKET_NO} &nbsp;
                    <strong>RESPONDENT:</strong> {item.RESPONDENT}
                    <strong>PROSECUTOR:</strong> {item.RESOLVING_PROSECUTOR}
                    <strong>DECISION:</strong> {item.REMARKS}
                    <strong>DATE FILE FROM:</strong> {item.start_date}
                    <strong>TO:</strong> {item.end_date}
                  </button>
                </h2>

                <div
                  id={`collapse${index}`}
                  className="accordion-collapse collapse"
                  data-bs-parent="#accordionExample"
                >
                  <div className="accordion-body">
                    <strong>Full Case Details</strong> <br /><br />
                    <strong>DOCKET_NO:</strong> {item.DOCKET_NO || "N/A"} <br />
                    <strong>DATE FILED:</strong> {item.DATE_FILED || "N/A"} <br />
                    <strong>COMPLAINANT:</strong> {item.COMPLAINANT || "N/A"} <br />
                    <strong>RESPONDENT:</strong> {item.RESPONDENT || "N/A"} <br />
                    <strong>OFFENSE:</strong> {item.OFFENSE || "N/A"} <br />
                    <strong>DATE RESOLVED:</strong> {item.DATE_RESOLVED || "N/A"} <br />
                    <strong>RESOLVING_PROSECUTOR:</strong> {item.RESOLVING_PROSECUTOR || "N/A"} <br />
                    <strong>CRIMINAL CASE NUMBER:</strong> {item.CRIM_CASE_NO || "N/A"} <br />
                    <strong>BRANCH:</strong> {item.BRANCH || "N/A"} <br />
                    <strong>DATE FILED IN COURT:</strong> {item.DATEFILED_IN_COURT || "N/A"} <br />
                    <strong>DECISION:</strong> {item.REMARKS || "N/A"} <br />
                    <strong>PENALTY:</strong> {item.PENALTY || "N/A"} <br />
                    <p>
  <strong>Index Card:</strong>{" "}
  {item.INDEX_CARDS ? (
    <a href={item.INDEX_CARDS} target="_blank" rel="noopener noreferrer">
      View Index Card
    </a>
  ) : (
    "No index card available"
  )}
</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : searchPerformed && caseData.length === 0 && error === "" ? (
        <p className="mt-3">No results to display.</p>
      ) : null}
    </div>
  );
};

export default Findcase;
