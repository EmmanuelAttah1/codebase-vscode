import * as vscode from 'vscode';


let isWebViewVisible = true;

export function createWebView(context: vscode.ExtensionContext) {
    // Create and show webview in the secondary sidebar
    const webViewPanel = vscode.window.createWebviewPanel('webViewExample', 'Web View Example', vscode.ViewColumn.Two, {
        enableScripts: true
    });



    webViewPanel.webview.options = {
        // Set your webview's HTML content or load a URL here
        // For example:
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'web')]
    };

    webViewPanel.webview.onDidReceiveMessage(message  => {
        console.log(message);
        
        // Handle messages from the webview if needed
        // For example:
        // if (message.command === 'someCommand') { ... }
    });

    // Toggle webview visibility on command or action
    vscode.commands.registerCommand('extension.toggleWebView', () => {
        if (webViewPanel) {
            if (isWebViewVisible) {
                webViewPanel.dispose();
                isWebViewVisible = false;
            } else {
                createWebView(context);
                isWebViewVisible = true;
            }
        }
    });
}