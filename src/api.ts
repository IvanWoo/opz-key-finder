import { EffectDef, EventBus, EventDef } from "@thi.ng/interceptors";
import type { Fn, IObjectOf, Path } from "@thi.ng/api";
import type { IView } from "@thi.ng/atom";
import type { HTMLRouterConfig, RouteMatch } from "@thi.ng/router";
import type { MajorKey } from "@tonaljs/key";

// general types defined for the base app

/**
 * Function signature for main app components.
 * I.e. components representing different app states linked to router.
 */
export type AppComponent = (ctx: AppContext, ...args: any[]) => any;

/**
 * Derived view configurations.
 */
export type ViewSpec = string | Path | [string | Path, Fn<any, any>];

/**
 * Structure of the overall application config object.
 * See `src/config.ts`.
 */
export interface AppConfig {
    components: IObjectOf<AppComponent>;
    domRoot: string | Element;
    effects: IObjectOf<EffectDef>;
    events: IObjectOf<EventDef>;
    initialState: any;
    router: HTMLRouterConfig;
    ui: UIAttribs;
    views: Partial<Record<keyof AppViews, ViewSpec>>;
}

/**
 * Derived views exposed by the app.
 * Add more declarations here as needed.
 */
export interface AppViews extends Record<keyof AppViews, IView<any>> {
    route: IView<RouteMatch>;
    routeComponent: IView<any>;
    debug: IView<number>;
    json: IView<string>;
    enabledMidi: IView<boolean>;
    midiDevices: IView<string[]>;
    midiFile: IView<string>;
    keyState: IView<boolean[]>;
    highlights: IView<Midis>;
    size: IView<[number, number]>;
    viewConfig: IView<any>;
}

export interface AppContext {
    bus: EventBus;
    views: AppViews;
    ui: UIAttribs;
}

/**
 * Helper interface to pre-declare all possible keys for UI attributes
 * and so enable autocomplete & type safety.
 *
 * See `AppConfig` above and its use in `src/config.ts` and various
 * component functions.
 */
export interface UIAttribs {
    root: any;
    toolbar: any;
    debugToggle: any;
    code: any;
    column: any;
}

// app related types
export type Midis = number[];

export interface State {
    enabledMidi: boolean;
    midiDevices: string[];
    midiFile: string;
    keyState: boolean[];
    highlights: Midis;
    size: [number, number];
    viewConfig: any;
}
export interface Scale {
    raw?: MajorKey;
    tonicMidi: number;
    majorKey: string;
    minorKey: string;
    normalizedMidis: Midis;
}

export interface Comparison {
    majorKey: string;
    minorKey: string;
    normalizedMidis: Midis;
    common: Midis;
    similarity: number;
}
