
function validateWithRegex(ip) {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
}

function validateWithCFG(ip) {
    const parts = ip.split('.');

    if (parts.length !== 4) {
        return false;
    }

    return parts.every(part => {
        return (
            /^(0|[1-9]\d{0,2})$/.test(part) &&
            Number(part) <= 255
        );
    });
}

function validateWithDFA(ip) {
    const states = [];
    let state = 'q0';

    states.push(state);

    const parts = ip.split('.');

    if (parts.length !== 4) {
        return {
            valid: false,
            states: [...states, 'qReject']
        };
    }

    for (let i = 0; i < parts.length; i++) {
        state = `q${i + 1}`;
        states.push(state);

        if (
            !/^\d{1,3}$/.test(parts[i]) ||
            Number(parts[i]) > 255
        ) {
            return {
                valid: false,
                states: [...states, 'qReject']
            };
        }

        if (i < 3) {
            state = `q${i + 1}_dot`;
            states.push(state);
        }
    }

    return {
        valid: true,
        states: [...states, 'qAccept']
    };
}

function validateNetworkInput(ip) {
    const regexValid = validateWithRegex(ip);
    const cfgValid = validateWithCFG(ip);
    const dfaResult = validateWithDFA(ip);

    return {
        regex: regexValid,
        cfg: cfgValid,
        dfa: dfaResult,
        valid: regexValid && cfgValid && dfaResult.valid
    };
}

module.exports = {
    validateNetworkInput,
    validateWithRegex,
    validateWithCFG,
    validateWithDFA
};
