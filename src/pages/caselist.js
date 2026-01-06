import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Caselist = () => {
  const [cases, setCases] = useState([]);
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState("RESPONDENT"); // default option
  const [sortDirection, setSortDirection] = useState("asc"); // a-z and z-a



  useEffect(() => {
    axios.get("http://localhost:5000/cases")
      .then(response => {
        setCases(response.data);
      })
      .catch(error => {
        console.error("There was an error fetching the cases!", error);
      });
  }, []);

  // sorting
  const handleSort = (option, direction) => {
    setSortOption(option);
    setSortDirection(direction);

    const sortedCases = [...cases].sort((a, b) => {
      if (a[option] < b[option]) return direction === "asc" ? -1 : 1;
      if (a[option] > b[option]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setCases(sortedCases);
  };


  return (
    <div className="container mt-4">
      
      {/* Back button */}
      <button type="button" className="btn btn-dark mb-3"
        onClick={() => navigate("/cases")}>
        Back
      </button>
      <br/>
      <div className="d-flex align-items-center">
        <p className="mb-0 me-2">Sort From:</p>
        <select className="form-select w-auto" 
          onChange={(e) => handleSort(sortOption, e.target.value)}>
          <option value="asc">A-Z</option>
          <option value="desc">Z-A</option>
        </select>
      </div>
              
      <h3>Complete list of Cases</h3>
      <table className="table table-striped-columns">
        <thead>
          <tr>
            <th>Docket Number</th>
            <th>Complainant</th>
            <th>Respondent</th>
            <th>More Details</th> 
          </tr>
        </thead>
        <tbody>
          {cases.map((caseItem, index) => (
            <tr key={caseItem.DOCKET_NO}>
              <td>{caseItem.DOCKET_NO}</td>
              <td>{caseItem.COMPLAINANT}</td>
              <td>{caseItem.RESPONDENT}</td>
              <td>
                {/* View Full Details Button */}
                <button
                  className="btn btn-info btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target={`#detailsModal-${index}`}
                >
                  More Details
                </button>

                {/* modal */}
                <div
                  className="modal fade"
                  id={`detailsModal-${index}`}
                  tabIndex="-1"
                  aria-labelledby={`detailsModalLabel-${index}`}
                  aria-hidden="true"
                >
                  <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title" id={`detailsModalLabel-${index}`}>
                          Case Details
                        </h5>
                        <button
                          type="button"
                          className="btn-close"
                          data-bs-dismiss="modal"
                          aria-label="Close"
                        ></button>
                      </div>
                      <div className="modal-body">
                        <p><strong>Docket Number:</strong> {caseItem.DOCKET_NO}</p>
                        <p><strong>Docket Filed:</strong> {caseItem.DATE_FILED}</p>
                        <p><strong>Complainant:</strong> {caseItem.COMPLAINANT}</p>
                        <p><strong>Respondent:</strong> {caseItem.RESPONDENT}</p>
                        <p><strong>Offense:</strong> {caseItem.OFFENSE}</p>
                        <p><strong>Date Resolved:</strong> {caseItem.DATE_RESOLVED}</p>
                        <p><strong>Resolving Prosecutor:</strong> {caseItem.RESOLVING_PROSECUTOR}</p>
                        <p><strong>Criminal Case Number:</strong> {caseItem.CRIM_CASE_NO}</p>
                        <p><strong>Branch:</strong> {caseItem.BRANCH}</p>
                        <p><strong>Date Filed in Court:</strong> {caseItem.DATEFILED_IN_COURT}</p>
                        <p><strong>Remarks:</strong> {caseItem.REMARKS}</p>
                        <p><strong>Penalty:</strong> {caseItem.PENALTY}</p>
                        <p>
                        <strong>Index Card:</strong>{" "}
                        {caseItem.INDEX_CARDS ? (
                          <a href={caseItem.INDEX_CARDS} target="_blank" rel="noopener noreferrer">
                            View Index Card
                          </a>
                        ) : (
                          "No index card available"
                        )}
                      </p>

                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Caselist;
