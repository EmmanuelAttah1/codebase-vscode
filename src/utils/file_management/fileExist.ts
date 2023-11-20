import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function checkIfConfigJSONExists(activeEditor : vscode.TextEditor) {
    
    if (!activeEditor) {
        console.error('No active editor found.');
        return false;
    }

    const document = activeEditor.document;

    const folder = vscode.workspace.getWorkspaceFolder(document.uri);

    if (!folder) {
        console.error('No workspace folder found for the active editor.');
        return false;
    }

    const folderPath = folder.uri.fsPath;
    const filePath = path.join(folderPath, '.mycodebase', 'config.json');

    const fileExists = fs.existsSync(filePath);

    if (fileExists) {
        console.log('config.json exists!');
    } else {
        console.log('config.json does not exist.');
    }

    return fileExists;
}

