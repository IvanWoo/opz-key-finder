import { AppContext } from "../api";
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
    floor: 2,
};

export const toggleGroup = (ctx: AppContext) => {
    const views = ctx.views;

    const size = views.size.deref()!;
    const toggleWidth = Math.min(18 * 2, (size[0] * 0.9) / 13);
    const opts = {
        r: (toggleWidth / 2) * (8 / 9),
        pad: (toggleWidth / 2) * (1 / 9),
    };
    const highlights = views.highlights.deref()!;
    return [
        "div.mb4",
        ...views.keyState.deref()!.map((x, i) => [
            i === 4 ? "div.dib.mr4" : "div.dib",
            [
                i === 0
                    ? clickToggleDot({ ...cDotOpts, ...opts })
                    : [2, 4, 5, 7, 9, 11].includes(i)
                    ? clickToggleDot({ ...wDotOpts, ...opts })
                    : clickToggleDot({ ...bDotOpts, ...opts }),
                {
                    class: "pointer mr0",
                    onclick: (e) => {
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