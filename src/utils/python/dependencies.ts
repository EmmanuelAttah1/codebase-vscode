// const mainSet = new Set(['preprocess_code',
//   'postprocess_code',
//   'isNotASeperator',
//   'getCodeHead',
//   'split_my_code_into_functions',
//   'calculate_hash',
//   "getImportations",
//   "postprocessCode",
//   "getBlockName",
//   "preprocessCode"
// ]);

const processChunk = (chunk:string) : string =>{    
    if(chunk.includes(".")){
        return chunk.split(".")[0];
    }else{
        return chunk;
    }
};


// export const getDependencies=(code:string) : Set<string> =>{
//     const lines : string[] = code.split("\n");
//     let result : Set<string> = new Set();

//     for (let i = 0; i < lines.length; i++) {
//         let line = lines[i];
//         if(line.includes("(")){
//             if(line.includes("def ")){
//                 continue;
//             }
//             if(line.includes("=")){
//                 line = line.split("=")[1];
//             }else if(line.includes("==")){
//                 line = line.split("==")[1];
//             }else if(line.includes("===")){
//                 line = line.split("===")[1];
//             }

//             const chunks = line.split("(");

//             for (let index = 0; index < chunks.length; index++) {
//                 const chunk = chunks[index].trim();
//                 if (!chunk.includes(")")) {
//                     if(chunk.includes(" ")){
//                         const miniChunk = chunk.split(" ");
//                         for (let j = 0; j < miniChunk.length; j++) {
//                             const subChunk = miniChunk[j];
//                             result.add(processChunk(subChunk));
//                             console.log(subChunk);
                            
//                         }
//                     }else{
//                         result.add(processChunk(chunk));
//                         console.log(chunk);
                        
//                     }
                    
//                 }
//             }
//         }
//     }
//     console.log(result);
    
//     return new Set([...result].filter((item) => mainSet.has(item)));
// };

export const getDependencies = (code: string,dependencies:string[]): string[] => {
    const lines: string[] = code.split("\n");
    let result: string[] = [];

    for (let i = 1; i < lines.length; i++) {
        let line = lines[i];
        const words = line.split(/[ =\(\)]/);

        for (let word of words) {
            word = word.trim();
            if (word && dependencies.includes(word) && !result.includes(word)) {
                result.push(processChunk(word));
            }else if (word.startsWith("!") && dependencies.includes(word.slice(1)) && !result.includes(word.slice(1))) {
                result.push(processChunk(word.slice(1)));
            }
        }
    }
    
    return result;
};