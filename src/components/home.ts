import { title } from "@thi.ng/hdom-components";
import { midiDevicesStatus } from "./midi-devices-status";
import { toolbar } from "./toolbar";
import { toggleGroup } from "./toggle-group";
import { keyGroup } from "./key-group";
import { fileDropZone } from "./file-drop-zone";
import { viewConfigToggleGroup } from "./view-config-toggle-group";
import type { AppContext } from "../api";

const h2 = title({ element: "h2", attribs: { class: "#000" } });

export const home = (ctx: AppContext) => {
    return () => [
        "div",
        [h2, "OP-Z KEY FINDER"],
        [midiDevicesStatus, ctx],
        [toolbar, ctx],
        ["div.mb2", [toggleGroup, ctx], [keyGroup, ctx]],
        [fileDropZone, ctx],
        [
            "div.db",
            [
                "details",
                ["summary", "View Config"],
                [viewConfigToggleGroup, ctx],
            ],
        ],
    ];
};
