import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMsal } from "@azure/msal-react";
import { useLogin, getToken } from "../../authConfig";
import { sharePointPreviewApi } from "../../api";
import { SharePointPreviewResponse } from "../../api/models";
import styles from "./SharePointViewer.module.css";

interface Props {
    sharePointUrl: string;
    citationHeight: string;
}

enum PreviewMethod {
    LOADING = "loading",
    GRAPH_EMBED = "graph_embed",
    SHAREPOINT_EMBED = "sharepoint_embed",
    NEW_TAB = "new_tab",
    ERROR = "error"
}

export const SharePointViewer: React.FC<Props> = ({ sharePointUrl, citationHeight }) => {
    const [previewMethod, setPreviewMethod] = useState<PreviewMethod>(PreviewMethod.LOADING);
    const [embedUrl, setEmbedUrl] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [retryCount, setRetryCount] = useState<number>(0);

    const { t } = useTranslation();
    const client = useLogin ? useMsal().instance : undefined;

    const tryGraphAPIPreview = async (): Promise<boolean> => {
        try {
            const token = client ? await getToken(client) : undefined;
            const previewResponse: SharePointPreviewResponse = await sharePointPreviewApi(sharePointUrl, token);

            if (previewResponse.success && previewResponse.preview_info?.embed_url) {
                setEmbedUrl(previewResponse.preview_info.embed_url);
                setPreviewMethod(PreviewMethod.GRAPH_EMBED);
                return true;
            }

            if (previewResponse.success && previewResponse.embed_url) {
                setEmbedUrl(previewResponse.embed_url);
                setPreviewMethod(PreviewMethod.SHAREPOINT_EMBED);
                return true;
            }

            return false;
        } catch (error) {
            console.warn("Graph API preview failed:", error);
            return false;
        }
    };

    const trySharePointEmbed = (): boolean => {
        // Try to generate SharePoint embed URL
        try {
            // Parse SharePoint URL to create embed URL
            const url = new URL(sharePointUrl);
            const pathParts = url.pathname.split("/");

            // Find the document part (after sites/sitename/library/)
            const sitesIndex = pathParts.findIndex(part => part === "sites");
            if (sitesIndex >= 0 && pathParts.length > sitesIndex + 3) {
                const siteName = pathParts[sitesIndex + 1];
                const libraryName = pathParts[sitesIndex + 2];
                const fileName = pathParts.slice(sitesIndex + 3).join("/");

                // Create embed URL with Doc.aspx format
                const embedUrl = `${url.protocol}//${url.hostname}/_layouts/15/Doc.aspx?sourcedoc=/${pathParts.slice(sitesIndex).join("/")}&action=embedview`;

                setEmbedUrl(embedUrl);
                setPreviewMethod(PreviewMethod.SHAREPOINT_EMBED);
                return true;
            }

            return false;
        } catch (error) {
            console.warn("SharePoint embed URL generation failed:", error);
            return false;
        }
    };

    const handleIframeError = () => {
        console.warn(`Preview method ${previewMethod} failed, trying next method`);

        if (previewMethod === PreviewMethod.GRAPH_EMBED && retryCount < 1) {
            setRetryCount(retryCount + 1);
            if (trySharePointEmbed()) {
                return;
            }
        }

        if (previewMethod === PreviewMethod.SHAREPOINT_EMBED && retryCount < 2) {
            setRetryCount(retryCount + 1);
            setPreviewMethod(PreviewMethod.NEW_TAB);
            return;
        }

        // All methods failed
        setPreviewMethod(PreviewMethod.ERROR);
        setErrorMessage(t("sharePointPreviewError"));
    };

    const handleIframeLoad = () => {
        // Check if iframe loaded successfully
        // Note: Due to same-origin policy, we can't directly check iframe content
        // But we can detect if it loaded without immediate errors
        console.log(`Preview loaded successfully using method: ${previewMethod}`);
    };

    useEffect(() => {
        const initializePreview = async () => {
            setPreviewMethod(PreviewMethod.LOADING);
            setRetryCount(0);

            // Try Graph API first (most reliable)
            const graphSuccess = await tryGraphAPIPreview();
            if (graphSuccess) {
                return;
            }

            // Try SharePoint embed URL
            const embedSuccess = trySharePointEmbed();
            if (embedSuccess) {
                return;
            }

            // Fallback to opening in new tab
            setPreviewMethod(PreviewMethod.NEW_TAB);
        };

        initializePreview();
    }, [sharePointUrl]);

    const renderContent = () => {
        switch (previewMethod) {
            case PreviewMethod.LOADING:
                return (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>{t("loadingPreview")}</p>
                    </div>
                );

            case PreviewMethod.GRAPH_EMBED:
            case PreviewMethod.SHAREPOINT_EMBED:
                return (
                    <div className={styles.embedContainer}>
                        <iframe
                            title="SharePoint Document Preview"
                            src={embedUrl}
                            width="100%"
                            height={citationHeight}
                            onError={handleIframeError}
                            onLoad={handleIframeLoad}
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            className={styles.previewIframe}
                        />
                        <div className={styles.previewInfo}>
                            <small>{previewMethod === PreviewMethod.GRAPH_EMBED ? t("previewViaGraphAPI") : t("previewViaSharePointEmbed")}</small>
                        </div>
                    </div>
                );

            case PreviewMethod.NEW_TAB:
                return (
                    <div className={styles.newTabContainer}>
                        <div className={styles.newTabMessage}>
                            <h4>{t("sharePointDocumentTitle")}</h4>
                            <p>{t("sharePointDocumentOpened")}</p>
                            <button onClick={() => window.open(sharePointUrl, "_blank")} className={styles.openSharePointButton}>
                                {t("openInSharePoint")}
                            </button>
                            <div className={styles.previewOptions}>
                                <button onClick={() => setPreviewMethod(PreviewMethod.LOADING)} className={styles.retryButton}>
                                    {t("retryPreview")}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case PreviewMethod.ERROR:
                return (
                    <div className={styles.errorContainer}>
                        <div className={styles.errorMessage}>
                            <h4>{t("previewError")}</h4>
                            <p>{errorMessage || t("sharePointPreviewError")}</p>
                            <button onClick={() => window.open(sharePointUrl, "_blank")} className={styles.openSharePointButton}>
                                {t("openInSharePoint")}
                            </button>
                            <button onClick={() => setPreviewMethod(PreviewMethod.LOADING)} className={styles.retryButton}>
                                {t("retryPreview")}
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return <div className={styles.sharePointViewer}>{renderContent()}</div>;
};
