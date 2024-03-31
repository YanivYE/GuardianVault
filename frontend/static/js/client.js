// Import views and modules
import LoginView from "./views/loginView.js";
import SignupView from "./views/signupView.js";
import ForgotPasswordView from "./views/forgotPasswordView.js";
import CodeVerificationView from "./views/codeVerificationView.js";
import ResetPasswordView from "./views/resetPasswordView.js";
import MenuView from "./views/menuView.js";
import UploadView from "./views/uploadView.js";
import DownloadView from "./views/downloadView.js";
import CryptographyTunnel from "./cryptographyTunnel.js";

export default class Client {
    constructor() {
        // Initialize properties
        this.socket = null;
        this.loggedIn = false;
        this.username = "";
        this.csrfToken = "";
        this.cryptographyTunnel = new CryptographyTunnel();
    }

    // Initialize the client
    async init() {
        try {
            // Initialize socket
            await this.initSocket();
            // Set up event listeners
            await this.setupEventListeners();
            // Wait for both socket and key exchange
            await this.waitForInitialization();
        } catch (error) {
            console.error(error);
        }
    }
    
    // Wait for initialization
    async waitForInitialization() {
        return new Promise((resolve) => {
            const checkInitialization = () => {
                if (this.cryptographyTunnel.sharedKey && this.socket) {
                    resolve(); // Resolve when both key exchange and socket initialization are done
                } else {
                    setTimeout(checkInitialization, 100); // Check again after a short delay
                }
            };
            checkInitialization();
        });
    }

    // Set up event listeners
    async setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('server-public-key', async (serverPublicKeyBase64) => {
            await this.cryptographyTunnel.performKeyExchange(this.socket, serverPublicKeyBase64);
        });
    }

    // Initialize socket
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

    // Transfer data to server
    async transferToServer(request, resultType) {
        if(this.loggedIn) {
            request = this.csrfToken + '$' + request;
        }
        const payload = await this.cryptographyTunnel.generateClientPayload(request);
        return new Promise((resolve) => {
            this.socket.emit('ClientMessage', payload); // Send message with token if logged in
    
            this.socket.once(resultType, async (resultPayload) => {
                const operationResult = await this.cryptographyTunnel.receivePayloadFromServer(resultPayload);
                resolve(operationResult);
            });
        });
    }

    // Authenticate user
    async authenticate() {
        const authenticationRequest = 'Authentication$';
        this.csrfToken = await window.client.transferToServer(authenticationRequest, 'authenticationResult');
        console.log(this.csrfToken);
        this.loggedIn = true;
    }

    // Navigate to a specific URL
    async navigateTo(url) {
        history.pushState(null, null, url);
        await this.router();
    }
    
    // Route to appropriate view based on URL
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
        const potentialMatches = routes.map(route => ({
            route,
            isMatch: location.pathname === route.path
        }));
    
        let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);
    
        if (!match) {
            // Refresh page and return to index
            window.location.reload();
        }
    
        const view = new match.route.view();
    
        document.querySelector("#app").innerHTML = await view.getHtml();
        await view.executeViewScript();
    }
}
