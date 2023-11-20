import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


export const updateWorkSpaceData = (name:string,token:string,myCodebaseDir:string) =>{

    // Use the returned value here
    const data = {
        projectName: name,
        token:token,
        path:myCodebaseDir,
        description: "Enter project description here"
    };

    const jsonData = JSON.stringify(data, null, 2); // Convert data to JSON string with indentation

    // Get the path for the example.json file inside .mycodebase
    const filePath = path.join(myCodebaseDir, 'config.json');

    // Write the JSON data to a file
    fs.writeFileSync(filePath, jsonData);
};