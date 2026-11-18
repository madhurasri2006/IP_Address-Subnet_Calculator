
const mongoose = require('mongoose');

const networkPlanSchema = new mongoose.Schema({
    networkName: {
        type: String,
        required: true,
        trim: true
    },

    ipAddress: {
        type: String,
        required: true
    },

    subnetMask: {
        type: String,
        required: true
    },

    cidr: {
        type: Number,
        required: true,
        min: 0,
        max: 32
    },

    requiredHosts: {
        type: Number,
        required: true,
        min: 1
    },

    networkAddress: String,
    broadcastAddress: String,
    firstUsableHost: String,
    lastUsableHost: String,
    totalAddresses: Number,
    usableHosts: Number,

    validationStatus: {
        type: String,
        default: 'Valid'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('NetworkPlan', networkPlanSchema);
