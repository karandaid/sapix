import { promises as fs } from 'fs';
import path from 'path';

class FileFunctionFetcher {
    constructor(folderName, fileName) {
        this.folderPath = path.join(process.cwd(), folderName);
        this.fileName = fileName;
        this.filePath = path.join(this.folderPath, this.fileName);
        this.functionName = 'default';  // Fixed function name
    }

    async loadModule() {
        let fileModule;
    
        try {
            fileModule = await import(`file://${this.filePath}.mjs`);
        } catch (error) {
            return undefined;
        }    
        return fileModule;
    }

    // Method to fetch and return the function from the file
    async fetchFunction() {
        try {
            // Dynamically import the module
            let fileModule = await this.loadModule();

            if(!fileModule) {
                return;
            }

            // Check if the function exists and return it
            if (typeof fileModule[this.functionName] === 'function') {
                return fileModule[this.functionName];
            } else {
                throw new Error(`Function "${this.functionName}" not found in the file`);
            }
        } catch (err) {
            throw new Error(err);  // Re-throw the error to notify the caller
        }
    }
}

export default FileFunctionFetcher

