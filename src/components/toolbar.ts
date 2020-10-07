import { AppContext } from "../api";
import { button } from "./button";
import { RESET_KEY_STATE, SET_RANDOM_KEY_STATE } from "../events";

export const toolbar = (ctx: AppContext) => {
    const ui = ctx.ui;
    const btClear = button(
        (e: Event) => {
            e.preventDefault();
            ctx.bus.dispatch([RESET_KEY_STATE]);
        },
        "Clear",
        ui.toolbar.button
    );
    const btRandom = button(
        (e: Event) => {
            e.preventDefault();
            ctx.bus.dispatch([SET_RANDOM_KEY_STATE]);
        },
        "Random",
        ui.toolbar.button
    );
    return () => ["div", ui.toolbar.root, [btClear], [btRandom]];
};
