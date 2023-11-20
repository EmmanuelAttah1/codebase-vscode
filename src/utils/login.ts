import * as vscode from 'vscode';
import { showLoading, hideLoading } from './loading';
import { makeServerCall } from './servercall';


let panel: any;

export const displayLoginForm = () => {
    // Create and show a new webview
    if(panel){
      panel.reveal(vscode.ViewColumn.Two);
    //   panel.dispose();
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

      // Receive messages from the WebView
      panel.webview.onDidReceiveMessage((message:any) => {
          if (message.command === 'login'){
                  const form = new FormData();

                //   console.log(message);
                  

                  form.append("username",message.username);
                  form.append("password",message.password);

                  showLoading("Signing In, please wait.");

                  makeServerCall("POST","login",form)
                  .then((res)=>{
                        // console.log("response ",res);
                        hideLoading("Authentication Successful");
                        panel.dispose();
                  })
                  .catch(err=>{
                        // console.log("form error ",err);
                        hideLoading("Authentication Failed");
                        panel.webview.html = getLoginHtML(true);
                  });
                }
        });
    }

    panel.webview.html = getLoginHtML(false);
};


const getLoginHtML=(failed:Boolean)=>{
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <meta http-equiv='X-UA-Compatible' content='IE=edge'>
        <title>MyCodeBase Login</title>
        <meta name='viewport' content='width=device-width, initial-scale=1'>
        <style>
            #login-container{
                padding: 20px;
            }
            #submit{
                text-align: center;
                padding:10px 20px;
                border: 1px solid #f0f0f0;
                border-radius: 10px;
                margin-top: 20px;
                float: right;
            }
            .label{
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .item{
                margin: 20px 0px;
            }
            input{
                width:100%;
                height:40px;
                border-radius: 10px;
                background-color: transparent;
                border: 1px solid #f0f0f0;
                padding: 0px 10px;
                font-size: 14px;
                color:#f0f0f0;
            }

            .error{
                color:red;
                font-size: 14px;
                width: 100%;
                text-align: center;
                font-weight: bold;
            }

        </style>
    </head>
    <body>
        <div id="login-container">
            <h3>Sign In to MyCodeBase</h3>`;

    if(failed){
        html += `<div class="error">Invalid Username or Password</div>`;
    }

    html += `

            <div class="item">
                <div class="label">Username</div>
                <div><input type="text" placeholder="Enter Username" id="Username"/></div>
            </div>
            <div class="item">
                <div class="label">Password</div>
                <div><input type="password" placeholder="Enter Password" id="Password"/></div>
            </div>
            <div id="submit" onclick="submitForm()">Login</div>
        </div>
        <script>
            const vscode = acquireVsCodeApi();

            const submitForm=()=>{
                const username = document.getElementById('Username').value
                const password = document.getElementById('Password').value

                if (password.length > 0 && username.length > 0){
                    vscode.postMessage({ command: 'login', username:username, password:password});
                }
            }

        </script>
    </body>
    </html>
    `;

    return html;

};