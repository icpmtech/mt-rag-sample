import React from "react";
import styles from "./UserAvatar.module.css";

interface UserAvatarProps {
    username?: string;
    size?: "small" | "medium" | "large";
    isOnline?: boolean;
    onClick?: () => void;
    className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ username = "User", size = "medium", isOnline = false, onClick, className }) => {
    // Get initials from username
    const getInitials = (name: string): string => {
        return name
            .split(" ")
            .map(part => part.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    // Generate a color class based on the username
    const getAvatarColorClass = (name: string): string => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = (Math.abs(hash) % 12) + 1;
        return `color${colorIndex}`;
    };

    return (
        <div
            className={`${styles.avatar} ${styles[size]} ${styles[getAvatarColorClass(username)]} ${onClick ? styles.clickable : ""} ${className || ""}`}
            onClick={onClick}
        >
            <span className={styles.initials}>{getInitials(username)}</span>
            {isOnline && <div className={styles.onlineIndicator}></div>}
        </div>
    );
};
