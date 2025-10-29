import { Stack, PrimaryButton } from "@fluentui/react";
import { ErrorCircle24Regular } from "@fluentui/react-icons";

import styles from "./Answer.module.css";

interface Props {
    error: string;
    onRetry: () => void;
}

export const AnswerError = ({ error, onRetry }: Props) => {
    return (
        <Stack className={styles.answerContainer} verticalAlign="space-between">
            <Stack.Item>
                <div className={styles.answerHeader}>
                    <div className={`${styles.avatarContainer} ${styles.errorAvatar}`}>
                        <ErrorCircle24Regular aria-hidden="true" aria-label="Error icon" primaryFill="white" />
                    </div>
                    <h4 className={styles.assistantLabel}>KnowMe</h4>
                </div>
            </Stack.Item>

            <Stack.Item grow>
                <p className={styles.answerText}>{error}</p>
            </Stack.Item>

            <PrimaryButton className={styles.retryButton} onClick={onRetry} text="Retry" />
        </Stack>
    );
};
