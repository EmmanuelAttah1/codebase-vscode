import {marked} from "marked";

let currentDocInfo : any;
let currentChunk : any;

const markdownToHtml = (markdown: string) => {
    return marked.parse(markdown);
    
};

function isNumberInRange(number:number, startRange:number, endRange:number) {
    return number >= startRange && number <= endRange;
}

//o.find(e=>{if(isNumberInRange(e.age,0,20)){return e}})

export const displayChunkAtLine=(line:number,panel:any)=>{
    if(currentDocInfo){
        const chunk = currentDocInfo.find((e:any)=>{
            const range = e.chunk_range.split(",");
            const start = parseInt(range[0]);
            const end = parseInt(range[1]);

            // console.log("we are at ",line," ", start," - ",end);
            

            return isNumberInRange(line, start, end);

        });

        const id = chunk.name;

        // Send function and class names to the webview
        // console.log("panel is ",panel.webview.postMessage);
        
        if(panel){
            panel.webview.html = displayChunkIWebView(chunk);
            // webview.postMessage(chunk.name);
        }
    }
    
};

export const changeChunkDisplayToEdit=()=>{
    const chunk = JSON.stringify(currentChunk);
    const html = `
    <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Combined Markdown View</title>
            <style>
                .hidden{display:none}
                .visible{display:block}

                #button-container{
                    width:100%;
                    display:flex;
                    justify-content:space-between;
                    margin:30px 0px;
                }

                #button-container div{
                    border:1px solid #f0f0f0;
                    color:white;
                    padding:10px;
                    border-radius:10px;
                    cursor:pointer;
                }

                textarea{
                    width:100%;
                    background-color:transparent;
                    color:#f0f0f0;
                }
            </style>
        </head>
        <body>
            <h3>Update Documentation</h3>
            <textarea id="container" oninput="adjustTextarea(this)" >${currentChunk.doc}</textarea>

            <div id="button-container">
                <div onclick="cancel()">Cancel</div>
                <div onclick="updateDoc()">Update Documentation</div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                const container = document.getElementById('container')

                function adjustTextarea(textarea) {
                    textarea.style.height = "auto"; // Reset height to default
                
                    // Set the height based on the scroll height of the content
                    textarea.style.height = (textarea.scrollHeight) + "px";
                }

                function cancel(){
                    vscode.postMessage({ command: 'cancel', chunk:${chunk} });
                }

                function updateDoc(){
                    vscode.postMessage({ command: 'updateDoc', chunk:${chunk}, newDoc : container.value });
                }

                adjustTextarea(container)
            </script>
        </body>
    </html>  
    `;

    return html;
};


export const displayChunkIWebView=(chunk:any)=>{

    currentChunk = chunk;

    const html = `
    <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Combined Markdown View</title>
            <style>
                .hidden{display:none}
                .visible{display:block}

                #button-container{
                    width:100%;
                    display:flex;
                    justify-content:end;
                    margin:30px 0px;
                }

                #button-container div{
                    border:1px solid #f0f0f0;
                    color:white;
                    padding:10px;
                    border-radius:10px;
                    cursor:pointer;
                }
            </style>
        </head>
        <body>
            ${markdownToHtml(chunk.doc)}

            <div id="button-container">
                <div onClick="updateDoc()">Edit Documentation</div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                const updateDoc=()=>{
                    const markdownTextArea = "testing one, two";

                    // Send updated content to extension
                    vscode.postMessage({ command: 'updateMarkdown', content: markdownTextArea });
                   
                }
            </script>
        </body>
    </html>  
    `;

    return html;
};

export const formatDocs=(docs : any)=>{
    currentDocInfo = docs;
    let html = `
    <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Combined Markdown View</title>
            <style>
                .hidden{display:none}
                .visible{display:block}
            </style>
        </head>
        <body>
    `;

    for (let i = 0; i < docs.length; i++) {
        const current = docs[i];
        html += `
        <div class="hidden" id="${current.name}">
            ${markdownToHtml(current.doc)}
        </div>
        `;
    }

    html += `
        <script>

            function showElementById(idToShow) {
                const elements = document.querySelectorAll('.hidden');
                elements.forEach(element => {
                    if (element.id === idToShow) {
                        element.classList.remove('hidden');
                        element.classList.add('visible');
                    } else {
                        element.classList.remove('visible');
                        element.classList.add('hidden');
                    }
                });
            }
            
            window.addEventListener('message', event => {
                const message = event.data;
                if (message && message.idToShow) {
                    showElementById(message.idToShow);
                }
            });

        </script>
        </body>
        </html>
    `;

    // console.log(html);
    

    return html;
};