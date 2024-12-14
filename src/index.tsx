/**
 * @fileoverview
 * 此处的脚本将会在插件管理器加载插件期间被加载
 * 一般情况下只需要从这个入口点进行开发即可满足绝大部分需求
 */
import {
    MdAdd,
    MdDelete,
    MdDesktopWindows,
    MdError,
    MdSelectAll,
    MdSettings,
    MdWallpaper,
    MdWarning,
} from "react-icons/md";
import { useLocalStorage } from "./hooks";
import "./index.scss";
import { Alert, Card, Divider, FormControlLabel, FormGroup, FormLabel, Radio, RadioGroup, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { render } from "react-dom";
import * as React from "react";
import Button from "@mui/material/Button";
import { STORE_KEY_DCRPC_ENABLED, STORE_KEY_INFO_PROVIDER, STORE_KEY_SMTC_ENABLED } from "./keys";
import { DOMProvider } from "./SongInfoProviders/DOMProvider";
import { BaseProvider } from "./SongInfoProviders/BaseProvider";
import { NativeProvider } from "./SongInfoProviders/NativeProvider";


// receivers
import { SMTC } from "./Receivers/smtc";
import { DCRPC } from "./Receivers/dc-rpc";

let configElement = document.createElement("div");

plugin.onLoad((selfPlugin) => {
    render(<Main />, configElement);
});

function Main() {
    const nativePluginLoaded = React.useMemo(() => {
        try {
            return (
                betterncm_native.native_plugin.call("inflink.test", []) ===
                "true"
            );
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
                        InfLink将无法使用，请确定您使用的是 1.0.0-pre2
                        及以上版本的 BetterNCM。
                        若不是 请通过 BetterNCM Installer 更新。
                    </Typography>
                </Alert>
            </div>
        );
    }

    const [SMTCEnabled, setSMTCEnabled] = useLocalStorage(
        STORE_KEY_SMTC_ENABLED,
        true,
    );

    const [DCRPCEnabled, setDCRPCEnabled] = useLocalStorage(
        STORE_KEY_DCRPC_ENABLED,
        false,
    )


    const [infoProviderName, setInfoProviderName] = useLocalStorage(
        STORE_KEY_INFO_PROVIDER,
        "dom",
    );

    const [InfoProvider, setInfoProvider] = React.useState<BaseProvider | null>(
        null,
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
            if (SMTCEnabled)
                SMTC.update(e.detail);

            if (DCRPCEnabled)
                DCRPC.update(e.detail);
        }

        function onUpdatePlayState(e) {
            const state = e.detail === "Playing" ? 3 : 4;

            if (SMTCEnabled)
                SMTC.updatePlayState(state);
        }

        async function onUpdateTimeline(e) {
            if (SMTCEnabled)
                SMTC.updateTimeline(e.detail);
        }

        InfoProvider?.addEventListener(
            "updatePlayState",
            onUpdatePlayState,
        );

        InfoProvider?.addEventListener("updateSongInfo", onUpdateSongInfo);

        InfoProvider?.addEventListener("updateTimeline", onUpdateTimeline);
    }, [InfoProvider]);

    React.useEffect(() => {
        if (SMTCEnabled) {
            SMTC.apply(msg => {
                InfoProvider?.dispatchEvent(
                    new CustomEvent(msg),
                );
            })
        } else {
            SMTC.disable();
        }
    }, [InfoProvider, SMTCEnabled]);

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
                    <FormControlLabel value="native" control={<Radio />} label="原生 (3.0.0 不可用)" />
                </RadioGroup>

                <div>
                    <FormControlLabel control={<Switch
                        checked={SMTCEnabled}
                        onChange={(e, checked) => setSMTCEnabled(checked)}
                    />} label="开启 SMTC" />

                    <FormControlLabel control={<Switch
                        checked={DCRPCEnabled}
                        onChange={(e, checked) => setDCRPCEnabled(checked)}
                    />} label="开启 Discord RPC" />
                </div>
            </FormGroup>
        </div>
    );
}

plugin.onConfig(() => {
    return configElement;
});
