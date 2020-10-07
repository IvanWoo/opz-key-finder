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
        root: { class: "clearfix flex flex-row font-sans m-0" },
        midiDevicesStatus: {
            content: [
                { class: "gray-500 p-1 bg-red-200" },
                { class: "gray-500 p-1 bg-green-200" },
            ],
            dropdown: {
                root: {
                    class: "ml-2 rounded-full nm-flat-gray-200 p-2 font-thin",
                },
                selection: { class: "bg-transparent font-medium" },
            },
        },
        toolbar: {
            root: { class: "my-4" },
            button: {
                class:
                    "cursor-pointer mr-3 px-8 py-2 text-md font-medium nm-flat-gray-200 hover:nm-flat-gray-200-lg rounded-full uppercase transition duration-200 ease-in-out transform",
            },
        },
        toggleGroup: {
            root: { class: "" },
            key: {
                major: {
                    class:
                        "inline-block cursor-pointer nm-flat-gray-200 hover:nm-flat-gray-200-lg rounded-full",
                },
                e: {
                    class:
                        "inline-block cursor-pointer nm-flat-gray-200 hover:nm-flat-gray-200-lg rounded-full mr-8",
                },
                minor: {
                    class:
                        "inline-block cursor-pointer nm-flat-gray-200 hover:nm-flat-gray-200-lg rounded-full mb-8",
                },
            },
        },
        keyGroup: {
            root: { class: "inline-block" },
            block: { class: "my-2 mr-2" },
        },
        fileDropZone: {
            root: {
                class:
                    "mt-2 mb-8 border-dotted border-2 inline-block p-8 text-center nm-flat-gray-200-lg",
            },
        },
        code: {
            class:
                "m-0 ml-8 p-2 text-xs bg-gray-100 font-mono overflow-x-hidden",
        },
        column: {
            content: [
                { class: "float-left w-full m-4" },
                { class: "float-left w-5/6 m-4" },
            ],
            debug: [
                { class: "float-right m-4 close" },
                { class: "float-right m-4 open" },
            ],
        },
        debugToggle: { class: "toggle cursor-pointer tracking-wider" },
        viewConfigToggleGroup: {
            block: {
                class: "cursor-pointer my-2 flex justify-start items-center",
            },
            caption: { class: "ml-2" },
        },
    },
};
