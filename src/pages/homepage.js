import React from 'react';
import logo from '../assets/logo.png';
import './homepage.css';


const Homepage = () => {

    return (
        <div class = "circle">
        {/* logo image */}
    
    <p className='general-font' style={{marginLeft: '30px', textAlign: 'center', marginTop: '50px'}}>Tagbilaran City - Hall of Justice</p>
      
    <p className='general-font' style={{marginLeft: '30px', textAlign: 'center',  marginTop: '20px'}}> Office of the City Prosector</p>


    <hr width="70%" size="2" color="blue" style={{marginLeft:'200px'}} noshade></hr>
    <div className="d-flex justify-content-center align-items-center" 
    style={{ marginTop:'30px', marginBottom:'50px'}}>
        <img 
        src={logo}
        alt="DOJ PH LOGO"
        style={{ width: '500px', height: '500px' }} 
      />
    </div> 


        </div> // end of parent div
    );
};

export default Homepage;