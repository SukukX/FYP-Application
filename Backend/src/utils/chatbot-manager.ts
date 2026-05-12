import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Chatbot Manager
 * Handles automatic ingestion and startup of the Python Chatbot API.
 */
class ChatbotManager {
    private chatbotProcess: ChildProcess | null = null;
    private chatbotDir: string;
    private venvPython: string;

    constructor() {
        this.chatbotDir = path.join(__dirname, '../../chatbot');
        
        // venv paths for different OS
        const winVenvPath = path.join(this.chatbotDir, '.venv', 'Scripts', 'python.exe');
        const linuxVenvPath = path.join(this.chatbotDir, '.venv', 'bin', 'python');
        
        if (fs.existsSync(winVenvPath)) {
            this.venvPython = winVenvPath;
        } else if (fs.existsSync(linuxVenvPath)) {
            this.venvPython = linuxVenvPath;
        } else {
            // Fallback to system python
            this.venvPython = 'python';
        }
    }

    /**
     * Run the knowledge base ingestion script.
     */
    async runIngestion(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log("🤖 [Chatbot] Starting initial knowledge ingestion...");
            
            const ingestion = spawn(this.venvPython, ['rag/ingestion.py'], {
                cwd: this.chatbotDir,
                env: { ...process.env, PYTHONPATH: this.chatbotDir }
            });

            ingestion.stdout.on('data', (data) => {
                console.log(`🤖 [Chatbot-Ingest] ${data.toString().trim()}`);
            });

            ingestion.stderr.on('data', (data) => {
                console.error(`🤖 [Chatbot-Ingest-Error] ${data.toString().trim()}`);
            });

            ingestion.on('close', (code) => {
                if (code === 0) {
                    console.log("🤖 [Chatbot] Ingestion completed successfully.");
                    resolve();
                } else {
                    console.error(`🤖 [Chatbot] Ingestion failed with code ${code}.`);
                    // We don't reject here because we still want to try starting the chatbot
                    resolve();
                }
            });
        });
    }

    /**
     * Start the Uvicorn chatbot server.
     */
    startChatbot(): void {
        if (this.chatbotProcess) {
            console.warn("🤖 [Chatbot] Chatbot is already running.");
            return;
        }

        console.log("🤖 [Chatbot] Starting Chatbot API server...");

        // uvicorn main:app --port 8001
        this.chatbotProcess = spawn(this.venvPython, ['-m', 'uvicorn', 'main:app', '--port', '8001'], {
            cwd: this.chatbotDir,
            env: { ...process.env, PYTHONPATH: this.chatbotDir }
        });

        this.chatbotProcess.stdout?.on('data', (data) => {
            console.log(`🤖 [Chatbot-API] ${data.toString().trim()}`);
        });

        this.chatbotProcess.stderr?.on('data', (data) => {
            const msg = data.toString().trim();
            // Uvicorn logs to stderr by default for some info logs too
            if (msg.toLowerCase().includes('error')) {
                console.error(`🤖 [Chatbot-API-Error] ${msg}`);
            } else {
                console.log(`🤖 [Chatbot-API] ${msg}`);
            }
        });

        this.chatbotProcess.on('close', (code) => {
            console.log(`🤖 [Chatbot] API server exited with code ${code}`);
            this.chatbotProcess = null;
        });

        // Ensure chatbot dies when parent process dies
        process.on('exit', () => {
            this.stopChatbot();
        });
    }

    stopChatbot(): void {
        if (this.chatbotProcess) {
            this.chatbotProcess.kill();
            this.chatbotProcess = null;
        }
    }
}

export const chatbotManager = new ChatbotManager();
