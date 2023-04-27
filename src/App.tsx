//http://127.0.0.1:5000/

import './App.css';
import React, { useState, useEffect, useRef} from 'react';
import axios from "axios";
import {handleDownload, handleUpload} from './service/upload.tsx'
import PoliticanSelect from "./components/politicanSelect.tsx"
//import Alert from "./components/loading_alert.tsx";
import io, {Socket} from 'socket.io-client';
import {RequestType} from "./types/request.type"; //import the request type which will be passed to the backend
import {
  Alert,
  AppBar, Box, Button, Card, Container,
  createTheme,
  CssBaseline, FormControl, Grid, Input,
  Paper, Snackbar, TextField,
  Theme,
  ThemeProvider,
  Toolbar,
  Typography
} from "@mui/material";

function App() {
  const theme:Theme = createTheme();
  const [image, setImage] = useState(null);
  // TODO: recentyly changed the var deepfake to be a list of deepfakes. This needs to be tested
  const [deepfake, setDeepfake] = useState([]);
  const [counter,setCounter] = React.useState<Int32>(0);
  // the true state of the slider is for the video
  const [sliderState, setSliderState] = useState(true);
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const [connected, setConnected] = React.useState<boolean>(false);
  const [serverMessage, setServerMessage ] = React.useState<string>('');
  const [socket,setSocket] = React.useState<Socket|undefined>(undefined);
  const [imgId, setImgId] = React.useState<string|undefined>('');
  const [serverUrl,setServerUrl] = React.useState<string>('')

  const handleTakePhoto = () => {
    const video = videoRef.current;
    const canvas = imageRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width,canvas.height);
    //setImage(canvas.toDataURL("image/png"));
    canvas.toBlob( (blob) => {
        setImage(blob);
      }
    )
    video.pause();
    setCounter(counter+1);
    setImgId("snapshot_nr"+(counter+1)+".png"); //TODO: this is super weird but only way it works for now
    //console.log("Counter : "+counter+" imgId : "+imgId);
  };

  const getVideo = () => {
    navigator.mediaDevices.getUserMedia({
        video: {width: 1920, height:1080}
      }).then(stream => {
        let video = videoRef.current; 
        video.srcObject = stream;
        video.play().catch(err => {
          console.log(err);
        });
      }).catch(err => {
        console.log(err);
      })
  };

  const handleRetakePhoto = () => {
    setImage(null);
    setDeepfake([]);
  };

  const handleImmunization = () => {
    /*
    Method to immunize an image
    */
    if (sliderState==false)  {
      

    } else {
      if (image) {
        handleUpload(imgId,image)
        handleOperationReturn(true,"immunize",{"attack_name":"fast","file_id":imgId})
      }
    }
  };


  const handleGenerateDeepfake = () => {
    /*
    Method to generate a deepfake
    */
    if (sliderState==false)  {
      // TODO : Pregenerate these deepfakes and store them in the backend for faster access during waiting times
    } else {
      if (image) {
        handleUpload(imgId,image)
        handleOperationReturn(true,"deepfake",{"attack_name":"stable_diffusion_inpainting","file_id":imgId})

        // Alert window to inform the user that the deepfake is being generated
        const alert_message = "SUCCES: The deepfakes are being generated. Please wait while we are doing the hard part. You can have \
        a look at the pregenerated deepfakes of politicans in the meantime in the meantime (use slidebar on top). \
        Come back here once your deepfakes are ready. You will be notified."
        //setTimeout(function() { alert(alert_message); }, 1);
        alert(alert_message); //TODO : replace with a nice alert window
      } else {
        console.log("Please first take an image.")
      }
    }
  };

  const handleOperationReturn = (success:boolean,operation:string|undefined,params:Record<string, string>) =>{
    const newRequest:RequestType = {} as RequestType

    newRequest.operation_parameters = params
    newRequest.operation= operation as string 
    // these are never used in the backend, there we only use file_id which is in the parameters
    newRequest.image_id=imgId as string   //Need this so that different requests are different from each other, otherwise useless
    newRequest.image_url="" as string     //Never used in the backend, will keep it for now

    socket?.emit("request/new",JSON.stringify(newRequest),(response, result) => {
      response = JSON.parse(response);
      console.log(`Front: Request ${JSON.stringify(newRequest)} ${result}`)
      if (response["operation"] == "deepfake") {
        alert("Your Deepfakes are ready ! Use the Slidebar to go back to previous page and insepct them!");
        (async () => {
          // Not sure why but I need this loop. Otherwise the code breaks
          for (let i = 0; i < 4; i++) {
            // We generate 4 deepfakes to display them in the frontend
            let response_download = await handleDownload(response[i]["image_id"]);
            setDeepfake([...deepfake, response_download?.data]);
          } 
        })();
      };
    })
    // console.log(JSON.stringify(newRequest))
    // console.log(`Operation definition : ops[${operation}] with parameters ${JSON.stringify(params)}`)
  }

  const handleConnect = () => {
    /*
    Establishes connection with the Backend & contains client endpoints
    */
    const _socket = io(serverUrl);

    _socket.on("connect_error", (err) => {
      console.log(`CONNECTION ERROR to ${serverUrl} reason : ${err}`);
      _socket.close();
      setServerMessage(err.message);
      setConnected(false);
    })

    _socket.on("connect", () => {
        console.log(_socket.id); // x8WIv7-mJelg7on_ALbx
        setConnected(true);
        setSocket(_socket);
        setServerMessage("Front: Server connected");
    });

    _socket.on("error", (err) => {
      console.log(err);
      setServerMessage(err);
    });

    _socket.on("requestReceived", () => {
      console.log("Front: Request received");
      setServerMessage("Front: Request received");
    });

    _socket.on("error_request", (err) => {
      console.log(err.data);
      setServerMessage(err.data);
    });

    _socket.on("result", (res) => {
      setServerMessage(res.data);
      console.log(res.data);
    });

  };

  const handleDisconnect = () => {
    socket?.disconnect()
    setConnected(false)
  };

  const renderdeepfake = () => {
    /*
    Method to render the deepfakes
    Deepfakes are stored in a array of blobs, so we need to map them in order to display them
    */
    if (deepfake == []) {
      return "";
    } else {
      return (
        sliderState 
        ? 
          deepfake.map((element, index) => 
            <img key={index} className="deepfake" src={URL.createObjectURL(element)}/>
          )
        :
          deepfake.map((element, index) => 
            <img key={index} className="deepfake" src={URL.createObjectURL(element)}/>
          )
      );
    }
  };

  const handlerSliderChange = () => {
    setDeepfake([]); //setImage(null); Want to keep the image even when browsing the politicians
    var slider = document.getElementById("slider");
    if (slider.checked) {
      getVideo(); 
      setSliderState(true);
    } else {
      videoRef.current.pause();
      setSliderState(false);
    }
  };

  useEffect(() => {
    if (sliderState) {
      getVideo();
    }
  }, [image]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
        <AppBar
            position="absolute"
            color="default"
            elevation={0}
            sx={{
                position: 'relative',
                borderBottom: (t) => `1px solid ${t.palette.divider}`,
            }}
        >
            <Toolbar>
                <Typography variant="h6" color="inherit" noWrap>
                    Svalinn Partnership Demo
                </Typography>
            </Toolbar>
        </AppBar>

        <div className='main' align-items="center">
          <Container vertical-align= {"middle"}>
            <p>Server message: {serverMessage}</p>
          </Container>

          <Container vertical-align= {"middle"}>
            <Grid container marginTop={"5em"} alignItems={"center"} spacing={2}>
                <Grid item xs={6}>
                    <TextField fullWidth type={"text"} label={"server URL"} onChange={(e) => setServerUrl(e.target.value)}/>
                </Grid>
                <Grid item xs={3}>
                    <Button variant={"contained"} color={"success"} onClick={handleConnect} disabled={connected}>Connect</Button>
                </Grid>
                <Grid item xs={3}>
                    <Button variant={"contained"} color={"error"} disabled={!connected} onClick={handleDisconnect}>Disconnect</Button>
                </Grid>
            </Grid>
          </Container>
            

          <Container style={{ border: "1px solid black", padding: "10px" }} maxWidth="lg" vertical-align= {"middle"}>

            <div className="title">
              <h1>Deepfake Generator</h1>
              <p>Take a photo of yourself or one of your favorite politician to generate a deepfake picture!</p>
            </div>

            <label className="switch">
              <input type="checkbox" id="slider" ></input>
              <span className="slider round" onClick={handlerSliderChange}></span>
            </label>

            {
              (sliderState==false) ? 
              <PoliticanSelect key={1}/> 
              :
              <div>
                <div hidden={(image!==null || sliderState==false)}>
                    <video id="video" ref={videoRef}></video> 
                    <div align-items="center">
                        <button className="inPicture" onClick={handleTakePhoto}>Take Photo</button>
                    </div>
                </div>
                
                <div hidden={(image==null && sliderState==true)}>
                    <canvas id="image" ref={imageRef}></canvas>
                    <div align-items="center" hidden={(image==null)}>
                        <button className="inPicture" onClick={handleRetakePhoto}>Take Another Photo </button>
                    </div>
                </div>
            </div>
            }
        
            <button onClick={handleGenerateDeepfake}>
              Generate deepfake
            </button>
            <div style={{ width:"60%"}}>
              <pre>Tipp: If the deep fakte generation takes too long with your own picture, <br />
              then we recommand trying out a picture of a politician. But, don't worry, we <br />
              will be sure to send you your picture via Mial. </pre>
            </div>

            <div style={{ border: "1px solid black", padding: "10px" }} hidden={!deepfake}>
              {renderdeepfake()}   
              <button onClick={handleImmunization}>
                Immunize
              </button>
            </div>

            <div align-items="center" style={{ border: "1px solid black", padding: "10px", width: "80%" }}>
              <h1>
                Contact details:
              </h1>
              Mailing Address: 
              <div align-items="center">
                <input type="text" name="Mail" placeholder="Enter your mailing address"></input>
              </div>
            </div>
          </Container>
        </div>
    </ThemeProvider>
  );
};

export default App;
