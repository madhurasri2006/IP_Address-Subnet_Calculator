
function isValidIPv4(ip) {
    const parts = ip.split('.');

    return (
        parts.length === 4 &&
        parts.every(part =>
            /^\d{1,3}$/.test(part) &&
            Number(part) >= 0 &&
            Number(part) <= 255
        )
    );
}

function cidrToMask(cidr) {
    const mask = cidr === 0
        ? 0
        : (0xFFFFFFFF << (32 - cidr)) >>> 0;

    return [
        (mask >>> 24) & 255,
        (mask >>> 16) & 255,
        (mask >>> 8) & 255,
        mask & 255
    ].join('.');
}

function maskToCidr(mask) {
    if (!isValidIPv4(mask)) {
        throw new Error('Invalid subnet mask');
    }

    const binary = mask.split('.')
        .map(part => Number(part).toString(2).padStart(8, '0'))
        .join('');

    if (!/^1*0*$/.test(binary)) {
        throw new Error('Subnet mask must be continuous');
    }

    return binary.split('1').length - 1;
}

function ipToNumber(ip) {
    return ip.split('.').reduce(
        (result, part) => result * 256 + Number(part),
        0
    );
}

function numberToIP(number) {
    return [
        (number >>> 24) & 255,
        (number >>> 16) & 255,
        (number >>> 8) & 255,
        number & 255
    ].join('.');
}

function calculateNetwork({
    ipAddress,
    subnetMask,
    cidr,
    requiredHosts
}) {
    if (!ipAddress || !isValidIPv4(ipAddress)) {
        throw new Error('Enter a valid IPv4 address');
    }

    if (!Number.isInteger(requiredHosts) || requiredHosts < 1) {
        throw new Error('Enter a valid required host count');
    }

    let prefix;

    if (subnetMask) {
        prefix = maskToCidr(subnetMask);
    } else if (Number.isInteger(cidr) && cidr >= 0 && cidr <= 32) {
        prefix = cidr;
        subnetMask = cidrToMask(prefix);
    } else {
        throw new Error('Enter a valid subnet mask or CIDR');
    }

    if (cidr !== undefined && cidr !== null && cidr !== prefix) {
        throw new Error('Subnet mask and CIDR do not match');
    }

    const totalAddresses = Math.pow(2, 32 - prefix);

    const maskNumber = prefix === 0
        ? 0
        : (0xFFFFFFFF << (32 - prefix)) >>> 0;

    const ipNumber = ipToNumber(ipAddress);
    const networkNumber = (ipNumber & maskNumber) >>> 0;
    const broadcastNumber = networkNumber + totalAddresses - 1;

    let usableHosts;
    let firstHost;
    let lastHost;

    if (prefix <= 30) {
        usableHosts = totalAddresses - 2;
        firstHost = networkNumber + 1;
        lastHost = broadcastNumber - 1;
    } else if (prefix === 31) {
        usableHosts = 2;
        firstHost = networkNumber;
        lastHost = broadcastNumber;
    } else {
        usableHosts = 1;
        firstHost = networkNumber;
        lastHost = networkNumber;
    }

    if (requiredHosts > usableHosts) {
        throw new Error(
            `This subnet supports only ${usableHosts} usable hosts`
        );
    }

    return {
        ipAddress,
        subnetMask,
        cidr: prefix,
        requiredHosts,
        networkAddress: numberToIP(networkNumber),
        broadcastAddress: numberToIP(broadcastNumber),
        firstUsableHost: numberToIP(firstHost),
        lastUsableHost: numberToIP(lastHost),
        totalAddresses,
        usableHosts
    };
}

module.exports = {
    isValidIPv4,
    cidrToMask,
    maskToCidr,
    calculateNetwork,
    ipToNumber
};
