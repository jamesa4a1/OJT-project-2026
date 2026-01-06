import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import '../styles/button.css';
import axios from "axios";

const Newcase = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        DOCKET_NO: "",
        DATE_FILED: "",
        COMPLAINANT: "",
        RESPONDENT: "",
        OFFENSE: "",
        DATE_RESOLVED: "",
        RESOLVING_PROSECUTOR: "",
        CRIM_CASE_NO: "N/A",
        BRANCH: "",
        DATEFILED_IN_COURT: "N/A",
        REMARKS: "",
        REMARKS_DECISION: "",
        PENALTY: "",
        INDEX_CARDS: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name.toUpperCase()]: value });
    };

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

       const cleanedData = Object.fromEntries(
  Object.entries(formData).map(([key, value]) => [key, value.trim() === "" ? "N/A" : value])
);

        console.log("Submitting cleaned data:", cleanedData);

        try {
            await axios.post("http://localhost:5000/add-case", cleanedData);
            alert("Case added successfully!");
            navigate("/caselist");
        } catch (error) {
            console.error("Error adding case:", error);
            alert("Failed to add case. Please try again.");
        }
    };

    return (
        <div>
            <h3 style={{textAlign: 'center', marginTop: '20px'}}>ADD NEW CASE</h3>

            {/* BACK BUTTON  */} 
            <button type="button" class="btn btn-outline-dark" 
            style={{ marginBottom: '20px', marginLeft: '120px', marginTop: '20px' }}
            onClick={() => navigate("/cases")}>
                BACK
            </button>

            {/* Form */}
            <div className="container-sm border-dark 
            rounded custom-bg-color shadow 
            mb-5 pt-4 pb-4">
                <form onSubmit={handleSubmit}>
                    <div className="input-group mb-3">
                        <span className="input-group-text">Docket/IS Case number</span>
                        <input type="text" name="DOCKET_NO" value={formData.DOCKET_NO} 
                        onChange={handleChange} className="form-control" placeholder="Docket/IS case number" required />
                    </div>

                    <div className="input-group mb-3">
                        <span className="input-group-text">Date Filed</span>
                        <input type="date" name="DATE_FILED" value={formData.DATE_FILED} onChange={handleChange} className="form-control" />
                    </div>

                    {/* Complainant -- Respondent */}
                    <div className="row g-3">
                        <div className="input-group mb-3 col-sm">
                            <span className="input-group-text">Complainant</span>
                            <input type="text" name="COMPLAINANT" value={formData.COMPLAINANT}
                             onChange={handleChange} className="form-control" placeholder="Complainant" />
                        </div>

                        <div className="input-group mb-3 col-sm">
                            <span className="input-group-text">Respondent</span>
                            <input type="text" name="RESPONDENT" value={formData.RESPONDENT} 
                            onChange={handleChange} className="form-control" placeholder="Respondent" required />
                        </div>
                    </div>

                    <div className="input-group mb-3">
                        <span className="input-group-text">Offense</span>
                        <input type="text" name="OFFENSE" value={formData.OFFENSE} 
                        onChange={handleChange} className="form-control" placeholder="Offense required" />
                    </div>

                    <div className="input-group mb-3">
                        <span className="input-group-text">Date Resolved</span>
                        <input type="date" name="DATE_RESOLVED" value={formData.DATE_RESOLVED} onChange={handleChange} className="form-control" />
                    </div>

                    {/* Resolving Prosecutor -- Court Details */}
                    <div className="row g-3">
                        <div className="input-group mb-3 col-sm">
                            <span className="input-group-text">Prosecutor</span>
                            <input type="text" name="RESOLVING_PROSECUTOR" value={formData.RESOLVING_PROSECUTOR} 
                            onChange={handleChange} className="form-control" placeholder="J. Doe" required />
                        </div>

                        <div className="input-group mb-3 col-sm">
                            <span className="input-group-text">Criminal Case Number</span>
                            <input type="text" name="CRIM_CASE_NO" value={formData.CRIM_CASE_NO} onChange={handleChange} className="form-control" placeholder="Case Number" />
                        </div>

                        <div className="input-group mb-3 col-sm">
                            <span className="input-group-text">Branch</span>
                            <input type="text" name="BRANCH" value={formData.BRANCH} onChange={handleChange} className="form-control" placeholder="Branch" />
                        </div>

                        <div className="input-group mb-3 col-sm">
                            <span className="input-group-text">Date Filed in Court</span>
                            <input type="date" name="DATEFILED_IN_COURT" value={formData.DATEFILED_IN_COURT} onChange={handleChange} className="form-control" />
                        </div>
                    </div>

                    <div className="input-group mb-3">
                        <span className="input-group-text">Decision</span>
                        <input type="text" name="REMARKS" value={formData.REMARKS} onChange={handleChange} className="form-control" placeholder="Decision" />
                    </div>

                    <div className="input-group mb-3">
                        <span className="input-group-text">Remarks</span>
                        <input type="text" name="REMARKS_DECISION" value={formData.REMARKS_DECISION} onChange={handleChange} className="form-control" placeholder="Remarks" />
                    </div>

                    <div className="input-group mb-3">
                        <span className="input-group-text">Penalty</span>
                        <input type="text" name="PENALTY" value={formData.PENALTY} onChange={handleChange} className="form-control" placeholder="Penalty" />
                    </div>

                    <div className="input-group mb-3 col-sm">
                        <span className="input-group-text">Index Card</span>
                        <input type="text" name="INDEX_CARDS" value={formData.INDEX_CARDS} onChange={handleChange} className="form-control" placeholder="Index Card" />
                    </div>

                    <button type="submit" className="btn btn-dark"
                    style={{display: 'block', margin: '0 auto'}}>
                    Submit
                    </button>

                
                </form>
            </div>
        </div>
    );
};

export default Newcase;
