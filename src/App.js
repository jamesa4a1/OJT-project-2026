import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from './components/navbar';
import Footer from './components/footer';
//pages
import Cases from './pages/cases';
import Caselist from './pages/caselist';
import Newcase from './pages/newcase';
import Findcase from './pages/findcase';
import Deletecase from './pages/deletecase';
import Editcase from './pages/editcase';
import Homepage from './pages/homepage';
import About from './pages/aboutus';
import Details from './pages/details';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Component } from 'react';
// design
import "@fortawesome/fontawesome-free/css/all.min.css";



function App() {
  return (
    <Router>
     <div className="d-flex flex-column min-vh-100">
      

        <Navbar/>
        
        <div className="flex-grow-1"> 
        <Routes>

        <Route path="/" element={<Navigate to="/homepage" replace />} />

           <Route path="/cases" element={<Cases/>} />
           <Route path="/caselist" element={<Caselist/>} />
           <Route path="/newcase" element={<Newcase/>} />
           <Route path="/findcase" element={<Findcase/>} />
           <Route path="/deletecase" element={<Deletecase/>}/>
           <Route path="/editcase" element={<Editcase/>} />
           <Route path="/homepage" element={<Homepage/>} />
           <Route path="/aboutus" element={<About/>} />
           <Route path="/cases" element={<Cases/>} />
           <Route path="/details/:docketNo" element={<Details />} />

        </Routes>
        </div>

        <Footer/>

      </div>  {/* end of parent div - app */}

    
    </Router>
  );
}

export default App;
