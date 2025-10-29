import React, { createContext, useContext, useState, useMemo } from "react";

interface ChatContextType {
    clearChatFunction: () => void;
    setClearChatFunction: (fn: () => void) => void;
    openSettingsFunction: () => void;
    setOpenSettingsFunction: (fn: () => void) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    hasQuestions: boolean;
    setHasQuestions: (hasQuestions: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [clearChatFunction, setClearChatFunction] = useState<() => void>(() => () => {});
    const [openSettingsFunction, setOpenSettingsFunction] = useState<() => void>(() => () => {});
    const [isLoading, setIsLoading] = useState(false);
    const [hasQuestions, setHasQuestions] = useState(false);

    const contextValue = useMemo(
        () => ({
            clearChatFunction,
            setClearChatFunction,
            openSettingsFunction,
            setOpenSettingsFunction,
            isLoading,
            setIsLoading,
            hasQuestions,
            setHasQuestions
        }),
        [clearChatFunction, openSettingsFunction, isLoading, hasQuestions]
    );

    return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};

export const useChatContext = (): ChatContextType => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChatContext must be used within a ChatProvider");
    }
    return context;
};
