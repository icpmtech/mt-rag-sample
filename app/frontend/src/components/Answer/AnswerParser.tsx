import { renderToStaticMarkup } from "react-dom/server";
import { ChatAppResponse, getCitationFilePath } from "../../api";

type HtmlParsedAnswer = {
    answerHtml: string;
    citations: string[];
};

export function parseAnswerToHtml(answer: ChatAppResponse, isStreaming: boolean, onCitationClicked: (citationFilePath: string) => void): HtmlParsedAnswer {
    const possibleCitations = answer.context.data_points.citations || [];
    const citationLookup = answer.context.data_points.citation_lookup || {};
    const citations: string[] = [];

    // Trim any whitespace from the end of the answer after removing follow-up questions
    let parsedAnswer = answer.message.content.trim();

    // Omit a citation that is still being typed during streaming
    if (isStreaming) {
        let lastIndex = parsedAnswer.length;
        for (let i = parsedAnswer.length - 1; i >= 0; i--) {
            if (parsedAnswer[i] === "]") {
                break;
            } else if (parsedAnswer[i] === "[") {
                lastIndex = i;
                break;
            }
        }
        const truncatedAnswer = parsedAnswer.substring(0, lastIndex);
        parsedAnswer = truncatedAnswer;
    }

    const parts = parsedAnswer.split(/\[([^\]]+)\]/g);

    const fragments: string[] = parts.map((part, index) => {
        if (index % 2 === 0) {
            return part;
        } else {
            let citationIndex: number;

            const isValidCitation = possibleCitations.some(citation => {
                return citation.startsWith(part);
            });

            // If not in possibleCitations, check if it looks like a citation pattern
            // Patterns like: EWS_API#page=33, Document#page=5, api-docs, etc.
            const isLikeCitation =
                part.includes("#page=") ||
                part.includes("_API") ||
                part.includes("-api") ||
                part.includes("api-") ||
                /^[A-Z_]+#page=\d+$/.test(part) ||
                /\.(pdf|docx?|pptx?|xlsx?|txt|md)(?:#page=\d+)?$/i.test(part);

            if (!isValidCitation && !isLikeCitation) {
                return `[${part}]`;
            }

            if (citations.indexOf(part) !== -1) {
                citationIndex = citations.indexOf(part) + 1;
            } else {
                citations.push(part);
                citationIndex = citations.length;
            }

            const path = getCitationFilePath(part, citationLookup);

            return renderToStaticMarkup(
                <a
                    className="supContainer"
                    title={part}
                    onClick={() => onCitationClicked(path)}
                    onContextMenu={e => {
                        e.preventDefault();
                        // Right-click to open in new tab
                        if (path) {
                            window.open(path, "_blank");
                        }
                    }}
                >
                    <sup>{citationIndex}</sup>
                </a>
            );
        }
    });

    return {
        answerHtml: fragments.join(""),
        citations
    };
}
