export function createHookFn(
    fn: Function,
    prefixs?: Function | Function[],
    postfixs?: Function | Function[],
): { function: Function; origin: Function } {
    return {
        function: function (...args) {
            if (prefixs instanceof Function) prefixs = [prefixs];
            if (postfixs instanceof Function) postfixs = [postfixs];

            let prefixResult = {
                cancel: false,
                args: undefined,
            };

            let callArgs;

            for (const prefix of prefixs ?? []) {
                prefixResult = prefix(...args);
                if (prefixResult?.cancel) return;
                if (prefixResult?.args)
                    callArgs = callArgs ?? prefixResult?.args;
            }
            let result;
            result = fn.apply(this, callArgs ?? args);

            for (const postfix of postfixs ?? []) {
                result = postfix?.apply(result, args) ?? result;
            }

            return result;
        },
        origin: fn,
    };
}
