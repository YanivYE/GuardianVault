import LoginView from "./views/loginView.js"
import SignupView from "./views/signupView.js"
import ForgotPasswordView from "./views/forgotPasswordView.js"
import CodeVerificationView from "./views/codeVerificationView.js"
import ResetPasswordView from "./views/resetPasswordView.js"
import MenuView from "./views/menuView.js";
import UploadView from "./views/uploadView.js"
import DownloadView from "./views/downloadView.js"
import Utils from "./utils.js"

export default class Client {
    constructor() {
        this.sharedKey = null;
        this.socket = null;
        this.logedIn = false;
        this.username = "";
        this.previousPage = null;
        this.utils = new Utils();
    }

    async init() {
        try {
            await this.initSocket(); // Initialize socket
            await this.setupEventListeners(); // Set up event listeners
            await this.waitForInitialization(); // Wait for both socket and key exchange
            this.startRouterLoop();
        } catch (error) {
            console.error(error);
        }
    }

    async startRouterLoop() {
        while (true) {
            await new Promise(resolve => {
                window.addEventListener("popstate", async () => {
                    this.router();
                    resolve(); // Resolve the promise once the router is called
                });
            });
        }
    }
    
    async waitForInitialization() {
        return new Promise((resolve, reject) => {
            const checkInitialization = () => {
                if (this.sharedKey !== null && this.socket !== null) {
                    resolve(); // Resolve when both key exchange and socket initialization are done
                } else {
                    setTimeout(checkInitialization, 100); // Check again after a short delay
                }
            };
            checkInitialization();
        });
    }

    async setupEventListeners() {

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('server-public-key', async (serverPublicKeyBase64) => {
            await this.performKeyExchange(serverPublicKeyBase64);
        });
    }

    async initSocket() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.1.3/socket.io.js';
            script.onload = () => {
                this.socket = io();
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load socket.io library'));
            };
            document.head.appendChild(script);
        });
    }

    async performKeyExchange(serverPublicKeyBase64) {
        return new Promise(async (resolve, reject) => {
            try {
                const keyPair = await window.crypto.subtle.generateKey(
                    {
                        name: "ECDH",
                        namedCurve: "P-256"
                    },
                    true,
                    ["deriveKey", "deriveBits"]
                );
    
                const clientPublicKey = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
                const clientPublicKeyBase64 = this.utils.arrayBufferToBase64(clientPublicKey);
    
                this.socket.emit('client-public-key', clientPublicKeyBase64);
    
                const importedServerPublicKey = await window.crypto.subtle.importKey(
                    "raw",
                    this.utils.base64ToArrayBuffer(serverPublicKeyBase64),
                    {
                        name: "ECDH",
                        namedCurve: "P-256"
                    },
                    true,
                    []
                );
    
                const sharedSecretAlgorithm = {
                    name: 'ECDH',
                    namedCurve: 'P-256',
                    public: importedServerPublicKey
                };
    
                this.sharedKey = await window.crypto.subtle.deriveBits(
                    sharedSecretAlgorithm,
                    keyPair.privateKey,
                    256
                );
    
                this.sharedKey = await this.utils.hexToCryptoKey(this.utils.arrayBufferToHexString(this.sharedKey));
    
                resolve(); // Resolve the promise to indicate key exchange completion
            } catch (error) {
                reject(error); // Reject with error if key exchange fails
            }
        });
    }

    // Function to send payload to the server
    async sendToServerPayload(data) {
        const { iv, ciphertext, tag } = await this.encryptData(data);
        const payload = new Uint8Array(iv.length + ciphertext.length + tag.length);
        payload.set(iv, 0);
        payload.set(ciphertext, iv.length);
        payload.set(tag, iv.length + ciphertext.length);
        const base64Payload = this.utils.arrayBufferToBase64(payload.buffer);
        return base64Payload;
    }

    async receivePayloadFromServer(ServerPayload) { 
        const payload = this.utils.base64ToArrayBuffer(ServerPayload);
        return await this.decryptData(payload);
    }

    async encryptData(data) {    
        // Generate a random IV (Initialization Vector)
        const iv = crypto.getRandomValues(new Uint8Array(16));

        // Convert the text to ArrayBuffer
        const arrayBufferData = new TextEncoder().encode(data);

        // Encrypt the data using AES-GCM
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.sharedKey,
            arrayBufferData
        );

        // Get the ciphertext and authentication tag
        const ciphertext = new Uint8Array(encryptedData);
        const tag = new Uint8Array(encryptedData.slice(-16));

        return { iv, ciphertext, tag };
    }

    async decryptData(payload) {    
        try {
            // Decrypt the data using AES-GCM
            const decryptedData = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: payload.slice(0, 16)},
                this.sharedKey,
                payload.slice(16)
            );

            // Convert the decrypted ArrayBuffer to a string
            const decryptedText = new TextDecoder().decode(decryptedData);

            // Return the decrypted plaintext
            return decryptedText;
        } catch (error) {
            // Handle decryption errors
            console.error('Decryption error:', error.message);
            throw error;
        }
    }

    async navigateTo(url) {
        history.pushState(null, null, url);
        this.router();
    };
    
    async router() {
        const routes = [
            { path: "/login", view: LoginView },
            { path: "/signup", view: SignupView },
            { path: "/forgotPassword", view: ForgotPasswordView },
            { path: "/codeVerification", view: CodeVerificationView },
            { path: "/resetPassword", view: ResetPasswordView },
            { path: "/menu", view: MenuView },
            { path: "/upload", view: UploadView },
            { path: "/download", view: DownloadView }
        ];
    
        // Test each route for potential match
        const potentialMatches = routes.map(route => {
            return {
                route: route,
                isMatch: location.pathname === route.path
            };
        });
    
        let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);
    
        if (!match) {
            // refresh page and return to index
            window.location.reload();
        }
    
        const view = new match.route.view();
    
        document.querySelector("#app").innerHTML = await view.getHtml();
        await view.loadScript();
    };
    

}