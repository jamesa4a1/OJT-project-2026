import React from 'react';
import Footer from '../components/footer';

const About = () => {
    return (
        
    <div> {/* start of parent div */}

    {/* Container div */}
    <div className='container border
    border-dark rounded
    position-absolute top-50 start-50 translate-middle'>

            <div id="textCarousel" className="carousel slide  h-75" data-bs-ride="carousel">
            <div class="carousel-inner">

                <div className="carousel-item active text-center bg-light py-5 h-75">
                <h3>Department of Justice</h3>
                <p>
                The Department of Justice (DOJ) of the Philippines serves as the government’s 
                main legal authority.
                It provides legal advice and representation
                to the Republic of the Philippines, its branches, agencies, and instrumentalities.
                </p>
                </div>


                <div className="carousel-item active text-center bg-light py-5 h-75">
                <h3>Hall of Justice - Tabilaran City</h3>
                <p>
               <strong> Address:  </strong> 
                Carlos P. Garcia E Ave, Tagbilaran City, 6300 Bohol, Philippines
                </p>
                </div>

            

            

            </div>


            <button className="carousel-control-prev" type="button" data-bs-target="#textCarousel" data-bs-slide="prev">
                <span className="carousel-control-prev-icon"></span>
                <span className="visually-hidden">Previous</span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#textCarousel" data-bs-slide="next">
                <span className="carousel-control-next-icon"></span>
                <span className="visually-hidden">Next</span>
            </button>

            </div>


    </div> {/* container div */}

    </div> // end of parent div
    );
};

export default About;