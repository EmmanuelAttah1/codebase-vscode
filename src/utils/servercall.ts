

const url = 'http://127.0.0.1:8000/stephen/'; //'http://3.90.242.65/stephen/'; //Replace with your API endpoint


import { displayLoginForm } from "./login";
import { readConfigJSON } from './file_management/read_config';
import { saveWorkSpaceName } from './file_management/save_workpace_name';
import { updateWorkSpaceData } from "./file_management/update_work_space_name";

const data = {
    key1: 'value1',
    key2: 'value2'
};

export const makeServerCall = (method: string, path: string, data: any) => {
    return new Promise((resolve,reject)=>{
        let token : string = "";
        const store = readConfigJSON();

        const requestOptions: RequestInit = {
            method: method,
        };

        if(path !== "login"){
            if(store){
                //check if we are loggedin
                if(store["token"] === "token" || !store.hasOwnProperty("token")){
                    displayLoginForm();
                    reject("unauthenticated");
                    return;
                }

                token = store.token;

                requestOptions['headers'] = {
                    Authorization : `Token ${token}`,
                };

                if (method === "POST") {
                    requestOptions['body'] = data;
                }
            }else{
                //no store
                reject("no store yet");
                return;
            }
            
        }else{
            //we are trying to login
            requestOptions['body'] = data;

            // console.log("procedding");
            
        }


        // console.log(requestOptions, " oya naw");
        
        fetch(url + path + "/", requestOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Parse the response body as JSON
            })
            .then((responseData:any) => {
                // Handle the response data
                console.log('Response:', responseData);
                if(responseData.token !== undefined){
                    const token = responseData.token;
                    console.log(token);

                    console.log("token is ", store);

                    // readConfigJSON();
                    
                    //fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    //saveWorkSpaceName(store.projectName, token);
                    console.log("the store is ", store);
                    
                    
                    const myPath = store.path.replaceAll("\\","/");
                    console.log("my path is ",myPath);
                    
                    updateWorkSpaceData(store.projectName,token,myPath);
                }

                resolve(responseData);
            })
            .catch(error => {
                // Handle errors during the fetch
                console.error('Error:', error);
                reject(error);
            });
    });
};
