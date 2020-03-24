export interface ToggleOpts {
    anim: number;
    pad: number;
    margin: number;
    bgOn: object;
    bgOff: object;
    fgOn: object;
    fgOff: object;
    glyph?: string;
}

export interface ToggleDotOpts extends ToggleOpts {
    r: number;
}

const DEFAULT_OPTS: ToggleOpts = {
    anim: 100,
    pad: 1,
    margin: 0,
    bgOn: { fill: "#000" },
    bgOff: { fill: "#999" },
    fgOn: { fill: "#E83015" },
    fgOff: { fill: "#fff" }
};

export const clickToggleDot = (opts: Partial<ToggleDotOpts> = {}) => {
    const _opts: ToggleDotOpts = {
        r: 5,
        ...DEFAULT_OPTS,
        ...opts
    };
    const { r, pad, margin, glyph } = _opts;
    const ratio = 0.5;
    const ir = r * ratio ** 2;
    const m2 = margin * 2;
    const br = r + pad;
    const cx = br + margin;
    const height = br * 2;
    const totalH = height + m2;
    const svgSize = { width: totalH, height: totalH };
    const style = { transition: `all ${_opts.anim}ms ease-out` };
    const center = { cx, cy: cx };

    const bgOn: any = {
        ..._opts.bgOn,
        ...center,
        style,
        r
    };
    const bgOff = { ...bgOn, ..._opts.bgOff };
    const fgOn: any = {
        ..._opts.fgOn,
        ...center,
        style,
        r: ir
    };
    const fgOff: any = { ...fgOn, ..._opts.fgOff };
    const glOn: any = {
        ..._opts.fgOn,
        x: "50%",
        y: "50%",
        "text-anchor": "middle",
        "alignment-baseline": "central",
        font: "bold sans-serif",
        "font-size": totalH * ratio,
        style
    };
    const glOff: any = { ...glOn, ..._opts.fgOff };
    return (_: any, attribs: any, state: boolean) => [
        "svg",
        { ...svgSize, ...attribs },
        [
            "g",
            ["circle", state ? bgOn : bgOff],
            glyph
                ? ["text", state ? glOn : glOff, glyph]
                : ["circle", state ? fgOn : fgOff]
        ]
    ];
};
