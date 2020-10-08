import { title } from "@thi.ng/hdom-components";
import { midiDevicesStatus } from "./midi-devices-status";
import { toolbar } from "./toolbar";
import { toggleGroup } from "./toggle-group";
import { keyGroup } from "./key-group";
import { fileDropZone } from "./file-drop-zone";
import { viewConfigToggleGroup } from "./view-config-toggle-group";
import type { AppContext } from "../api";

const h2 = title({
    element: "h2",
    attribs: { class: "text-2xl font-extrabold mb-4" },
});

export const home = (ctx: AppContext) => {
    return () => [
        "div",
        [h2, "OP-Z KEY FINDER"],
        ["div.pb-4", midiDevicesStatus],
        ["div.pb-4", toolbar],
        ["div.mb-4", [toggleGroup], [keyGroup]],
        [fileDropZone],
        [
            "div.block",
            ["details", ["summary", "View Config"], [viewConfigToggleGroup]],
        ],
    ];
};
