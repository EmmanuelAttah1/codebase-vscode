import * as vscode from 'vscode';

let isLoading = false;

export function showLoading(loadingMessage: string) {
    isLoading = true;

    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: loadingMessage,
        cancellable: false
    }, () => {
        return new Promise<void>((resolve, reject) => {
            // Resolve the promise when the isLoading flag changes to false
            const interval = setInterval(() => {
                if (!isLoading) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    });
}


export function hideLoading(message:string) {
    isLoading = false;

    // Immediately resolve the progress to stop showing loading
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Loading...',
        cancellable: false
    }, () => {
        return new Promise<void>((resolve) => {
            vscode.window.showInformationMessage(message);
            resolve();
        });
    });
}

// function synchronousFunction() {
    // for (let i = 0; i < 1000000000; i++) {
    //     // Simulated time-consuming operation
    // }
// }

// function executeTask() {
//     showLoading('Loading...');

//     // Simulate synchronous task execution
//     synchronousFunction();

//     // Hide loading indicator after a simulated delay
//     setTimeout(() => {
//         hideLoading().then(() => {
//             vscode.window.showInformationMessage('Task finished successfully');
//         });
//     }, 1000); // Simulated delay
// }

// // Call executeTask to start the process
// executeTask();
