import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const Deletecase = () => {
    const [searchQuery, setSearchQuery] = useState({ DOCKET_NO: "", RESPONDENT: "" });
    const [caseData, setCaseData] = useState(null);
    const [error, setError] = useState("");
    const [searchPerformed, setSearchPerformed] = useState(false);
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [selectedCase, setSelectedCase] = useState(null); 
     
    const handleChange = (e) => {
      const { name, value } = e.target;
      setSearchQuery((prevQuery) => ({
          ...prevQuery,
          [name]: value,
      }));
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

    const handleDelete = async () => {
      if (!selectedCase || !selectedCase.DOCKET_NO) {
          alert("No case selected for deletion.");
          return;
      }
  
      try {
          console.log("Sending delete request for Docket No:", selectedCase.DOCKET_NO);
  
          const response = await axios.delete("http://localhost:5000/delete-case", {
              data: { docket_no: selectedCase.DOCKET_NO }, // Correctly passing the docket number
              headers: { "Content-Type": "application/json" }
          });
  
          console.log("Delete response:", response.data);
          alert(response.data.message);
  
          // Remove the deleted case from UI
          setCaseData(prevCases => prevCases.filter(c => c.DOCKET_NO !== selectedCase.DOCKET_NO));
  
          setSelectedCase(null);
          setShowModal(false);
      } catch (err) {
          console.error("Error deleting case:", err.response?.data || err.message);
          alert(err.response?.data?.message || "Error deleting case.");
      }
  };
  
 
    return (
        <div>


        {/* BACK BUTTON  */} 
        <button type="button" className="btn btn-outline-dark" 
                style={{ marginBottom: '10px', marginLeft:'120px', marginTop:'20px' }}
                onClick={() => navigate("/cases")}>
                BACK
        </button>

      <h2 style={{textAlign:'center', marginTop: '20px'}}>SEARCH FOR A CASE</h2>


            {/* SEARCH FORM */}
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

                    <button className="btn btn-dark" type="submit"
                        style={{ display: 'block', margin: '0 auto' }}>
                        Search
                    </button>
                </form>
            </div>

            <h3 style={{ textAlign: 'center', marginTop:'30px' }}>CASES THAT MATCH YOUR SEARCH</h3>

            {searchPerformed && caseData && caseData.length > 0 ? (
                caseData.map((item, index) => (
                    <div key={index} className="card border-secondary mb-3"
                        style={{ maxWidth: "18rem", marginLeft: '100px' }}>
                        <div className="card-body">
                            <h5 className="card-title">Case:</h5>
                            <p className="card-text"><strong>Docket No:</strong> {item.DOCKET_NO}</p>
                            <p className="card-text"><strong>Respondent:</strong> {item.RESPONDENT}</p>
                            <p className="card-text"><strong>Offense:</strong> {item.OFFENSE}</p>

                            <button type="button" className="btn btn-danger" 
                             onClick={() => { setSelectedCase(item); setShowModal(true); }}>
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                ))
            ) : searchPerformed ? (
                <p style={{ textAlign: 'center', color: 'red' }}>No matching cases found.</p>
            ) : null}
    {/*sure na sure iddelete mo yan?? */}
    {showModal && selectedCase && (
              <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">You are about to delete a case!</h5>
                      <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                    </div>
                    <div className="modal-body">
                      <p>Are you sure you want to delete this case?</p>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button> {/* 🔴 FIXED */}
                      <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            )}


        </div> // end of parent div
    );
};

export default Deletecase;
