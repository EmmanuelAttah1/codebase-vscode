// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import {marked} from "marked";

import {splitMyCodeIntoFunctions} from "../src/utils/python/python";
import {calculateHash} from "../src/utils/others";

import {getDependencies} from "../src/utils/python/dependencies";
import {processChunksWithDependencies} from "./utils/sortChunk";

import { makeServerCall } from './utils/servercall';
import { formatDocs, displayChunkAtLine } from './utils/formatDocs';

import { checkIfConfigJSONExists } from './utils/file_management/fileExist';
import { saveWorkSpaceName } from './utils/file_management/save_workpace_name';

import { readConfigJSON } from './utils/file_management/read_config';

import { changeChunkDisplayToEdit,displayChunkIWebView } from './utils/formatDocs';
import { showLoading, hideLoading } from './utils/loading';


export interface Chunk {
    chunk: string;
    dependencies: string[];
	name:string;
	range:string;
}

let panel : any;
let fileOpenedInWebView : string = "";

const editor = vscode.window.activeTextEditor;

const saveWorkSpaceNameToServer = (result:string)=>{
	return new Promise((resolve,reject)=>{
		const form = new FormData();
		form.append("name",result);

		makeServerCall("POST","new-project",form)
		.then(res=>{
			//console.log('Returned value:', result);
			resolve(true);
		})
		.catch(err=>{
			//console.log(err);
		});
	});
};


function logVisibleLine(editor: vscode.TextEditor | undefined) {
    if (!editor) {
        return;
    }

    const visibleRange = editor.visibleRanges[0];
    const lineNumber = visibleRange.start.line;

    // Log the line number
    //console.log(`Current top-most visible line: ${lineNumber}`);
}

