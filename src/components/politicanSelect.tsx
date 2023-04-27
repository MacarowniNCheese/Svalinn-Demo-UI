
import React, { useState} from 'react';

function PoliticanSelect(props) {
  const [pictures, setPictures] = useState([]);

  const renderImages = () => {
    //this does not work, cannot find the images when going through the function call, weird
    const listNames = ["macron", "vonDerLeyen", "bettel", "scholz"];
    for (let i = 0; i < listNames.length; i++) {
      listNames[i] = "./Politicians/" + listNames[i]  + ".jpg";
    }
    console.log(listNames);
    return (
      listNames.map((name, index) => (
        <div className="column" key={index} >
          <img src={require(name)} key={index} width="100%" onClick={(e) => handleChangePolitician(e)}/>
        </div>
      ))
    );
  } 

  const handleChangePolitician = (e) => {
    var bigImg = document.getElementById("selectedPoliticianImage");
    bigImg.src = e.target.src;
  } 

  return(
    <div style={{width:"90%"}} align-items="center">
      <div className="row" key={0}>
        <p> Here is a list of your favorite political figures! </p>
        <div className="column" key={0}>
            <img src={require("./Politicians/vonDerLeyen.jpg")} width="100%"
              onClick={(e) => handleChangePolitician(e)}
            />
          </div>
          <div className="column" key={1}>
            <img src={require("./Politicians/scholz.jpg")}  width="100%"
              onClick={(e) => handleChangePolitician(e)}
            />
          </div>
          <div className="column" key={2}>            
            <img src={require("./Politicians/macron.jpg")}  width="100%"
              onClick={(e) => handleChangePolitician(e)}
            />
          </div>
          <div className="column" key={3}>
            <img src={require("./Politicians/bettel.jpg")}  width="100%"
              onClick={(e) => handleChangePolitician(e)}
            />
          </div>
      </div>
      <div align-items="center">
        <img src={require("./Politicians/vonDerLeyen.jpg")} id="selectedPoliticianImage" style={{width:"70%"}}/>
      </div>
    </div>
  )
}

export default PoliticanSelect