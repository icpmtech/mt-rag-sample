import styles from "./UserChatMessage.module.css";

interface Props {
    message: string;
}

export const UserChatMessage = ({ message }: Props) => {
    return (
        <div className={styles.container}>
            <div className={styles.messageWrapper}>
                <div className={styles.avatarContainer}>
                    <i className={`ms-Icon ms-Icon--Contact ${styles.avatarIcon}`} />
                </div>
                <div className={styles.message}>{message}</div>
            </div>
        </div>
    );
};
