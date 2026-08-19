//#region MSAL Configuration >>>>>>>>>>>>>>>>>>>>>>>

const msalConfig = {
    auth: {
        clientId: "4df1096c-4fe4-4d67-b93e-043e68f12ec0",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: window.location.origin + window.location.pathname
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false
    }
};

let msalInstance = null;

if (typeof msal !== "undefined") {
    msalInstance = new msal.PublicClientApplication(msalConfig);
} else {
    console.warn("MSAL CDN library is not detected. Ensure script tag is present in index.html.");
}

//#endregion

//#region Initialization & Modal Handlers >>>>>>>>>>>>>>>>>>>>>>>

export async function initializeAuth(authStateObj) {
    const authModal = document.getElementById("auth-disclaimer-modal");
    const openModalBtn = document.getElementById("open-auth-modal-btn");
    const closeModalBtn = document.getElementById("auth-modal-close");
    const cancelAuthBtn = document.getElementById("cancel-auth-btn");
    const proceedLoginBtn = document.getElementById("proceed-login-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (openModalBtn && authModal) {
        openModalBtn.addEventListener("click", () => {
            authModal.style.display = "block";
        });
    }

    const hideAuthModal = () => {
        if (authModal) authModal.style.display = "none";
    };

    if (closeModalBtn) closeModalBtn.addEventListener("click", hideAuthModal);
    if (cancelAuthBtn) cancelAuthBtn.addEventListener("click", hideAuthModal);

    window.addEventListener("click", (e) => {
        if (e.target === authModal) hideAuthModal();
    });

    if (proceedLoginBtn && msalInstance) {
        proceedLoginBtn.addEventListener("click", () => {
            hideAuthModal();
            msalInstance.loginRedirect({
                scopes: ["User.Read", "openid", "profile", "email"]
            });
        });
    }

    if (logoutBtn && msalInstance) {
        logoutBtn.addEventListener("click", () => {
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                msalInstance.logoutRedirect({
                    account: accounts[0],
                    postLogoutRedirectUri: window.location.origin + window.location.pathname
                });
            }
        });
    }

    if (msalInstance) {
        try {
            const response = await msalInstance.handleRedirectPromise();
            if (response !== null) {
                applyAuthenticatedSession(response.account, response.accessToken, authStateObj);
            } else {
                const accounts = msalInstance.getAllAccounts();
                if (accounts.length > 0) {
                    const silentToken = await msalInstance.acquireTokenSilent({
                        account: accounts[0],
                        scopes: ["User.Read"]
                    });
                    applyAuthenticatedSession(accounts[0], silentToken.accessToken, authStateObj);
                }
            }
        } catch (error) {
            console.error("MSAL Authentication resolution error:", error);
        }
    }
}

function applyAuthenticatedSession(account, token, authStateObj) {
    const greetingEl = document.getElementById("user-greeting");
    const loginBtn = document.getElementById("open-auth-modal-btn");
    const logoutBtn = document.getElementById("logout-btn");

    const displayName = account.name || account.username || "Authenticated User";

    if (greetingEl) greetingEl.textContent = displayName;
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

    authStateObj.userId = account.username || account.homeAccountId;
    authStateObj.userName = displayName;
    authStateObj.authToken = token;
}

//#endregion
