import React, { useState, useEffect, useRef, RefObject, useContext } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Layout.module.css";
import motaEngilLogo from "../../assets/mota-engil-logo.jpg";

import { useLogin } from "../../authConfig";
import { configApi } from "../../api";
import { LoginContext } from "../../loginContext";
import { useChatContext } from "../../contexts/ChatContext";
import { LoginButton } from "../../components/LoginButton";
import { UploadFile } from "../../components/UploadFile";

const Layout = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { loggedIn } = useContext(LoginContext);
    const { clearChatFunction, openSettingsFunction, isLoading, hasQuestions } = useChatContext();
    const [showUserUpload, setShowUserUpload] = useState<boolean>(false);
    const [showChatHistoryBrowser, setShowChatHistoryBrowser] = useState<boolean>(false);
    const [showChatHistoryCosmos, setShowChatHistoryCosmos] = useState<boolean>(false);

    useEffect(() => {
        // Load configuration
        configApi().then((config: any) => {
            setShowUserUpload(config.showUserUpload);
            setShowChatHistoryBrowser(config.showChatHistoryBrowser);
            setShowChatHistoryCosmos(config.showChatHistoryCosmos);
        });
    }, []);

    return (
        <div className={styles.layout}>
            {/* Modern Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logoContainer}>
                        <img src={motaEngilLogo} alt="Mota Engil Logo" className={styles.sidebarLogo} />
                    </div>
                </div>

                <div className={styles.sidebarContent}>
                    <NavLink to="/" className={({ isActive }) => `${styles.sidebarIcon} ${isActive ? styles.active : ""}`} title="Chat">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                    </NavLink>

                    <NavLink to="/qa" className={({ isActive }) => `${styles.sidebarIcon} ${isActive ? styles.active : ""}`} title="Ask a question">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                        </svg>
                    </NavLink>

                    <div className={styles.sidebarIcon} title="Explore">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    </div>

                    {location.pathname === "/" && (
                        <div
                            className={`${styles.sidebarIcon} ${!hasQuestions || isLoading ? styles.sidebarIconDisabled : ""}`}
                            onClick={!hasQuestions || isLoading ? undefined : clearChatFunction}
                            title={t("clearChat")}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                        </div>
                    )}

                    <div className={styles.sidebarIcon} title="Create">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                    </div>

                    {showUserUpload && (
                        <div className={`${styles.sidebarIcon} ${!loggedIn ? styles.sidebarIconDisabled : ""}`} title="Upload File">
                            <UploadFile className={styles.uploadButton} disabled={!loggedIn} />
                        </div>
                    )}
                </div>

                <div className={styles.sidebarFooter}>
                    {location.pathname === "/" && ((useLogin && showChatHistoryCosmos) || showChatHistoryBrowser) && (
                        <div className={styles.sidebarIcon} title="History">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                            </svg>
                        </div>
                    )}

                    {location.pathname === "/" && (
                        <div className={styles.sidebarIcon} onClick={openSettingsFunction} title="Settings">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                            </svg>
                        </div>
                    )}

                    {useLogin && (
                        <div className={styles.loginButtonContainer}>
                            <LoginButton />
                        </div>
                    )}
                </div>
            </div>

            <main className={styles.main} id="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
