import { AppContext, Comparison } from "../api";
import { SET_HIGHLIGHTS, RESET_HIGHLIGHTS } from "../events";
import { getComparisons } from "../utils";

export const keyGroup = (ctx: AppContext) => {
    const views = ctx.views;
    const ui = ctx.ui;
    const size = views.size.deref()!;
    const width = Math.min(400 * 1.1, size[0] * 0.9);

    const viewConfig = views.viewConfig.deref()!;
    const comparisons = getComparisons(views.keyState.deref()!);
    const buffer = 0.1;
    const whRatio = 35;
    const bgOpts = {
        width: width,
        height: width / whRatio,
        rx: 5,
        fill: "#e2e2e2",
    };

    return [
        "div",
        ui.keyGroup.root,
        ...comparisons.map((x, i) => [
            "div",
            {
                ...ui.keyGroup.block,
                ...{
                    onmouseover: (e) => {
                        e.preventDefault();
                        ctx.bus.dispatch([SET_HIGHLIGHTS, x.normalizedMidis]);
                    },
                    onmouseleave: (e) => {
                        e.preventDefault();
                        ctx.bus.dispatch([RESET_HIGHLIGHTS]);
                    },
                },
            },
            [
                "div.flex",
                [
                    "div",
                    x.majorKey,
                    viewConfig.showSmall ? ["small", " maj"] : [],
                ],
                viewConfig.showMinor
                    ? [
                          "div",
                          ["span.red", " ・ "],
                          x.minorKey,
                          viewConfig.showSmall ? ["small", " min"] : [],
                      ]
                    : [],
            ],
            [
                "div",
                [
                    "svg",
                    { width: width * (1 + buffer), height: width / whRatio },
                    [
                        "g",
                        ["rect", bgOpts],
                        x.common.length > 0
                            ? [
                                  "rect",
                                  {
                                      ...bgOpts,
                                      width: (x.similarity - buffer) * width,
                                      fill: "#000",
                                  },
                              ]
                            : [],
                    ],
                ],
            ],
        ]),
    ];
};
