import axios from "axios";

const bucket_name = "svalinn-partnership-demo.appspot.com"
const gs_url = `https://firebasestorage.googleapis.com/v0/b/${bucket_name}/o`
const upload_operation = "uploadType=media"

const uploadFile = (image:any,name:string) :Promise<any> => {
    const formData = new FormData();
    formData.append(
        "myFile",
        image,
        name,
    );

    return axios.post(`${gs_url}?${upload_operation}&name=${name}`,formData)
}

export const handleUpload = (file_name:string,image:any) => {  
  /* 
  Function handles upload requests for files to the Google Cloud Storage bucket

  :param file_name: The name of the file to be uploaded
  :param image: The image to be uploaded

  :return: nothing
  */
  if (image) {
    console.log("File name to be uploaded : "+file_name)
    uploadFile(image,file_name).then(response => {
        const downloadToken = response.data.downloadTokens
        const url = `${gs_url}/${file_name}?alt=media&token=${downloadToken}`                
        console.log("Upload ok : "+url)
    }).catch(reject => {
        console.error(reject)
    })
  } else {
    console.log("Please first take an image.")
  }
}; 

async function _file_check(file_name) {
  /*
  Function checks a file for existence in the Google Cloud Storage bucket.
  
  :param file_name: The name of the file to be checked
  :return: promise of a dictionary containing int and string. Ex.: { code: 200, token: 'example_token' }
  */
  const url = `${gs_url}/${file_name}`;
  try {
    const res = await axios.get(url);
    if (res.status === 200) {
      const token = res.data.downloadTokens;
      return { code: res.status, token };
    } else {
      return { code: res.status, token: null };
    }
  } catch (err) {
    console.log(`Error trying to find File at url ${url}`);
    console.error(err);
    return { code: 404, token: null };
  }
}


export function handleDownload(file_name:string, adv_example:boolean=true) {
  /*
  Handles download requests for files from the Google Cloud Storage bucket

  :param file_name: The name of the file to be checked
  :adv_example: Boolean, if true, the adversarial example of the file will be downloaded

  :return: promise of a blob of the downloaded file
  */
  //return 0
  //Preprocess the name
  if (adv_example) {
    file_name = file_name.split(".")[0] + "_adv." + file_name.split(".")[1]
  }

  //Logging
  console.log("File name to be downloaded : "+file_name);

  //Need to use this function to await the result of the check, otherwise the download will be executed before the check is finished, which will result in an error
  let image;
  return (async () => {
    //check file existence and await response for download token
    const check = await _file_check(file_name); 
    //return (`${gs_url}/${file_name}`);
    if (check.code == 200) {
      const url = `${gs_url}/${file_name}?alt=media&token=${check.token}`;
      try {
        //const response = await axios.get(url);
        const response = await axios.get(url, { responseType: "blob" });
        console.log("Download ok : " + url);
        console.log( `Downloaded file : ${response}`)
        return response; //note that response.data is the blob. response is the whole response object
      } catch (error) {
        console.log("Download could not be done under the URL : " + url);
        console.log(error);
        return null;
      }
    } else {
      console.log(`The file ${file_name} does not exist`);
      return null;
    }
  })();
};
 