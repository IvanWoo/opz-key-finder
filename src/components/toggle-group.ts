import type { AppContext } from "../api";
import { clickToggleDot, ToggleDotOpts } from "./click-toggle";
import { TOGGLE_KEY_STATE } from "../events";

const wDotOpts: Partial<ToggleDotOpts> = {
    anim: 0,
    r: 16,
    pad: 2,
    // margin: 2
};

const cDotOpts: Partial<ToggleDotOpts> = {
    ...wDotOpts,
    glyph: "C",
};

const bDotOpts: Partial<ToggleDotOpts> = {
    ...wDotOpts,
    bgOn: { fill: "#000" },
    bgOff: { fill: "#000" },
    // floor: 2,
};

const getClass = (i: number, ui: any) => {
    if ([1, 3, 6, 8, 10].includes(i)) {
        return ui.minor;
    } else if (i === 4) {
        return ui.e;
    } else {
        return ui.major;
    }
};

export const toggleGroup = (ctx: AppContext) => {
    const views = ctx.views;
    const ui = ctx.ui;

    const size = views.size.deref()!;
    const toggleWidth = Math.min(18 * 2, (size[0] * 0.9) / 13);
    const opts = {
        r: (toggleWidth / 2) * (8 / 9),
        pad: (toggleWidth / 2) * (1 / 9),
    };
    const highlights = views.highlights.deref()!;
    return [
        "div.mb-4",
        ...views.keyState.deref()!.map((x, i) => [
            "div",
            getClass(i, ui.toggleGroup.key),
            [
                i === 0
                    ? clickToggleDot({ ...cDotOpts, ...opts })
                    : [2, 4, 5, 7, 9, 11].includes(i)
                    ? clickToggleDot({ ...wDotOpts, ...opts })
                    : clickToggleDot({ ...bDotOpts, ...opts }),
                {
                    onclick: e => {
                        e.preventDefault();
                        ctx.bus.dispatch([TOGGLE_KEY_STATE, i]);
                    },
                },
                x,
                highlights.includes(i),
            ],
            // ["div.tc", i],
        ]),
    ];
};
