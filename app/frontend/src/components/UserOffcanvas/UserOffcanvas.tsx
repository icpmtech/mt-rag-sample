import React from "react";
import { Panel, PanelType, DefaultButton, Separator } from "@fluentui/react";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "../UserAvatar";
import styles from "./UserOffcanvas.module.css";

interface UserOffcanvasProps {
    isOpen: boolean;
    onDismiss: () => void;
    username: string;
    userEmail?: string;
    isLoggedIn: boolean;
    onLogin: () => void;
    onLogout: () => void;
}

export const UserOffcanvas: React.FC<UserOffcanvasProps> = ({ isOpen, onDismiss, username, userEmail, isLoggedIn, onLogin, onLogout }) => {
    const { t } = useTranslation();

    if (!isLoggedIn) {
        return (
            <Panel
                type={PanelType.customNear}
                customWidth="300px"
                isOpen={isOpen}
                onDismiss={onDismiss}
                headerText={t("login")}
                isBlocking={false}
                className={styles.userPanel}
            >
                <div className={styles.loginContent}>
                    <div className={styles.loginIcon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    </div>
                    <h3 className={styles.loginTitle}>{t("welcomeMessage")}</h3>
                    <p className={styles.loginDescription}>Faça login para acessar todas as funcionalidades do Assistente Mota Engil</p>
                    <DefaultButton text={t("login")} onClick={onLogin} className={styles.loginButton} primary />
                </div>
            </Panel>
        );
    }

    return (
        <Panel
            type={PanelType.customNear}
            customWidth="300px"
            isOpen={isOpen}
            onDismiss={onDismiss}
            headerText={t("userProfile")}
            isBlocking={false}
            className={styles.userPanel}
        >
            <div className={styles.userContent}>
                <div className={styles.userHeader}>
                    <UserAvatar username={username} size="large" isOnline={true} className={styles.profileAvatar} />
                    <div className={styles.userInfo}>
                        <h3 className={styles.userName}>{username}</h3>
                        {userEmail && <p className={styles.userEmail}>{userEmail}</p>}
                        <span className={styles.statusBadge}>
                            <span className={styles.statusDot}></span>
                            Online
                        </span>
                    </div>
                </div>

                <Separator />

                <div className={styles.userActions}>
                    <div className={styles.actionItem}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <span>Sessão Ativa</span>
                    </div>

                    <div className={styles.actionItem}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                        </svg>
                        <span>Configurações</span>
                    </div>

                    <div className={styles.actionItem}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                        </svg>
                        <span>Histórico</span>
                    </div>
                </div>

                <Separator />

                <div className={styles.logoutSection}>
                    <DefaultButton text={t("logout")} onClick={onLogout} className={styles.logoutButton} />
                </div>

                <div className={styles.footer}>
                    <p className={styles.footerText}>Assistente Mota Engil v1.0</p>
                </div>
            </div>
        </Panel>
    );
};
