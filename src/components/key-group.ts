import type { AppContext, Comparison } from "../api";
import { SET_HIGHLIGHTS, RESET_HIGHLIGHTS } from "../events";
import { getComparisons } from "../utils";

const caption = (ctx: AppContext, comparison: Comparison) => {
    const views = ctx.views;
    const viewConfig = views.viewConfig.deref();

    return [
        "div.flex",
        [
            "div",
            comparison.majorKey,
            viewConfig.showSmall ? ["small", " maj"] : [],
        ],
        viewConfig.showMinor
            ? [
                  "div",
                  ["span.text-red-600", " ・ "],
                  comparison.minorKey,
                  viewConfig.showSmall ? ["small", " min"] : [],
              ]
            : [],
    ];
};

const bar = (ctx: AppContext, comparison: Comparison) => {
    const views = ctx.views;
    const size = views.size.deref()!;
    const width = Math.min(400 * 1.1, size[0] * 0.9);

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
        [
            "svg",
            { width: width * (1 + buffer), height: width / whRatio },
            [
                "g",
                ["rect", bgOpts],
                comparison.common.length > 0
                    ? [
                          "rect",
                          {
                              ...bgOpts,
                              width: (comparison.similarity - buffer) * width,
                              fill: "#000",
                          },
                      ]
                    : [],
            ],
        ],
    ];
};

export const keyGroup = (ctx: AppContext) => {
    const views = ctx.views;
    const ui = ctx.ui;

    const comparisons = getComparisons(views.keyState.deref()!);

    return [
        "div",
        ui.keyGroup.root,
        ...comparisons.map((comparison, _) => [
            "div",
            {
                ...ui.keyGroup.block,
                ...{
                    onmouseover: e => {
                        e.preventDefault();
                        ctx.bus.dispatch([
                            SET_HIGHLIGHTS,
                            comparison.normalizedMidis,
                        ]);
                    },
                    onmouseleave: e => {
                        e.preventDefault();
                        ctx.bus.dispatch([RESET_HIGHLIGHTS]);
                    },
                },
            },
            [caption, comparison],
            [bar, comparison],
        ]),
    ];
};
