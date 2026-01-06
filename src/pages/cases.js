import React from 'react';
import { useNavigate } from "react-router-dom";




const Cases = () => {

    const navigate = useNavigate();

    return (

    <div>
        
     {/* TOP  */}

    {/* container */}
    <div className="container-fluid p-3 mb-5 mt-5 
    custom-bg-color border-dark rounded shadow"
     style={{ maxWidth: "600px", width: "90%" }}> 

<h3 style={{marginTop: '10px', color: 'black', fontStyle: 'Bebas Neue',
    textAlign: 'center'
 }}>
    SELECT A COURSE OF ACTION
</h3> 

    <div className=" d-flex justify-content-center gap-3 mt-6">

         {/* TOP */}
        <div className="btn-group btn-group-lg custom-btn-group"
         role="group" aria-label="Large button group">
            
            <button type="button" className="btn btn-outline-primary custom-border-color"
            onClick={() => navigate ("/newcase")}>
            Add new case
            </button>

        </div>

        <div className="btn-group btn-group-lg custom-btn-group" role="group" aria-label="Large button group">
            <button type="button" className="btn btn-outline-primary custom-border-color"
            onClick={() => navigate ("/findcase")}>
            Find case
            </button>
        </div>

    </div>


    {/* BOTTOM */}
    <div className='d-flex justify-content-center gap-3 mt-3'>
        <div className="btn-group btn-group-lg custom-btn-group" role="group" aria-label="Large button group">
            <button type="button" className="btn btn-outline-primary custom-border-color"
             onClick={() => navigate("/editcase")}>
                Edit case details</button>
        </div>

        <div className="btn-group btn-group-lg custom-btn-group" role="group" aria-label="Large button group">
            <button type="button" className="btn btn-outline-primary custom-border-color"
            onClick={() => navigate("/caselist")}>
                View all cases
            </button>
        </div>
        
    </div>

    {/* last row */}

    <div className='d-flex justify-content-center gap-3 mt-3'>
        <div className="btn-group btn-group-lg custom-btn-group" role="group" aria-label="Large button group">
            <button type="button" className="btn btn-outline-primary custom-border-color"
                onClick={() => navigate("/deletecase")}>
                Delete case
            </button>      
        </div>  
    </div>
     
    </div> {/* container */}
    </div> // end of parent div
      
    );
};

export default Cases;
