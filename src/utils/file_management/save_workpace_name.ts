import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


export const saveWorkSpaceName = (name:string,token:string) =>{

    const activeEditor = vscode.window.activeTextEditor;

    console.log("editor ", activeEditor?.document);
    

    if (!activeEditor) {
        console.error('No active editor found.');
        return false;
    }

    const document = activeEditor.document;

    const rootPath = vscode.workspace.getWorkspaceFolder(document.uri);

    if (!rootPath) {
        console.error('No workspace folder found for the active editor.');
        return null;
    }

    const folderPath = rootPath.uri.fsPath;

    const parentFolder = path.join(folderPath, '.mycodebase');

    console.log("parent folder ", parentFolder);
    

    // Use the returned value here
    const data = {
        projectName: name,
        token:token,
        path:parentFolder,
        description: "Enter project description here"
    };

    const jsonData = JSON.stringify(data, null, 2); // Convert data to JSON string with indentation

    // Get the root path of the first workspace folder
    // const rootPath = vscode.workspace.workspaceFolders![0].uri.fsPath;

    // Create the .mycodebase directory if it doesn't exist
    const myCodebaseDir = parentFolder;
    if (!fs.existsSync(myCodebaseDir)) {
        fs.mkdirSync(myCodebaseDir);
    }

    // Get the path for the example.json file inside .mycodebase
    const filePath = path.join(myCodebaseDir, 'config.json');

    // Write the JSON data to a file
    fs.writeFileSync(filePath, jsonData);
};