import {
    EV_SET_VALUE,
    EV_UPDATE_VALUE,
    EV_TOGGLE_VALUE,
    Event,
    FX_DELAY,
    FX_DISPATCH_ASYNC,
    FX_DISPATCH_NOW,
    valueUpdater,
} from "@thi.ng/interceptors";
import { take, choices } from "@thi.ng/transducers";
import { AppConfig } from "./api";
import { home } from "./components/home";
import * as fx from "./effects";
import * as ev from "./events";
import * as routes from "./routes";
import { defaultKeyState } from "./utils";

// main App configuration
export const CONFIG: AppConfig = {
    // router configuration
    // docs here:
    // https://github.com/thi-ng/umbrella/blob/master/packages/router/src/api.ts#L100
    router: {
        // use URI hash for routes (KISS)
        useFragment: true,
        // route ID if no other matches (MUST be non-parametric!)
        defaultRouteID: routes.HOME.id,
        // IMPORTANT: rules with common prefixes MUST be specified in
        // order of highest precision / longest path
        routes: [routes.HOME],
    },

    // event handlers events are queued and batch processed in app's RAF
    // render loop event handlers can be single functions, interceptor
    // objects with `pre`/`post` keys or arrays of either.

    // the event handlers' only task is to transform the event into a
    // number of side effects. event handlers should be pure functions
    // and only side effect functions execute any "real" work.

    // see EventBus docs here:
    // https://github.com/thi-ng/umbrella/blob/master/packages/atom/src/event-bus.ts#L14

    events: {
        // toggles debug state flag on/off
        [ev.TOGGLE_DEBUG]: valueUpdater<number>("debug", (x) => x ^ 1),

        // toggle single key
        [ev.TOGGLE_KEY_STATE]: [
            (_, [__, i]) => ({
                [FX_DISPATCH_NOW]: [EV_TOGGLE_VALUE, ["keyState", i]],
            }),
        ],

        // set all keys
        [ev.SET_KEY_STATE]: [
            (_, [__, keyState]) => ({
                [FX_DISPATCH_NOW]: [EV_SET_VALUE, ["keyState", keyState]],
            }),
        ],

        // reset all keys
        [ev.RESET_KEY_STATE]: [
            () => ({
                [FX_DISPATCH_NOW]: [ev.SET_KEY_STATE, defaultKeyState],
            }),
        ],

        // random keys
        [ev.SET_RANDOM_KEY_STATE]: [
            () => ({
                [FX_DISPATCH_NOW]: [
                    ev.SET_KEY_STATE,
                    [...take(12, choices([true, false], [0.5, 0.5]))],
                ],
            }),
        ],

        // set highlights
        [ev.SET_HIGHLIGHTS]: [
            (_, [__, highlights]) => ({
                [FX_DISPATCH_NOW]: [EV_SET_VALUE, ["highlights", highlights]],
            }),
        ],

        // reset highlights
        [ev.RESET_HIGHLIGHTS]: [
            () => ({
                [FX_DISPATCH_NOW]: [ev.SET_HIGHLIGHTS, []],
            }),
        ],

        // set size
        [ev.SET_SIZE]: [
            () => ({
                [FX_DISPATCH_NOW]: [
                    EV_SET_VALUE,
                    ["size", [window.innerWidth, window.innerHeight]],
                ],
            }),
        ],

        // toggle view config
        [ev.TOGGLE_VIEW_CONFIG]: [
            (_, [__, key]) => ({
                [FX_DISPATCH_NOW]: [EV_TOGGLE_VALUE, ["viewConfig", key]],
            }),
        ],

        // set midi devices
        [ev.SET_MIDI_DEVICES]: [
            (_, [__, devices]) => ({
                [FX_DISPATCH_NOW]: [
                    <Event>[EV_TOGGLE_VALUE, "enabledMidi"],
                    <Event>[EV_SET_VALUE, ["midiDevices", devices]],
                ],
            }),
        ],

        // set midi file
        [ev.SET_MIDI_FILE]: [
            (_, [__, file]) => ({
                [FX_DISPATCH_NOW]: [[EV_SET_VALUE, ["midiFile", file]]],
            }),
        ],

        // set midi file error
        [ev.SET_MIDI_FILE_ERROR]: [
            () => ({
                [FX_DISPATCH_NOW]: [ev.SET_MIDI_FILE, "INVALID MIDI FILE..."],
                [FX_DISPATCH_ASYNC]: [
                    FX_DELAY,
                    [500, "DROP MIDI/AUDIO FILE HERE..."],
                    ev.SET_MIDI_FILE,
                    ev.SET_MIDI_FILE,
                ],
            }),
        ],

        // set comparison
        [ev.SET_COMPARISON]: [
            (_, [__, comparison]) => ({
                [FX_DISPATCH_NOW]: [[EV_SET_VALUE, ["comparison", comparison]]],
            }),
        ],
    },

    // side effects
    effects: {},

    // mapping route IDs to their respective UI component functions
    // those functions are called automatically by the app's root component
    // base on the currently active route
    components: {
        [routes.HOME.id]: home,
    },

    // DOM root element (or ID)
    domRoot: "app",

    // initial app state
    initialState: {
        enabledMidi: false,
        midiDevices: [],
        midiFile: "DROP MIDI/AUDIO FILE HERE...",
        keyState: defaultKeyState,
        highlights: [],
        size: [window.innerWidth, window.innerHeight],
        viewConfig: { showMinor: true, showSmall: true },
        route: {},
        debug: 1,
    },

    views: {
        enabledMidi: "enabledMidi",
        midiDevices: "midiDevices",
        midiFile: "midiFile",
        keyState: "keyState",
        highlights: "highlights",
        size: "size",
        viewConfig: "viewConfig",
        json: ["", (state) => JSON.stringify(state, null, 2)],
        debug: "debug",
    },

    ui: {
        root: { class: "cf flex-ns sans-serif ma0" },
        toolbar: {
            button: { class: "mr3 pv2 ph2 bg-black white f4" },
        },
        code: {
            class: "ma0 ml4 pa2 f7 bg-light-gray code overflow-x-hidden",
        },
        column: {
            content: [{ class: "fl w-90-ns ma2" }, { class: "fl w-50-ns ma2" }],
            debug: [
                { class: "fl w-10-ns ma2 close" },
                { class: "fl w-50-ns ma2 open" },
            ],
        },
        debugToggle: { class: "toggle pointer" },
    },
};
