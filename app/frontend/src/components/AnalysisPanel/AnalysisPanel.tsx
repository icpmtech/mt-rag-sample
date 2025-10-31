import { Stack, Pivot, PivotItem } from "@fluentui/react";
import { useTranslation } from "react-i18next";
import styles from "./AnalysisPanel.module.css";

import { SupportingContent } from "../SupportingContent";
import { ChatAppResponse } from "../../api";
import { AnalysisPanelTabs } from "./AnalysisPanelTabs";
import { ThoughtProcess } from "./ThoughtProcess";
import { MarkdownViewer } from "../MarkdownViewer";
import { useMsal } from "@azure/msal-react";
import { getHeaders } from "../../api";
import { useLogin, getToken } from "../../authConfig";
import { useState, useEffect } from "react";

interface Props {
    className: string;
    activeTab: AnalysisPanelTabs;
    onActiveTabChanged: (tab: AnalysisPanelTabs) => void;
    activeCitation: string | undefined;
    citationHeight: string;
    answer: ChatAppResponse;
}

const pivotItemDisabledStyle = { disabled: true, style: { color: "grey" } };

export const AnalysisPanel = ({ answer, activeTab, activeCitation, citationHeight, className, onActiveTabChanged }: Props) => {
    const isDisabledThoughtProcessTab: boolean = !answer.context.thoughts;
    const isDisabledSupportingContentTab: boolean = !answer.context.data_points;
    const isDisabledCitationTab: boolean = !activeCitation;
    const [citation, setCitation] = useState("");
    const [citationError, setCitationError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const client = useLogin ? useMsal().instance : undefined;
    const { t } = useTranslation();

    const fetchCitation = async () => {
        const token = client ? await getToken(client) : undefined;
        setIsLoading(true);
        setCitationError(null); // Clear previous errors
        setSuccessMessage(null); // Clear previous success messages

        if (activeCitation) {
            try {
                // Import the getCitationFilePath function to convert citation to actual URL
                const { getCitationFilePath } = await import("../../api");

                // Get citation lookup from answer context
                const citationLookup = answer.context.data_points?.citation_lookup || {};

                // Convert citation (like "EWS_API#page=34") to actual storage URL
                const actualUrl = getCitationFilePath(activeCitation, citationLookup);

                console.log("Fetching citation:", activeCitation, "-> URL:", actualUrl);
                console.log("Citation lookup available:", Object.keys(citationLookup));

                // Get hash from the original citation as it may contain #page=N
                const originalHash = activeCitation.indexOf("#") !== -1 ? activeCitation.split("#")[1] : "";

                const response = await fetch(actualUrl, {
                    method: "GET",
                    headers: await getHeaders(token)
                });

                if (response.ok) {
                    const citationContent = await response.blob();
                    let citationObjectUrl = URL.createObjectURL(citationContent);
                    // Add hash back to the new blob URL for PDF page navigation
                    if (originalHash) {
                        citationObjectUrl += "#" + originalHash;
                    }
                    setCitation(citationObjectUrl);
                    setCitationError(null);
                    setSuccessMessage("Citation loaded successfully");
                    // Clear success message after 3 seconds
                    setTimeout(() => setSuccessMessage(null), 3000);
                } else {
                    console.error("Failed to fetch citation:", response.status, response.statusText);
                    const errorMessage =
                        response.status === 404
                            ? `Citation file not found: ${activeCitation}`
                            : `Failed to load citation (${response.status}): ${response.statusText}`;
                    setCitationError(errorMessage);
                    setCitation("");
                }
            } catch (error) {
                console.error("Error fetching citation:", error);
                setCitationError(`Error loading citation: ${error instanceof Error ? error.message : "Unknown error"}`);
                setCitation("");
            }
        } else {
            setCitation("");
            setCitationError(null);
        }
        setIsLoading(false);
    };
    useEffect(() => {
        fetchCitation();
        // Cleanup function to revoke object URLs to prevent memory leaks
        return () => {
            if (citation && citation.startsWith("blob:")) {
                URL.revokeObjectURL(citation);
            }
        };
    }, [activeCitation]);

    const renderFileViewer = () => {
        if (!activeCitation) {
            return (
                <div className={styles.noContent}>
                    <div className={styles.noContentIcon}>📄</div>
                    <div>{t("messages.noCitationSelected")}</div>
                </div>
            );
        }

        if (citationError) {
            const isNotFoundError = citationError.includes("not found") || citationError.includes("404");
            return (
                <div className={styles.error}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <div className={styles.errorTitle}>{isNotFoundError ? t("messages.citationNotAvailable") : t("messages.loadingError")}</div>
                    <div className={styles.errorMessage}>{isNotFoundError ? t("messages.citationNotFoundDescription") : citationError}</div>
                    <button onClick={fetchCitation} className={styles.retryButton} disabled={isLoading}>
                        {isLoading ? "⏳" : "🔄"} {t("actions.retry") || "Retry"}
                    </button>
                </div>
            );
        }

        if (!citation || isLoading) {
            return (
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner}></div>
                    <div className={styles.loadingText}>{t("messages.loadingCitation")}</div>
                </div>
            );
        }

        // Extract file extension from the original URL, not the blob URL
        const fileExtension = activeCitation.split(".").pop()?.toLowerCase();

        // Render citation header with file info
        const renderCitationHeader = () => (
            <div className={styles.citationHeader}>
                <div className={styles.citationTitle}>📄 {activeCitation}</div>
                <div className={styles.citationActions}>
                    <button onClick={fetchCitation} className={styles.actionButton} title={t("actions.refresh")}>
                        🔄
                    </button>
                </div>
            </div>
        );

        const citationContent = (() => {
            switch (fileExtension) {
                case "png":
                case "jpg":
                case "jpeg":
                case "gif":
                case "bmp":
                case "webp":
                    return (
                        <div className={styles.imageContainer}>
                            <img src={citation} className={styles.citationImg} alt="Citation Image" />
                        </div>
                    );
                case "md":
                    return <MarkdownViewer src={activeCitation} />;
                case "pdf":
                    return (
                        <iframe
                            title="Citation PDF"
                            src={citation}
                            width="100%"
                            height={citationHeight}
                            className={styles.citationIframe}
                            onError={() => console.error("Error loading PDF")}
                        />
                    );
                case "txt":
                case "csv":
                    return <iframe title="Citation Text" src={citation} width="100%" height={citationHeight} className={styles.citationIframe} />;
                default:
                    return (
                        <div className={styles.defaultViewer}>
                            <iframe title="Citation" src={citation} width="100%" height={citationHeight} className={styles.citationIframe} />
                            <div className={styles.downloadLink}>
                                <a href={citation} download target="_blank" rel="noopener noreferrer">
                                    {t("actions.downloadFile")}
                                </a>
                            </div>
                        </div>
                    );
            }
        })();

        return (
            <div>
                {renderCitationHeader()}
                {citationContent}
            </div>
        );
    };

    return (
        <Pivot
            className={className}
            selectedKey={activeTab}
            onLinkClick={pivotItem => pivotItem && onActiveTabChanged(pivotItem.props.itemKey! as AnalysisPanelTabs)}
        >
            <PivotItem
                itemKey={AnalysisPanelTabs.ThoughtProcessTab}
                headerText={t("headerTexts.thoughtProcess")}
                headerButtonProps={isDisabledThoughtProcessTab ? pivotItemDisabledStyle : undefined}
            >
                <ThoughtProcess thoughts={answer.context.thoughts || []} />
            </PivotItem>
            <PivotItem
                itemKey={AnalysisPanelTabs.SupportingContentTab}
                headerText={t("headerTexts.supportingContent")}
                headerButtonProps={isDisabledSupportingContentTab ? pivotItemDisabledStyle : undefined}
            >
                <SupportingContent supportingContent={answer.context.data_points} />
            </PivotItem>
            <PivotItem
                itemKey={AnalysisPanelTabs.CitationTab}
                headerText={t("headerTexts.citation")}
                headerButtonProps={isDisabledCitationTab ? pivotItemDisabledStyle : undefined}
            >
                {renderFileViewer()}
            </PivotItem>
        </Pivot>
    );
};
