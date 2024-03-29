import type { AppContext } from "../api";
import { slideToggleRect, ToggleRectOpts } from "@thi.ng/hdom-components";
import { TOGGLE_VIEW_CONFIG } from "../events";

const rectOpts: Partial<ToggleRectOpts> = {
    w: 16,
    h: 8,
    pad: 2,
    margin: 0,
};

const toggleSq = slideToggleRect({ ...rectOpts, vertical: false });

export const viewConfigToggleGroup = (ctx: AppContext) => {
    const views = ctx.views;
    const ui = ctx.ui.viewConfigToggleGroup;
    const config = views.viewConfig.deref()!;
    return [
        "div",
        Object.entries(config).map(([k, v]) => [
            "div",
            ui.block,
            [
                toggleSq,
                {
                    onclick: () => ctx.bus.dispatch([TOGGLE_VIEW_CONFIG, k]),
                },
                v,
            ],
            ["span", ui.caption, k],
        ]),
    ];
};
