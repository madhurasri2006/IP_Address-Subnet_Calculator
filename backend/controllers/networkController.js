
const NetworkPlan = require('../models/NetworkPlan');

const {
    calculateNetwork,
    ipToNumber
} = require('../services/networkService');

const {
    validateNetworkInput
} = require('../services/flatService');

// Check whether a subnet overlaps an existing plan
async function checkOverlap(network) {
    const plans = await NetworkPlan.find();

    const newStart = ipToNumber(network.networkAddress);
    const newEnd = ipToNumber(network.broadcastAddress);

    return plans.find(plan => {
        const oldStart = ipToNumber(plan.networkAddress);
        const oldEnd = ipToNumber(plan.broadcastAddress);

        return newStart <= oldEnd && newEnd >= oldStart;
    });
}

// Create planning transition trace
function createPlanningTrace(overlap) {
    const trace = [
        {
            state: 'qStart',
            condition: 'Network planning started',
            status: 'passed'
        },
        {
            state: 'qIPv4Accepted',
            condition: 'IPv4 address validation passed',
            status: 'passed'
        },
        {
            state: 'qSubnetCalculated',
            condition: 'Subnet details calculated',
            status: 'passed'
        },
        {
            state: 'qOverlapCheck',
            condition: 'Checking against existing network plans',
            status: 'passed'
        }
    ];

    if (overlap) {
        trace.push({
            state: 'qRejectOverlap',
            condition: `Subnet overlaps with ${overlap.networkName}`,
            status: 'rejected'
        });
    } else {
        trace.push({
            state: 'qAcceptPlan',
            condition: 'No subnet overlap detected. Network plan accepted',
            status: 'accepted'
        });
    }

    return trace;
}

// Create a network plan
const createNetworkPlan = async (req, res) => {
    try {
        const {
            networkName,
            ipAddress,
            subnetMask,
            cidr,
            requiredHosts
        } = req.body;

        if (!networkName || !ipAddress) {
            return res.status(400).json({
                message: 'Enter network name and IP address'
            });
        }

        // FLAT validation
        const flatResult = validateNetworkInput(ipAddress);

        if (!flatResult.valid) {
            return res.status(400).json({
                message: 'IPv4 validation failed',
                flatResult
            });
        }

        // CN calculation
        const network = calculateNetwork({
            ipAddress,
            subnetMask,
            cidr: cidr === undefined ? undefined : Number(cidr),
            requiredHosts: Number(requiredHosts)
        });

        // Check overlapping configurations
        const overlap = await checkOverlap(network);

        const planningTrace = createPlanningTrace(overlap);

        if (overlap) {
            return res.status(409).json({
                message: `Subnet overlaps with ${overlap.networkName}`,
                flatResult,
                planningTrace,
                planningStatus: 'Rejected',

                overlapDetails: {
                    reason: 'The new subnet overlaps with an existing saved network.',
                    existingNetwork: {
                        networkName: overlap.networkName,
                        networkAddress: overlap.networkAddress,
                        broadcastAddress: overlap.broadcastAddress,
                        cidr: overlap.cidr
                    },
                    newNetwork: {
                        networkName,
                        networkAddress: network.networkAddress,
                        broadcastAddress: network.broadcastAddress,
                        cidr: network.cidr
                    }
                }
            });
        }

        // Save in MongoDB
        const plan = await NetworkPlan.create({
            networkName,
            ...network,
            validationStatus: 'Valid'
        });

        return res.status(201).json({
            message: 'Network plan created successfully',
            flatResult,
            planningTrace,
            planningStatus: 'Accepted',
            overlapDetails: null,
            plan
        });

    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
};

// Get all saved network plans
const getNetworkPlans = async (req, res) => {
    try {
        const plans = await NetworkPlan.find().sort({
            createdAt: -1
        });

        res.json(plans);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Delete a network plan
const deleteNetworkPlan = async (req, res) => {
    try {
        const plan = await NetworkPlan.findByIdAndDelete(req.params.id);

        if (!plan) {
            return res.status(404).json({
                message: 'Network plan not found'
            });
        }

        res.json({
            message: 'Network plan deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createNetworkPlan,
    getNetworkPlans,
    deleteNetworkPlan
};
