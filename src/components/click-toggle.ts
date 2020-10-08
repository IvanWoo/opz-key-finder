export interface ToggleOpts {
    anim: number;
    pad: number;
    margin: number;
    hlOn: object;
    bgOn: object;
    bgOff: object;
    fgOn: object;
    fgOff: object;
    floor: number;
    glyph?: string;
}

export interface ToggleDotOpts extends ToggleOpts {
    r: number;
}

// TODO: better color palette
const DEFAULT_OPTS: ToggleOpts = {
    anim: 100,
    pad: 1,
    margin: 0,
    hlOn: { fill: "#E83015" },
    bgOn: { fill: "#CCCCCC" },
    bgOff: { fill: "#CCCCCC" },
    fgOn: { fill: "#E83015" },
    fgOff: { fill: "#fff" },
    floor: 1,
};

const blur = [
    "filter",
    { id: "blur" },
    ["feGaussianBlur", { in: "SourceGraphic", stdDeviation: ".25" }],
];

export const clickToggleDot = (opts: Partial<ToggleDotOpts> = {}) => {
    const _opts: ToggleDotOpts = {
        r: 5,
        ...DEFAULT_OPTS,
        ...opts,
    };
    const { r, pad, margin, glyph, floor } = _opts;
    const ratio = 0.5;
    const ir = r * ratio ** 2;
    const m2 = margin * 2;
    const br = r + pad;
    const cx = br + margin;
    const height = br * 2;
    const totalH = height + m2;
    const svgSize = { width: totalH, height: totalH * floor };
    const style = { transition: `all ${_opts.anim}ms ease-out` };
    const center = { cx, cy: cx };
    const filter = "url(#blur)";

    const hlOn: any = {
        ..._opts.hlOn,
        ...center,
        r: br,
    };
    const bgOn: any = {
        ..._opts.bgOn,
        ...center,
        style,
        r,
    };
    const bgOff = { ...bgOn, ..._opts.bgOff };
    const fgOn: any = {
        ..._opts.fgOn,
        ...center,
        style,
        r: ir,
    };
    const fgOff: any = { ...fgOn, ..._opts.fgOff };
    const glOn: any = {
        ..._opts.fgOn,
        x: "50%",
        y: "50%",
        "text-anchor": "middle",
        "alignment-baseline": "central",
        font: "bold font-sans",
        "font-size": totalH * ratio,
        style,
    };
    const glOff: any = { ...glOn, ..._opts.fgOff };
    return (_: any, attribs: any, state: boolean, highlight: boolean) => [
        "svg",
        { ...svgSize, ...attribs },
        blur,
        [
            "g",
            ["circle", highlight ? hlOn : {}],
            ["circle", state ? bgOn : bgOff],
            glyph
                ? ["text", state ? glOn : glOff, glyph]
                : ["circle", state ? fgOn : fgOff],
        ],
    ];
};
