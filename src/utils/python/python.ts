const checkpoints = ["def","class"];
const secondarySeperators = ["@"];
const newCharacterSymbol = "<new_line>";

const testFunctions : string[] = [
  'preprocess_code',
  'postprocess_code',
  'isNotASeperator',
  'getCodeHead',
  'split_my_code_into_functions',
  'calculate_hash'
];

const getLineImport=(chunks : string) : any =>{
  const [from,imports] = chunks.split("import ");
  const allImports = imports.split(",").map(e=>(e.trim()));
  
  return [from,allImports];
};


const getImportations=(code:string) =>{
  const importations = [];
  let chunks;

  const codeLines = code.split("\n");
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (line.includes("from") && line.includes("import")) {
      chunks = line.split("from ")[1];

      const [from,allImports] = getLineImport(chunks);

      importations.push({
        from : from,
        import : allImports
      });

    }else if(line.includes("import")){

      const [_from,allImports] = getLineImport(line);

      importations.push({
        from : "root",
        import : allImports
      });
    }
  }

  

  return importations;
};


const preprocessCode=(code : string)=>{
    const replaceChar = ["'\n'",'"\n"'];

    let newCode = code;

    for (let i = 0; i < replaceChar.length; i++) {
      const char = replaceChar[i];
      newCode = code.replace(char,newCharacterSymbol);
    }

    return newCode;
};

const postprocessCode=(code : string) : string =>{
  code = code.replace(newCharacterSymbol,"'\n'");

  return code;
};

const isNotASeperator=(line : string,secondarySeperators : string[]) : Boolean =>{
  for (let i = 0; i < secondarySeperators.length; i++) {
    const current : string = secondarySeperators[i];
    if (line.startsWith(current)){
      return false;
    }
  }
        
  return true;
};

const getCodeHead=(mycode: string, checkpoints: string[], secondarySeperators: string[]): [string, string[]]=> {
    const code: string[] = mycode.split("\n");
    let chunk: string = "";
  
    for (const line of code) {
      const start: string = line.split(" ")[0];
      if (!checkpoints.includes(start) && isNotASeperator(start, secondarySeperators)) {
        chunk += `${line}\n`;
      } else {
        const index: number = code.indexOf(line);
        return [chunk, code.slice(index)];
      }
    }  
    // If the loop completes without returning, return an empty array for the second element
    return [chunk, []];
};

const getBlockName=(code : string[]) : {} =>{
  for (let i = 0; i < code.length; i++) {
    const element = code[i];
    if (!checkpoints.includes(element)) {
      const index = code.indexOf(element);
      return {name:element.split("(")[0],type:code[index-1]};
    }
  }
  return {name:"ungrouped",type:""};
};

export const splitMyCodeIntoFunctions = (code: string): [string[], string[],string[]] => {
    code = preprocessCode(code);
    const functionNames : {}[] = [];
    const allFunctionsName : string[] = [];
    const chunksNames : string[] = [];

    const [head, body] = getCodeHead(code, checkpoints, secondarySeperators);
    let chunk: string = "";
    const chunks: any = [];
    let lastLineIsADecorator : boolean = false;
    const fileImport = getImportations(head).map(obj=> obj.import );

    let start = head.split("\n").length;
    let count = 0;

    // console.log("all imports", fileImport);

    if(head.length > 0){
      chunks.push([postprocessCode(head),[0,start]]);
      chunksNames.push("head");
    }

  
    for (const line of body) {

      count++;

      if (line.length === 0) {

        continue;

      } else {

        if(!isNotASeperator(line,secondarySeperators)){
          lastLineIsADecorator = true;
          const end = start+count;
          const range = [start-1,end-2];
          start = end;
          count=0;
          chunks.push([postprocessCode(chunk),range]);
          chunk = "";
        }

        const wordChunks = line.split(" ");

        for (let i = 0; i < wordChunks.length; i++) {
          const word = wordChunks[i];

          if (checkpoints.includes(word)){
            const info : any = getBlockName(wordChunks);
            functionNames.push(info);
            chunksNames.push(info.name);
            allFunctionsName.push(info.name);

            if(!lastLineIsADecorator){
              if(chunk.length > 0){
                const end = start+count;
                const range = [start-1,end-2];
                start = end;
                count=0;
                chunks.push([postprocessCode(chunk),range]);
              }
              chunk = "";
            }else{
              lastLineIsADecorator = false;
            }
            
            break;
          }
        }
      }
  
      chunk += `${line}\n`; // The new line character remains the same in TypeScript  
    }

    if(chunk.length > 0){
      const end = start+count;
      const range = [start-1,end-2];
      start = end;
      count=0;
      chunks.push([postprocessCode(chunk),range]); // Last block
    }

    const allDependencies = allFunctionsName.concat(...fileImport);

    // console.log("all functions and imports = ",allDependencies);
    
    return [chunks,allDependencies,chunksNames];
};
  


  
