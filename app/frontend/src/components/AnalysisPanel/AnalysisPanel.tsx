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
                // Import the getCitationFilePath and fetchSharePointContent functions
                const { getCitationFilePath, fetchSharePointContent } = await import("../../api");

                // Get citation lookup from answer context
                const citationLookup = answer.context.data_points?.citation_lookup || {};

                // Convert citation (like "EWS_API#page=34") to actual storage URL
                const actualUrl = getCitationFilePath(activeCitation, citationLookup);

                console.log("=== CITATION DEBUG ===");
                console.log("Original citation:", activeCitation);
                console.log("Processed URL:", actualUrl);
                console.log("Citation lookup available:", Object.keys(citationLookup));
                console.log("Is SharePoint?", actualUrl.startsWith("sharepoint:"));
                console.log("===================");

                // Get hash from the original citation as it may contain #page=N
                const hashIndex = activeCitation.indexOf("#");
                const originalHash = hashIndex !== -1 ? activeCitation.substring(hashIndex + 1) : "";

                let citationContent: Blob;

                // Check if this is a SharePoint URL that needs Graph API
                if (actualUrl.startsWith("sharepoint:")) {
                    // Remove the "sharepoint:" prefix
                    let sharePointUrl = actualUrl.substring("sharepoint:".length);
                    // Remove any hash fragment (#page=1, etc.) before sending to backend
                    const hashIdx = sharePointUrl.indexOf("#");
                    if (hashIdx !== -1) {
                        sharePointUrl = sharePointUrl.substring(0, hashIdx);
                    }
                    console.log("Fetching SharePoint document via Graph API:", sharePointUrl);
                    citationContent = await fetchSharePointContent(sharePointUrl, token);
                } else {
                    // Regular fetch for blob storage or other URLs
                    const response = await fetch(actualUrl, {
                        method: "GET",
                        headers: await getHeaders(token)
                    });

                    if (!response.ok) {
                        console.error("Failed to fetch citation:", response.status, response.statusText);
                        const errorMessage =
                            response.status === 404
                                ? `Citation file not found: ${activeCitation}`
                                : `Failed to load citation (${response.status}): ${response.statusText}`;
                        setCitationError(errorMessage);
                        setCitation("");
                        setIsLoading(false);
                        return;
                    }
                    citationContent = await response.blob();
                }

                let citationObjectUrl = URL.createObjectURL(citationContent);
                // Add hash back to the new blob URL for PDF page navigation
                if (originalHash) {
                    citationObjectUrl += "#" + originalHash;
                }
                setCitation(citationObjectUrl);
                setCitationError(null);
                setSuccessMessage(t("messages.citationLoadedSuccessfully") || "Citation loaded successfully");
                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(null), 3000);
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
        if (activeCitation) {
            fetchCitation();
        } else {
            setCitation("");
            setCitationError(null);
            setSuccessMessage(null);
            setIsLoading(false);
        }

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
                    <div>{t("messages.noCitationSelected") || "No citation selected"}</div>
                </div>
            );
        }

        if (citationError) {
            const isNotFoundError = citationError.includes("not found") || citationError.includes("404");
            return (
                <div className={styles.error}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <div className={styles.errorTitle}>
                        {isNotFoundError ? t("messages.citationNotAvailable") || "Citation Not Available" : t("messages.loadingError") || "Loading Error"}
                    </div>
                    <div className={styles.errorMessage}>
                        {isNotFoundError
                            ? t("messages.citationNotFoundDescription") ||
                              "The citation could not be found. This might be because the document is not accessible or the reference is outdated."
                            : citationError}
                    </div>
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
                    <div className={styles.loadingText}>{t("messages.loadingCitation") || "Loading citation..."}</div>
                </div>
            );
        }

        // Extract file extension from the original URL, not the blob URL
        const lastDotIndex = activeCitation.lastIndexOf(".");
        const fileExtension = lastDotIndex !== -1 ? activeCitation.substring(lastDotIndex + 1).toLowerCase() : "";

        // Render citation header with file info
        const renderCitationHeader = () => (
            <div className={styles.citationHeader}>
                <div className={styles.citationTitle}>📄 {activeCitation}</div>
                <div className={styles.citationActions}>
                    <button onClick={fetchCitation} className={styles.actionButton} title={t("actions.refresh") || "Refresh"}>
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
                                    {t("actions.downloadFile") || "Download File"}
                                </a>
                            </div>
                        </div>
                    );
            }
        })();

        return (
            <div>
                {renderCitationHeader()}
                {successMessage && <div className={styles.successMessage}>✅ {successMessage}</div>}
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
