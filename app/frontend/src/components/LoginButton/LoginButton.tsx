import { DefaultButton } from "@fluentui/react";
import { useMsal } from "@azure/msal-react";
import { useTranslation } from "react-i18next";

import styles from "./LoginButton.module.css";
import { getRedirectUri, loginRequest, appServicesLogout, getUsername, checkLoggedIn } from "../../authConfig";
import { useState, useEffect, useContext } from "react";
import { LoginContext } from "../../loginContext";
import { UserAvatar } from "../UserAvatar";
import { UserOffcanvas } from "../UserOffcanvas";

export const LoginButton = () => {
    const { instance } = useMsal();
    const { loggedIn, setLoggedIn } = useContext(LoginContext);
    const activeAccount = instance.getActiveAccount();
    const [username, setUsername] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchUserData = async () => {
            const fetchedUsername = (await getUsername(instance)) ?? "";
            setUsername(fetchedUsername);

            // Get user email from active account
            if (activeAccount?.username) {
                setUserEmail(activeAccount.username);
            }
        };

        fetchUserData();
    }, [activeAccount]);

    const handleLoginPopup = () => {
        /**
         * When using popup and silent APIs, we recommend setting the redirectUri to a blank page or a page
         * that does not implement MSAL. Keep in mind that all redirect routes must be registered with the application
         * For more information, please follow this link: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md#redirecturi-considerations
         */
        instance
            .loginPopup({
                ...loginRequest,
                redirectUri: getRedirectUri()
            })
            .catch(error => console.log(error))
            .then(async () => {
                setLoggedIn(await checkLoggedIn(instance));
                const fetchedUsername = (await getUsername(instance)) ?? "";
                setUsername(fetchedUsername);

                const newActiveAccount = instance.getActiveAccount();
                if (newActiveAccount?.username) {
                    setUserEmail(newActiveAccount.username);
                }
            });
    };

    const handleLogoutPopup = () => {
        if (activeAccount) {
            instance
                .logoutPopup({
                    mainWindowRedirectUri: "/", // redirects the top level app after logout
                    account: instance.getActiveAccount()
                })
                .catch(error => console.log(error))
                .then(async () => {
                    setLoggedIn(await checkLoggedIn(instance));
                    setUsername((await getUsername(instance)) ?? "");
                    setUserEmail("");
                    setIsOffcanvasOpen(false);
                });
        } else {
            appServicesLogout();
            setIsOffcanvasOpen(false);
        }
    };

    const handleAvatarClick = () => {
        setIsOffcanvasOpen(true);
    };

    const handleOffcanvasDismiss = () => {
        setIsOffcanvasOpen(false);
    };

    if (loggedIn) {
        return (
            <>
                <div className={styles.avatarContainer} onClick={handleAvatarClick}>
                    <UserAvatar username={username} size="medium" isOnline={true} className={styles.loginAvatar} />
                </div>
                <UserOffcanvas
                    isOpen={isOffcanvasOpen}
                    onDismiss={handleOffcanvasDismiss}
                    username={username}
                    userEmail={userEmail}
                    isLoggedIn={loggedIn}
                    onLogin={handleLoginPopup}
                    onLogout={handleLogoutPopup}
                />
            </>
        );
    }

    return (
        <>
            <DefaultButton text={t("login")} className={styles.loginButton} onClick={handleLoginPopup} />
            <UserOffcanvas
                isOpen={isOffcanvasOpen}
                onDismiss={handleOffcanvasDismiss}
                username=""
                userEmail=""
                isLoggedIn={false}
                onLogin={handleLoginPopup}
                onLogout={handleLogoutPopup}
            />
        </>
    );
};
