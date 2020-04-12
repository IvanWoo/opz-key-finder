export const button = (
    onclick: EventListener,
    body: string,
    args: any = {}
) => (_: any, disabled: boolean) => ["a", { ...args, onclick, disabled }, body];
