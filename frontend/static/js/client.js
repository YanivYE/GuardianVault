import LoginView from "./views/loginView.js"
import SignupView from "./views/signupView.js"
import ForgotPasswordView from "./views/forgotPasswordView.js"
import CodeVerificationView from "./views/codeVerificationView.js"
import ResetPasswordView from "./views/resetPasswordView.js"
import MenuView from "./views/menuView.js";
import UploadView from "./views/uploadView.js"
import DownloadView from "./views/downloadView.js"
import CryptographyTunnel from "./cryptographyTunnel.js"

export default class Client {
    constructor() {
        this.socket = null;
        this.logedIn = false;
        this.username = "";
        this.cryptographyTunnel = new CryptographyTunnel();
    }

    async init() {
        try {
            await this.initSocket(); // Initialize socket
            await this.setupEventListeners(); // Set up event listeners
            await this.waitForInitialization(); // Wait for both socket and key exchange
        } catch (error) {
            console.error(error);
        }
    }
    
    async waitForInitialization() {
        return new Promise((resolve, reject) => {
            const checkInitialization = () => {
                if (this.cryptographyTunnel.sharedKey !== null && this.socket !== null) {
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
            await this.cryptographyTunnel.performKeyExchange(this.socket, serverPublicKeyBase64);
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

    async transferToServer(request, resultType) {
        const payload = await this.cryptographyTunnel.generateClientPayload(request);
        return new Promise((resolve, reject) => {
            this.socket.emit('ClientMessage', payload);
    
            this.socket.once(resultType, async (resultPayload) => {
                const operationResult = await this.cryptographyTunnel.receivePayloadFromServer(resultPayload);
                resolve(operationResult);
            });
        });
    }

    async navigateTo(url) {
        history.pushState(null, null, url);
        await this.router();
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
        await view.executeViewScript();
    };
}