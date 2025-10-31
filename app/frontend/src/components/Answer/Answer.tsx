import { useMemo, useState } from "react";
import { Stack, IconButton } from "@fluentui/react";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import styles from "./Answer.module.css";
import { ChatAppResponse, getCitationFilePath, getOriginalDocumentUrl, SpeechConfig } from "../../api";
import { parseAnswerToHtml } from "./AnswerParser";
import { AnswerIcon } from "./AnswerIcon";
import { SpeechOutputBrowser } from "./SpeechOutputBrowser";
import { SpeechOutputAzure } from "./SpeechOutputAzure";

// Helper function to get file type icons
function getFileTypeIcon(extension: string): string {
    switch (extension.toLowerCase()) {
        case "pdf":
            return "📄";
        case "doc":
        case "docx":
            return "📝";
        case "xls":
        case "xlsx":
            return "📊";
        case "ppt":
        case "pptx":
            return "📋";
        case "txt":
        case "md":
            return "📃";
        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
        case "bmp":
        case "svg":
            return "🖼️";
        case "mp4":
        case "avi":
        case "mov":
            return "🎥";
        case "mp3":
        case "wav":
        case "ogg":
            return "🎵";
        default:
            return "📁";
    }
}

interface Props {
    answer: ChatAppResponse;
    index: number;
    speechConfig: SpeechConfig;
    isSelected?: boolean;
    isStreaming: boolean;
    onCitationClicked: (filePath: string) => void;
    onThoughtProcessClicked: () => void;
    onSupportingContentClicked: () => void;
    onFollowupQuestionClicked?: (question: string) => void;
    showFollowupQuestions?: boolean;
    showSpeechOutputBrowser?: boolean;
    showSpeechOutputAzure?: boolean;
}

export const Answer = ({
    answer,
    index,
    speechConfig,
    isSelected,
    isStreaming,
    onCitationClicked,
    onThoughtProcessClicked,
    onSupportingContentClicked,
    onFollowupQuestionClicked,
    showFollowupQuestions,
    showSpeechOutputAzure,
    showSpeechOutputBrowser
}: Props) => {
    const followupQuestions = answer.context?.followup_questions;
    const parsedAnswer = useMemo(() => parseAnswerToHtml(answer, isStreaming, onCitationClicked), [answer]);
    const { t } = useTranslation();
    const sanitizedAnswerHtml = DOMPurify.sanitize(parsedAnswer.answerHtml);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        // Single replace to remove all HTML tags to remove the citations
        const textToCopy = sanitizedAnswerHtml.replace(/<a [^>]*><sup>\d+<\/sup><\/a>|<[^>]+>/g, "");

        navigator.clipboard
            .writeText(textToCopy)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => console.error("Failed to copy text: ", err));
    };

    return (
        <Stack className={`${styles.answerContainer} ${isSelected && styles.selected}`} verticalAlign="space-between">
            <Stack.Item>
                <div className={styles.answerHeader}>
                    <div className={styles.avatarContainer}>
                        <AnswerIcon />
                    </div>
                    <h4 className={styles.assistantLabel}>KnowMe</h4>
                    <div className={styles.actionButtons}>
                        <IconButton
                            className={styles.actionButton}
                            iconProps={{ iconName: copied ? "CheckMark" : "Copy" }}
                            title={copied ? t("tooltips.copied") : t("tooltips.copy")}
                            ariaLabel={copied ? t("tooltips.copied") : t("tooltips.copy")}
                            onClick={handleCopy}
                        />
                        <IconButton
                            className={styles.actionButton}
                            iconProps={{ iconName: "Lightbulb" }}
                            title={t("tooltips.showThoughtProcess")}
                            ariaLabel={t("tooltips.showThoughtProcess")}
                            onClick={() => onThoughtProcessClicked()}
                            disabled={!answer.context.thoughts?.length || isStreaming}
                        />
                        <IconButton
                            className={styles.actionButton}
                            iconProps={{ iconName: "ClipboardList" }}
                            title={t("tooltips.showSupportingContent")}
                            ariaLabel={t("tooltips.showSupportingContent")}
                            onClick={() => onSupportingContentClicked()}
                            disabled={!answer.context.data_points || isStreaming}
                        />
                        {showSpeechOutputAzure && (
                            <SpeechOutputAzure answer={sanitizedAnswerHtml} index={index} speechConfig={speechConfig} isStreaming={isStreaming} />
                        )}
                        {showSpeechOutputBrowser && <SpeechOutputBrowser answer={sanitizedAnswerHtml} />}
                    </div>
                </div>
            </Stack.Item>

            <Stack.Item grow>
                <div className={styles.answerText}>
                    <ReactMarkdown children={sanitizedAnswerHtml} rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} />
                </div>
            </Stack.Item>

            {!!parsedAnswer.citations.length && (
                <Stack.Item>
                    <Stack horizontal wrap tokens={{ childrenGap: 5 }}>
                        <span className={styles.citationLearnMore}>{t("citationWithColon")}</span>
                        {parsedAnswer.citations.map((x, i) => {
                            const citationLookup = answer.context.data_points.citation_lookup || {};
                            const path = getCitationFilePath(x, citationLookup);
                            const originalUrl = getOriginalDocumentUrl(x, citationLookup);
                            // Strip out the image filename in parentheses if it exists
                            const strippedPath = path.replace(/\([^)]*\)$/, "");

                            // Extract file extension and format display text
                            const fileExtension = x.split(".").pop()?.toLowerCase() || "";
                            const pageInfo = x.includes("#page=") ? x.replace("#page=", ` (${t("page")} `) + ")" : x;

                            // Create enhanced display text with file type
                            const fileTypeIcon = getFileTypeIcon(fileExtension);
                            const displayText = `${fileTypeIcon} ${pageInfo}`;

                            const citationKey = `${x}-${i}`;
                            const citationNumber = i + 1;

                            return (
                                <div key={citationKey} className={styles.citationContainer}>
                                    <a
                                        className={styles.citation}
                                        title={`${x} - Click to preview`}
                                        onClick={() => onCitationClicked(strippedPath)}
                                        onContextMenu={e => {
                                            e.preventDefault();
                                            window.open(originalUrl, "_blank");
                                        }}
                                    >
                                        {`${citationNumber}. ${displayText}`}
                                    </a>
                                    <button
                                        className={styles.citationOpenButton}
                                        title={t("openDocument")}
                                        onClick={e => {
                                            e.stopPropagation();
                                            window.open(originalUrl, "_blank");
                                        }}
                                    >
                                        🔗
                                    </button>
                                </div>
                            );
                        })}
                    </Stack>
                </Stack.Item>
            )}

            {!!followupQuestions?.length && showFollowupQuestions && onFollowupQuestionClicked && (
                <Stack.Item>
                    <Stack horizontal wrap className={`${!!parsedAnswer.citations.length ? styles.followupQuestionsList : ""}`} tokens={{ childrenGap: 6 }}>
                        <span className={styles.followupQuestionLearnMore}>{t("followupQuestions")}</span>
                        {followupQuestions.map((x, i) => {
                            return (
                                <a
                                    key={`followup-${i}-${x.slice(0, 20)}`}
                                    className={styles.followupQuestion}
                                    title={x}
                                    onClick={() => onFollowupQuestionClicked(x)}
                                >
                                    {`${x}`}
                                </a>
                            );
                        })}
                    </Stack>
                </Stack.Item>
            )}
        </Stack>
    );
};
