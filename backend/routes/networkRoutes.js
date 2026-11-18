
const express = require('express');
const router = express.Router();

const {
    createNetworkPlan,
    getNetworkPlans,
    deleteNetworkPlan
} = require('../controllers/networkController');

router.post('/create', createNetworkPlan);
router.get('/all', getNetworkPlans);
router.delete('/:id', deleteNetworkPlan);

module.exports = router;
