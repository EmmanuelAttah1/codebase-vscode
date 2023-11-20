import { makeServerCall } from "./servercall";
import { Chunk } from "../extension";

import { readConfigJSON } from "./file_management/read_config";
import { hideLoading } from "./loading";


export function processChunksWithDependencies(chunks: Chunk[], filename: string) {
    
   // return new Promise((resolve,reject)=>{
        let count : number = 0;

        // const promises: Promise<any>[] = [];
        // const graph: { [key: string]: string[] } = {}; // Adjacency list to represent the graph
        // const visited: { [key: string]: boolean } = {};
        // const result: string[] = [];

        // // Build the graph
        // chunks.forEach(chunk => {
        //     graph[chunk.chunk] = chunk.dependencies;
        //     visited[chunk.chunk] = false;
        // });

        // function dfs(node: string) {
        //     visited[node] = true;

        //     if (graph[node]) {
        //         graph[node].forEach(neighbor => {
        //             if (!visited[neighbor]) {
        //                 dfs(neighbor);
        //             }
        //         });
        //     }

        //     if (!result.includes(node)) {
        //         result.push(node);
        //     }
        // }

        // // Perform topological sort considering dependencies
        // chunks.forEach(chunk => {
        //     if (!visited[chunk.chunk]) {
        //         dfs(chunk.chunk);
        //     }
        // });

        const code_chunks : any = [];

        // Process chunks in the order obtained from topological sort
        chunks.forEach(chunkId => {
            //const chunkToProcess = chunks.find(chunk => chunk.chunk === chunkId);
            const chunkToProcess = chunkId;

            if (chunkToProcess) {
                // const form = new FormData();
                // form.append("chunk", chunkToProcess.chunk);
                // form.append("file", filename);
                // form.append("name",chunkToProcess.name);
                // form.append("range",chunkToProcess.range);
                // form.append("project",readConfigJSON().projectName);

                // console.log(`Processing chunk: ${chunkToProcess.name}  ${chunkToProcess.range}`);
                const [docContext, dependency] = getChunkDependencySourceCode(chunkToProcess,chunkToProcess.dependencies,chunks);
                // form.append("dependencies", dependency.toString());
                // form.append("docContext", docContext);  
                // // count++;
                // console.log("chunk is ",count," ",chunks.length);

                code_chunks.push({
                    chunk:chunkToProcess.chunk,
                    chunk_dependency:dependency.toString(),
                    context:docContext,
                    name:chunkToProcess.name,
                    range:chunkToProcess.range,
                });
                

                // makeServerCall("POST", "generate-doc", form)
                // .then(res=>{
                //     count++;

                //     if(count === chunks.length){
                //         console.log("We done finish o");
                //         hideLoading('Your Documentation is ready\n press CTRL+Shift+L to view it');
                //     }
                // });
                //promises.push(makeServerCall("POST", "generate-doc", form));
            }
        });
        const form = new FormData();

        form.append("file", filename);
        form.append("project",readConfigJSON().projectName);
        form.append("chunks",JSON.stringify(code_chunks));

        makeServerCall("POST","generate-doc",form)
        .then(res=>{
            // console.log("doc response ", res);
            hideLoading('Your Documentation is ready\n press CTRL+Shift+L to view it');
        });

       // Resolve the main promise when all promises in the array resolve
    //    Promise.all(promises)
    //    .then(() => resolve(true))
    //    .catch(error => reject(error));
    //});
}

const getChunkDependencySourceCode=(current:Chunk, dependency:string[],chunks: Chunk[])=>{
    let docContext = "";

    const allChunks = chunks.filter(e=>{
        return dependency.includes(e.name);
    });

    if(current.name !== "head"){
        const head = chunks.find(e=>{
            return e.name === "head";
        });

        if(head){
            docContext += `${head.chunk}\n`;
        }

    }
    
    for (let i = 0; i < allChunks.length; i++) {
        const element = allChunks[i];
        docContext += `${element.chunk}\n`;
        dependency = dependency.filter(e=>{return e !== element.name;});
    }

    // console.log(docContext);
    return [docContext,dependency];
};

// Your array of chunks
// const chunksArray: Chunk[] = [
//     { chunk: 'def preprocess_code', dependencies: [] },
//     { chunk: 'def postprocess_code', dependencies: ['def preprocess_code'] },
//     { chunk: 'def isNotASeperator', dependencies: [] },
//     { chunk: 'def getCodeHead', dependencies: ['def isNotASeperator'] },
//     { chunk: 'def split_my_code_into_functions', dependencies: ['def getCodeHead'] },
//     { chunk: 'def calculate_hash', dependencies: [] },
//     // Add more chunks as needed...
// ];

// processChunksWithDependencies(chunksArray, 'filename.txt');
