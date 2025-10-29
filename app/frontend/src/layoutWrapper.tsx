import { useEffect, useRef, useState, useMemo } from "react";
import { useMsal } from "@azure/msal-react";
import { useLogin, checkLoggedIn } from "./authConfig";
import { LoginContext } from "./loginContext";
import { ChatProvider } from "./contexts/ChatContext";
import Layout from "./pages/layout/Layout";

const LayoutWrapper = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    const { instance } = useLogin ? useMsal() : { instance: undefined };
    const mounted = useRef<boolean>(true);

    useEffect(() => {
        if (!useLogin || !instance) return;

        mounted.current = true;
        checkLoggedIn(instance)
            .then(isLoggedIn => {
                if (mounted.current) setLoggedIn(isLoggedIn);
            })
            .catch(e => {
                console.error("checkLoggedIn failed", e);
            });
        return () => {
            mounted.current = false;
        };
    }, [instance]);

    const loginContextValue = useMemo(() => ({ loggedIn, setLoggedIn }), [loggedIn, setLoggedIn]);

    return (
        <LoginContext.Provider value={loginContextValue}>
            <ChatProvider>
                <Layout />
            </ChatProvider>
        </LoginContext.Provider>
    );
};

export default LayoutWrapper;
