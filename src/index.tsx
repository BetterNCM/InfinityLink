/**
 * @fileoverview
 * 此处的脚本将会在插件管理器加载插件期间被加载
 * 一般情况下只需要从这个入口点进行开发即可满足绝大部分需求
 */
import {
    Alert,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Radio,
    RadioGroup,
    Switch,
    Typography,
} from "@mui/material";
import * as React from "react";
import { render } from "react-dom";
import { MdError } from "react-icons/md";

import "./index.scss";

import { useLocalStorage } from "./hooks";
import {
    STORE_KEY_DCRPC_ENABLED,
    STORE_KEY_INFO_PROVIDER,
    STORE_KEY_SMTC_ENABLED,
    STORE_KEY_SMTC_IMPL,
} from "./keys";
import { BaseProvider } from "./SongInfoProviders/BaseProvider";
import { DOMProvider } from "./SongInfoProviders/DOMProvider";
import { NativeProvider } from "./SongInfoProviders/NativeProvider";

// receivers
import { DCRPC } from "./Receivers/dc-rpc";
import { SMTC } from "./Receivers/smtc";
import { SMTCFrontend } from "./Receivers/smtc-frontend";

let configElement = document.createElement("div");

plugin.onLoad((selfPlugin) => {
    render(<Main />, configElement);
});

function Main() {
    const nativePluginLoaded = React.useMemo(() => {
        try {
            return betterncm_native.native_plugin.call("inflink.test", []) === "true";
        } catch (e) {
            return false;
        }
    }, []);

    if (!nativePluginLoaded) {
        return (
            <div>
                <Alert color="error" icon={<MdError />}>
                    <Typography fontWeight="lg" mt={0.25}>
                        Native Plugin未加载！
                    </Typography>
                    <Typography fontSize="sm" sx={{ opacity: 0.8 }}>
                        InfLink将无法使用，请确定您使用的是 1.0.0-pre2 及以上版本的
                        BetterNCM。 若不是 请通过 BetterNCM Installer 更新。
                    </Typography>
                </Alert>
            </div>
        );
    }

    const [SMTCEnabled, setSMTCEnabled] = useLocalStorage(STORE_KEY_SMTC_ENABLED, true);

    const [DCRPCEnabled, setDCRPCEnabled] = useLocalStorage(
        STORE_KEY_DCRPC_ENABLED,
        false,
    );

    const [infoProviderName, setInfoProviderName] = useLocalStorage(
        STORE_KEY_INFO_PROVIDER,
        "dom",
    );

    const [InfoProvider, setInfoProvider] = React.useState<BaseProvider | null>(null);

    const [smtcImpl, setSmtcImpl] = useLocalStorage<"native" | "frontend">(
        STORE_KEY_SMTC_IMPL,
        "native",
    );

    const smtcImplObj = React.useMemo(
        () => (smtcImpl === "native" ? SMTC : SMTCFrontend),
        [smtcImpl],
    );

    React.useEffect(() => {
        if (InfoProvider) {
            InfoProvider.disabled = true;
            InfoProvider.dispatchEvent(new CustomEvent("disable"));
        }

        if (infoProviderName === "dom") setInfoProvider(new DOMProvider());
        if (infoProviderName === "native") setInfoProvider(new NativeProvider());
    }, [infoProviderName]);

    React.useEffect(() => {
        InfoProvider?.dispatchEvent(new CustomEvent("enable"));
    }, [InfoProvider]);

    React.useEffect(() => {
        async function onUpdateSongInfo(e) {
            if (SMTCEnabled) smtcImplObj.update(e.detail);

            if (DCRPCEnabled) DCRPC.update(e.detail);
        }

        function onUpdatePlayState(e) {
            const state = e.detail === "Playing" ? 3 : 4;

            if (SMTCEnabled) smtcImplObj.updatePlayState(state);
        }

        async function onUpdateTimeline(e) {
            if (SMTCEnabled) smtcImplObj.updateTimeline(e.detail);
        }

        InfoProvider?.addEventListener("updatePlayState", onUpdatePlayState);
        InfoProvider?.addEventListener("updateSongInfo", onUpdateSongInfo);
        InfoProvider?.addEventListener("updateTimeline", onUpdateTimeline);

        return () => {
            InfoProvider?.removeEventListener("updatePlayState", onUpdatePlayState);
            InfoProvider?.removeEventListener("updateSongInfo", onUpdateSongInfo);
            InfoProvider?.removeEventListener("updateTimeline", onUpdateTimeline);
        };
    }, [InfoProvider, smtcImplObj]);

    React.useEffect(() => {
        SMTC.disable();
        SMTCFrontend.disable();
        if (SMTCEnabled) {
            smtcImplObj.apply((msg) => {
                InfoProvider?.dispatchEvent(new CustomEvent(msg));
            });
        }
    }, [InfoProvider, SMTCEnabled, smtcImplObj]);

    React.useEffect(() => {
        if (DCRPCEnabled) {
            DCRPC.apply();
        }
    }, [DCRPCEnabled]);

    return (
        <div>
            <FormGroup>
                <FormLabel>信息源</FormLabel>
                <RadioGroup
                    row
                    defaultValue={infoProviderName}
                    onChange={(_, v) => setInfoProviderName(v)}
                    name="infoprovider"
                >
                    <FormControlLabel value="dom" control={<Radio />} label="DOM" />
                    <FormControlLabel
                        value="native"
                        control={<Radio />}
                        label="原生 (3.0.0 不可用)"
                    />
                </RadioGroup>

                <div>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={SMTCEnabled}
                                onChange={(e, checked) => setSMTCEnabled(checked)}
                            />
                        }
                        label="开启 SMTC"
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={DCRPCEnabled}
                                onChange={(e, checked) => setDCRPCEnabled(checked)}
                            />
                        }
                        label="开启 Discord RPC"
                    />
                </div>

                {SMTCEnabled ? (
                    <div>
                        <FormLabel>SMTC 实现</FormLabel>
                        <RadioGroup
                            row
                            defaultValue={smtcImpl}
                            onChange={(_, v) => setSmtcImpl(v as any)}
                            name="smtcImpl"
                        >
                            <FormControlLabel
                                value="native"
                                control={<Radio />}
                                label="原生"
                            />
                            <FormControlLabel
                                value="frontend"
                                control={<Radio />}
                                label="前端（可覆盖掉 LibFrontendPlay 的 SMTC 信息）"
                            />
                        </RadioGroup>
                    </div>
                ) : (
                    <></>
                )}
            </FormGroup>
        </div>
    );
}

plugin.onConfig(() => {
    return configElement;
});
