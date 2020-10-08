import { TOGGLE_DEBUG } from "../events";
import { eventLink } from "./event-link";
import type { AppContext } from "../api";

/**
 * Collapsible component showing stringified app state.
 *
 * @param ctx injected context object
 * @param debug
 * @param json
 */
export function debugContainer(ctx: AppContext, debug: any, json: string) {
    return [
        "div#debug",
        ctx.ui.column.debug[debug],
        [
            eventLink,
            [TOGGLE_DEBUG],
            ctx.ui.debugToggle,
            debug ? "close▼" : "open▲",
        ],
        ["pre", ctx.ui.code, json],
    ];
}
