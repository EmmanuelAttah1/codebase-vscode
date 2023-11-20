code2 = """
def getDependencies(code:str) -> list :
    code = code.split("\n")
    
    for line in code:
        if "(" in line:
            if "def " in line:
                continue
            if line.count("==") == 2:
                line = line.split("==")[1]
            elif line.count("=") == 1:
                line = line.split("=")[1]
            
            chunks = line.split("(")

            for i in chunks:
                i = i.strip()
                if ")" not in i:
                    if " " in i:
                        miniChunk = i.split(" ")
                        for j in miniChunk:
                            print(j)
                    else:
                        print(i)

    return []

"""

funtion_sample = """
def split_my_code_into_functions(code):
    head, body = getCodeHead(code,checkpoints,secondary_seperators)
    chunk = ""
    chunks = []

    for line in body:
        if len(line) == 0:
            continue
        elif line.split(" ")[0] in checkpoints:
            chunks.append(chunk)
            chunk = ""

        chunk += f"{line}\n" #this new line character is causing issues

    chunks.append(chunk) #last_block

    return [head,chunks]

"""

main_Set = set(['preprocess_code',
  'postprocess_code',
  'isNotASeperator',
  'getCodeHead',
  'split_my_code_into_functions',
  'calculate_hash',
  "getImportations",
  "postprocessCode",
  "getBlockName",
  "preprocessCode"
])

def addChunkToResult(result,chunk):
    if "." in chunk:
        result.add(chunk.split(".")[0])
    else:
        result.add(chunk)

    return result

def getDependencies(code:str) -> set :
    code = code.split("\n")
    result = set()
    
    for line in code:
        if "(" in line:
            if "def " in line:
                continue
            if "==" in line:
                line = line.split("==")[1]
            elif "=" in line :
                line = line.split("=")[1]
            elif "===" in line:
                line = line.split("===")[1]
            
            chunks = line.split("(")

            for i in chunks:
                i = i.strip()
                if ")" not in i:
                    if " " in i:
                        miniChunk = i.split(" ")
                        for j in miniChunk:
                            result = addChunkToResult(result,j)
                    else:
                        result = addChunkToResult(result,i)

    return result.intersection(main_Set)

o = getDependencies("""const splitMyCodeIntoFunctions = (code: string): [string, string[]] => {
    code = preprocessCode(code);
    const functionNames : {}[] = [];

    const [head, body] = getCodeHead(code, checkpoints, secondarySeperators);
    let chunk: string = "";
    const chunks: string[] = [];
    let lastLineIsADecorator : boolean = false;

    console.log("all imports", getImportations(head));
  
    for (const line of body) {

      if (line.length === 0) {

        continue;

      } else {

        if(!isNotASeperator(line,secondarySeperators)){
          lastLineIsADecorator = true;
          chunks.push(postprocessCode(chunk));
          chunk = "";
        }

        const wordChunks = line.split(" ");

        for (let i = 0; i < wordChunks.length; i++) {
          const word = wordChunks[i];

          if (checkpoints.includes(word)){
            functionNames.push(getBlockName(wordChunks));

            if(!lastLineIsADecorator){
              chunks.push(postprocessCode(chunk));
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
  
    chunks.push(postprocessCode(chunk)); // Last block

    console.log("all functions = ",functionNames);
    
    return [head, chunks];
};""")


print(o)