// Subscribe to the event when visible ranges change
const disposable = vscode.window.onDidChangeTextEditorVisibleRanges(event => {
    if (event.textEditor) {
        logVisibleLine(event.textEditor);
    }
});



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


	function logCursorPosition(editor: vscode.TextEditor | undefined) {
        if (!editor) {
            return;
        }

        const cursorPosition = editor.selection.active;
        const lineNumber = cursorPosition.line;

        // Get the text of the current line
        const currentLine = editor.document.lineAt(lineNumber).text;

        // Log the line number and content at the cursor position
		displayChunkAtLine(lineNumber+1,panel);
        // //console.log(`Cursor at line ${lineNumber + 1}: ${currentLine}`);
    }

    // Subscribe to the event when the selection (cursor) changes
    const disposable1 = vscode.window.onDidChangeTextEditorSelection(event => {
        if (event.textEditor) {
            logCursorPosition(event.textEditor);
        }
    });

    // Initial logging when the extension is activated (for the active editor)
    const activeEditor = vscode.window.activeTextEditor;
    logCursorPosition(activeEditor);

    // Dispose the event listener when no longer needed (e.g., when deactivating the extension)
    context.subscriptions.push(disposable1);

	// Listen for changes in the active text editor
	// vscode.window.onDidChangeActiveTextEditor((editor) => {
	// 	if (panel && editor && editor.document.uri.fsPath !== panel.webview.asWebviewUri(vscode.Uri.file(editor.document.uri.fsPath)).toString()) {
	// 		// If the panel is open and the active file is not the one in the panel, dispose of the panel
	// 		panel.dispose();
	// 	}
	// });
	vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (panel && editor) {
			const current = editor?.document.uri.path;
			//console.log(current," this file ",current===fileOpenedInWebView);
			if(current !== fileOpenedInWebView){
				panel.dispose();
			}
		}
	});

	const toggleManual=()=>{
		if(panel){
			// panel.reveal(vscode.ViewColumn.Two);
			panel.dispose();
		}else{
			panel = vscode.window.createWebviewPanel(
				'catCoding', // Identifies the type of the webview. Used internally
				'My Code Base', // Title of the panel displayed to the user
				vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
				{enableScripts:true} // Webview options. More on these later.
			  );


			panel.onDidDispose(() => {
				// Reset when the panel is closed
				panel = undefined;
			});

			panel.webview.html = `<h1>My-Code-Base</h1>
			<p>This extension automates Python codebase documentation, enhancing productivity and fostering collaboration among developers.</p>
			
			<h2>How to Use</h2>
			<h4>Commands and Shortcuts</h4>
			<ul>
			  <li><strong>Draft Doc for file:</strong> <code>Ctrl + Shift + D</code> on Mac: <code>Cmd + Shift + D</code></li>
			  <li><strong>View Drafted Docs:</strong> <code>Ctrl + Shift + L</code> on Mac: <code>Cmd + Shift + L</code> [Then click on code section or line to see doc]</li>
			</ul>
			
			<h3>Features</h3>
			<ul>
			  <li><strong>Feature 1:</strong> AI-powered documentation generation.</li>
			  <li><strong>Feature 2:</strong> Dependency-aware documentation for comprehensive coverage.</li>
			  <li><strong>Feature 3:</strong> Ability to edit AI-generated documentation.</li>
			</ul>
			
			<hr>
			
			<p>Developed by the TrinityX team</p>
			`;
		}
	};

	context.subscriptions.push(
		vscode.commands.registerCommand('codebase.getDoc', () => {
		  // Create and show a new webview
		  if(panel){
			// panel.reveal(vscode.ViewColumn.Two);
			panel.dispose();
			return ;
		  }else{
			panel = vscode.window.createWebviewPanel(
				'catCoding', // Identifies the type of the webview. Used internally
				'My Code Base', // Title of the panel displayed to the user
				vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
				{enableScripts:true} // Webview options. More on these later.
			  );


			panel.onDidDispose(() => {
				// Reset when the panel is closed
				panel = undefined;
				fileOpenedInWebView="";
			});

			// Receive messages from the WebView
			panel.webview.onDidReceiveMessage((message:any) => {
				if (message.command === 'updateMarkdown') {
					// Received updated Markdown content from the WebView
					const updatedContent = message.content;
					//console.log("doc changed to ",updatedContent);
					panel.webview.html = changeChunkDisplayToEdit();

				}else if(message.command === 'cancel'){
					//console.log("chunk well ", message.chunk);
					
					const chunk = message.chunk; //JSON.parse(message.chunk)
					//console.log(chunk," abeg oooo");
					
					panel.webview.html = displayChunkIWebView(chunk);

				}else if(message.command === 'updateDoc'){

					const chunk = message.chunk;

					if(message.newDoc !== chunk.doc && editor){
						const project = readConfigJSON().projectName;

						
						const document = editor.document;
		
						let fileName = document.uri.path;
						const file = fileName.replaceAll("/","_");

						//const file = message.file;
						const form = new FormData();

						form.append("project",project);
						form.append("file",file);
						form.append("name",chunk.name);
						form.append("doc",message.newDoc);

						showLoading("Updating Documentation, please wait....");
						makeServerCall("POST","update-doc",form)
						.then(res=>{
							hideLoading("Documentation has been updated");
							//console.log("doc has been updated");
							chunk.doc = message.newDoc;
							panel.webview.html = displayChunkIWebView(chunk);
						});
					}
					
				}

			});
		  }

		  //change this
		//   const filename = "Seperate_my_code00.py";
			const editor = vscode.window.activeTextEditor;

			if (editor) {
				const document = editor.document;

				const fileName = document.uri.path;
				const editedFileName = fileName.replaceAll("/","_");

				//console.log("Our file that is opened is ",fileName);

				const project = readConfigJSON().projectName;
				

				//loading = true
				showLoading("Geting Documentation, Please wait....");
				makeServerCall("GET",`get-doc/${editedFileName}/${project}`,[])
				.then((res:any)=>{
				  //loading = false
				  hideLoading("Documentation is ready");
				  fileOpenedInWebView = fileName;
				  panel.webview.html = formatDocs(res.data);
				  
				  logCursorPosition(editor);
				});
			}
		})
	  );

	const store = context.globalState;

	vscode.workspace.onDidRenameFiles((event)=>{
		//console.log("we dey here");
		
		event.files.forEach(file=>{
			//console.log("inside event");
			const project = readConfigJSON();	

			if(project){
				const form = new FormData();
				const oldName = file.oldUri.path;
				const newName = file.newUri.path;

				form.append("project",project.projectName);
				form.append("old_name", oldName.replaceAll("/","_"));
				form.append("new_name", newName.replaceAll("/","_"));

				makeServerCall("POST","update-file",form)
				.then(res=>{
					//console.log(res);
				});

				//console.log(oldName,"  ",newName);
			}
			
		});
	});

	const clearStore = ()=>{
		// Get all the keys currently stored
		let keys = store.keys();

		// Clear each key from the workspace store
		keys.forEach(key => {
			store.update(key, undefined);
		});
	};

	const handleFileFunction = ()=>{
		//const editor = vscode.window.activeTextEditor;

		if (editor) {
			const document = editor.document;
			const fileName = document.uri.fsPath;

			store.update("batman","is a king");
			
			//console.log("this are all of the keys ",context.globalState.keys());
			//console.log(store.get("testing"));
			
		}
	};



	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	//console.log('Congratulations, your extension "codebase" is now active!');

	async function collectUserText(): Promise<string | undefined> {
		try {
			const userText = await vscode.window.showInputBox({
				prompt: 'This is a new project. Enter project name:',
				placeHolder: 'Type here...',
				validateInput: (text) => {
					// You can add validation logic here if needed
					return text ? null : 'Text cannot be empty!';
				}
			});
	
			if (userText !== undefined) {
				// User entered text
				//console.log('User input:', userText);
				// Perform further processing with the entered text if needed
	
				return userText; // Resolve the promise with the user's input
			} else {
				// User canceled input
				//console.log('Input canceled');
				return undefined; // Resolve the promise with undefined
			}
		} catch (error) {
			console.error('Error occurred:', error);
			throw error; // Reject the promise if an error occurs
		}
	}
	

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('codebase.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		//console.log("Hello I am the batman");
		vscode.window.showInformationMessage('Hello World from codebase!');
	});

	let text = vscode.commands.registerCommand('codebase.makeDoc',()=>{
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const document = editor.document;
			const fileContent = document.getText();

			let fileName = document.uri.path;
			fileName = fileName.replaceAll("/","_");

			const updatedChunks : Chunk[] = [];

			let fileAreadyExist = false;
			let temp : any = {};

			//console.log("file name is ",fileName," all =  ",document);

		
			// Check if the file exists
			const fileExists = checkIfConfigJSONExists(editor);
			//console.log("oya pooo");
			let weGocontinue = true;
			

			if (!fileExists) {
				collectUserText()
				.then((result) => {
					////console.log("we are here ",result);
					
					if (result !== undefined) {
						saveWorkSpaceName(result,"token");
						saveWorkSpaceNameToServer(result);
						hideLoading("Project Created");
						weGocontinue = false
						// const form = new FormData();
						// form.append("name",result);

						// makeServerCall("POST","new-project",form)
						// .then(res=>{
						// 	//console.log('Returned value:', result);
						// 	saveWorkSpaceName(result,"");
						// })
						// .catch(err=>{
						// 	//console.log(err);
						// });
					} else {
						//console.log('User canceled input');
						// Handle cancellation or absence of input
					}
				})
				.catch((error) => {
					console.error('Error:', error);
					// Handle any errors that occurred during user input
				});
			} else {
				//console.log('config.json exist.');
			}
			
			//console.log("Anyways......");
			
			
			if(store.get(fileName) !== undefined){
				fileAreadyExist = true;

				temp = store.get(fileName);
				temp = JSON.parse(temp);
			}

			const [chunks,dependencies,names] = splitMyCodeIntoFunctions(fileContent);

			// if(head.length > 0){
			// 	chunks = [head,...chunks];
			// 	names = ['head',...names];
			// }

			////console.log(chunks.length, "  ", names.length);
			
			for (let i = 0; i < chunks.length; i++) {
				const element = chunks[i][0];
				const range = chunks[i][1];
				////console.log(names[i],"   ",element, "  ", i);
				
				const chunkDependencies = getDependencies(element,dependencies);
				const hash = calculateHash(element);
				const chunkName = names[i];

				//do something here
				if(temp.hasOwnProperty(chunkName)){
					if (temp[chunkName] !== hash){
						updatedChunks.push({
							chunk:element,
							dependencies:chunkDependencies,
							name:chunkName,
							range:range.toString()
						});
					}
				}else{
					updatedChunks.push({
						chunk:element,
						dependencies:chunkDependencies,
						name:chunkName,
						range:range.toString()
					});

					temp[chunkName] = hash;
				}
			}

			////console.log("temp store is ",temp);
			
			if(!fileAreadyExist && (readConfigJSON().token !== "token")){
				store.update(fileName,JSON.stringify(temp));
			}

			//process chunk head first
			//send head and chunknames for processing

			//processing chunk here
			if(updatedChunks.length > 0){
				showLoading("Generating Documentation, this might take some time....");
				saveWorkSpaceNameToServer(readConfigJSON().projectName)
				.then(res=>{
					processChunksWithDependencies(updatedChunks,fileName);
				});
			}
			// .then(res=>{
			// 	hideLoading();
			// 	vscode.window.showInformationMessage('Your Documentation is ready');
			// });

		} else {
		 	vscode.window.showInformationMessage('No active editor');
		}

	});

	let handleFile = vscode.commands.registerCommand('codebase.handleFile',handleFileFunction);
	let handleClearStore = vscode.commands.registerCommand('codebase.handleClear',clearStore);
	let handleManual = vscode.commands.registerCommand('codebase.manual',toggleManual);

	context.subscriptions.push(disposable);
	context.subscriptions.push(text);
	context.subscriptions.push(handleFile);
	context.subscriptions.push(handleClearStore);
	context.subscriptions.push(handleManual);

	//vscode.window.showInformationMessage('Hello World from codebase!');
	toggleManual();
}

// This method is called when your extension is deactivated
export function deactivate() {}
