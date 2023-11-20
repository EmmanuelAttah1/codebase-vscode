import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let data : any;

export function readConfigJSON() {

    const activeEditor = vscode.window.activeTextEditor;

    let document;

    if (!activeEditor) {
        if(!data){
            console.error('No active editor found.');
            return false;
        }
        document = data;
    }else{
        document = activeEditor.document.uri;
        data = document;
    }

    const rootPath = vscode.workspace.getWorkspaceFolder(document);

    if (!rootPath) {
        console.error('No workspace folder found for the active editor.');
        return null;
    }
    const folderPath = rootPath.uri.fsPath;

    // console.log(folderPath," is active");
    
    // Get the root path of the first workspace folder
    // const rootPath = vscode.workspace.workspaceFolders![0].uri.fsPath;

    // Get the path for the example.json file inside .mycodebase
    const filePath = path.join(folderPath, '.mycodebase', 'config.json');

    if (fs.existsSync(filePath)) {
        // Read the content of the JSON file
        const jsonData = fs.readFileSync(filePath, 'utf-8');

        try {
            // Parse the JSON content
            const parsedData = JSON.parse(jsonData);
            console.log(parsedData);
            return parsedData;
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return null;
        }
    } else {
        console.error('File does not exist:', filePath);
        return null;
    }
}

// Call this function when needed to access the content of example.json

