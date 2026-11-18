
import { useEffect, useState } from 'react';
import API from './services/api';
import './App.css';

function App() {
    const [activeSection, setActiveSection] = useState('Dashboard');

    const [form, setForm] = useState({
        networkName: '',
        ipAddress: '',
        subnetMask: '255.255.255.0',
        cidr: '24',
        requiredHosts: ''
    });

    const [plans, setPlans] = useState([]);
    const [result, setResult] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const menuItems = [
        { name: 'Dashboard', icon: '▦' },
        { name: 'Network Configuration', icon: '⚙' },
        { name: 'FLAT Validation Results', icon: '⇄' },
        { name: 'Saved Network Plans', icon: '▤' },
        { name: 'Planning Summary', icon: '▥' }
    ];

    const loadPlans = async () => {
        try {
            const response = await API.get('/network-plans/all');
            setPlans(response.data);
        } catch (err) {
            setError('Unable to load network plans');
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setMessage('');
        setError('');
        setResult(null);

        try {
            const response = await API.post(
                '/network-plans/create',
                {
                    ...form,
                    cidr: Number(form.cidr),
                    requiredHosts: Number(form.requiredHosts)
                }
            );

            setResult(response.data);
            setMessage(response.data.message);

            setForm({
                networkName: '',
                ipAddress: '',
                subnetMask: '255.255.255.0',
                cidr: '24',
                requiredHosts: ''
            });

            await loadPlans();

            setActiveSection('FLAT Validation Results');

        } catch (err) {
            const data = err.response?.data;

            setError(
                data?.message ||
                'Unable to process network configuration'
            );

            if (data) {
                setResult(data);
                setActiveSection(
                    data.flatResult
                        ? 'FLAT Validation Results'
                        : 'Network Configuration'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await API.delete(`/network-plans/${id}`);

            setMessage('Network plan deleted successfully');
            setError('');

            await loadPlans();

        } catch (err) {
            setError('Unable to delete network plan');
        }
    };

    const totalHosts = plans.reduce(
        (total, plan) => total + (plan.usableHosts || 0),
        0
    );

    const totalRequiredHosts = plans.reduce(
        (total, plan) => total + (plan.requiredHosts || 0),
        0
    );

    const renderDashboard = () => (
        <>
            <div className="welcome-banner">
                <div>
                    <span className="eyebrow">NETWORK MANAGEMENT</span>
                    <h2>Welcome to Network Planner</h2>
                    <p>
                        Manage, validate and organize your network
                        configurations in one place.
                    </p>
                </div>

                <div className="banner-icon">⌘</div>
            </div>

            <div className="summary-grid">

                <div className="summary-card purple-card">
                    <div className="summary-icon">▤</div>
                    <div>
                        <p>Total Network Plans</p>
                        <h2>{plans.length}</h2>
                        <span>Saved configurations</span>
                    </div>
                </div>

                <div className="summary-card lavender-card">
                    <div className="summary-icon">◎</div>
                    <div>
                        <p>Total Usable Hosts</p>
                        <h2>{totalHosts.toLocaleString()}</h2>
                        <span>Across saved networks</span>
                    </div>
                </div>

                <div className="summary-card pink-card">
                    <div className="summary-icon">⌗</div>
                    <div>
                        <p>Required Hosts</p>
                        <h2>{totalRequiredHosts.toLocaleString()}</h2>
                        <span>Across saved networks</span>
                    </div>
                </div>

            </div>

            <div className="content-card">
                <div className="section-heading">
                    <div>
                        <h2>Quick Actions</h2>
                        <p>Choose what you want to work on.</p>
                    </div>
                </div>

                <div className="quick-actions">

                    <button
                        className="action-card"
                        onClick={() =>
                            setActiveSection('Network Configuration')
                        }
                    >
                        <span className="action-icon">⚙</span>
                        <strong>New Network</strong>
                        <small>Create and validate a network</small>
                        <span className="action-arrow">→</span>
                    </button>

                    <button
                        className="action-card"
                        onClick={() =>
                            setActiveSection('FLAT Validation Results')
                        }
                    >
                        <span className="action-icon">⇄</span>
                        <strong>Validation Results</strong>
                        <small>View formal validation results</small>
                        <span className="action-arrow">→</span>
                    </button>

                    <button
                        className="action-card"
                        onClick={() =>
                            setActiveSection('Saved Network Plans')
                        }
                    >
                        <span className="action-icon">▤</span>
                        <strong>Saved Plans</strong>
                        <small>Manage existing configurations</small>
                        <span className="action-arrow">→</span>
                    </button>

                </div>
            </div>

            <div className="content-card">
                <div className="section-heading">
                    <div>
                        <h2>Recent Network Plans</h2>
                        <p>Your latest saved configurations.</p>
                    </div>

                    <button
                        className="text-button"
                        onClick={() =>
                            setActiveSection('Saved Network Plans')
                        }
                    >
                        View All →
                    </button>
                </div>

                {plans.length === 0 ? (
                    <div className="empty-state">
                        <span>▤</span>
                        <p>No network plans created yet.</p>
                    </div>
                ) : (
                    <div className="plan-list">
                        {plans.slice(0, 3).map((plan) => (
                            <div className="plan-row" key={plan._id}>
                                <div>
                                    <strong>{plan.networkName}</strong>
                                    <p>
                                        {plan.networkAddress}/{plan.cidr}
                                    </p>
                                </div>

                                <span className="status-badge">
                                    Saved
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );

    const renderConfiguration = () => (
        <div className="content-card">
            <div className="section-heading">
                <div>
                    <span className="eyebrow">NETWORK MANAGEMENT</span>
                    <h2>Network Configuration</h2>
                    <p>
                        Enter network details to validate and calculate
                        subnet information.
                    </p>
                </div>
            </div>

            <form className="network-form" onSubmit={handleSubmit}>

                <div className="form-grid">

                    <div className="form-group">
                        <label>Network Name</label>
                        <input
                            name="networkName"
                            value={form.networkName}
                            onChange={handleChange}
                            placeholder="Example: Office Network"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>IPv4 Address</label>
                        <input
                            name="ipAddress"
                            value={form.ipAddress}
                            onChange={handleChange}
                            placeholder="192.168.1.0"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Subnet Mask</label>
                        <input
                            name="subnetMask"
                            value={form.subnetMask}
                            onChange={handleChange}
                            placeholder="255.255.255.0"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>CIDR Prefix</label>
                        <input
                            type="number"
                            name="cidr"
                            min="0"
                            max="32"
                            value={form.cidr}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Required Hosts</label>
                        <input
                            type="number"
                            name="requiredHosts"
                            min="1"
                            value={form.requiredHosts}
                            onChange={handleChange}
                            placeholder="Example: 100"
                            required
                        />
                    </div>

                </div>

                <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                >
                    {loading
                        ? 'Processing...'
                        : 'Validate and Create Network Plan'}
                </button>

            </form>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
        </div>
    );

    const renderValidation = () => (
        <>
            {result?.flatResult ? (
                <div className="content-card">
                    <div className="section-heading">
                        <div>
                            <span className="eyebrow">FORMAL LANGUAGE THEORY</span>
                            <h2>FLAT Validation Results</h2>
                            <p>
                                IPv4 validation using Regex, CFG and DFA.
                            </p>
                        </div>
                    </div>

                    <div className="validation-grid">

                        <div className="validation-card">
                            <span>Regex</span>
                            <strong className={
                                result.flatResult.regex
                                    ? 'accepted'
                                    : 'rejected'
                            }>
                                {result.flatResult.regex
                                    ? 'Accepted'
                                    : 'Rejected'}
                            </strong>
                        </div>

                        <div className="validation-card">
                            <span>CFG</span>
                            <strong className={
                                result.flatResult.cfg
                                    ? 'accepted'
                                    : 'rejected'
                            }>
                                {result.flatResult.cfg
                                    ? 'Accepted'
                                    : 'Rejected'}
                            </strong>
                        </div>

                        <div className="validation-card">
                            <span>DFA</span>
                            <strong className={
                                result.flatResult.dfa.valid
                                    ? 'accepted'
                                    : 'rejected'
                            }>
                                {result.flatResult.dfa.valid
                                    ? 'Accepted'
                                    : 'Rejected'}
                            </strong>
                        </div>

                    </div>

                    <h3 className="subheading">DFA State Transitions</h3>

                    <p className="helper-text">
                        These states show the current IPv4 validation trace.
                        This is separate from subnet-overlap checking.
                    </p>

                   <div className="state-flow">
    {result.flatResult.dfa.states.map(
        (state, index) => (
            <div
                className={`state-item ${
                    state === 'qAccept'
                        ? 'accepted-state'
                        : state === 'qReject'
                            ? 'rejected-state'
                            : ''
                }`}
                key={index}
            >
                <span>{state}</span>

                {index !==
                    result.flatResult.dfa.states.length - 1
                    && <b>→</b>}
            </div>
        )
    )}
</div>
                </div>
            ) : (
                <div className="content-card empty-state">
                    <span>⇄</span>
                    <h2>No Validation Results Yet</h2>
                    <p>
                        Create a network configuration to view its
                        formal validation results.
                    </p>
                    <button
                        className="primary-button"
                        onClick={() =>
                            setActiveSection('Network Configuration')
                        }
                    >
                        Create Network
                    </button>
                </div>
            )}

            {result?.planningTrace && (
                <div className="content-card">
                    <div className="section-heading">
                        <div>
                            <span className="eyebrow">NETWORK CHECK</span>
                            <h2>Planning State Transitions</h2>
                            <p>
                                Trace of the network planning process.
                            </p>
                        </div>

                        <span className={
                            result.planningStatus === 'Accepted'
                                ? 'status-badge accepted'
                                : 'status-badge rejected'
                        }>
                            {result.planningStatus}
                        </span>
                    </div>

                    <div className="planning-timeline">
                        {result.planningTrace.map((step, index) => (
                            <div
                                className={`timeline-step ${step.status}`}
                                key={index}
                            >
                                <div className="timeline-number">
                                    {index + 1}
                                </div>

                                <div className="timeline-content">
                                    <strong>{step.state}</strong>
                                    <p>{step.condition}</p>
                                    <span>{step.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

{result?.overlapDetails && (
    <div className="content-card overlap-details-card">
        <div className="section-heading">
            <div>
                <span className="eyebrow">SUBNET CONFLICT</span>
                <h2>Network Overlap Details</h2>
                <p>
                    The new network cannot be saved because
                    it overlaps with an existing network.
                </p>
            </div>

            <span className="status-badge rejected">
                Rejected
            </span>
        </div>

        <div className="overlap-reason">
            <strong>Rejection Reason</strong>
            <p>{result.overlapDetails.reason}</p>
        </div>

        <div className="details-grid">
            <div>
                <h3>Existing Network</h3>
                <p>
                    Network Name:
                    <strong>
                        {result.overlapDetails.existingNetwork.networkName}
                    </strong>
                </p>
                <p>
                    Network Address:
                    <strong>
                        {result.overlapDetails.existingNetwork.networkAddress}
                    </strong>
                </p>
                <p>
                    Broadcast Address:
                    <strong>
                        {result.overlapDetails.existingNetwork.broadcastAddress}
                    </strong>
                </p>
                <p>
                    CIDR:
                    <strong>
                        /{result.overlapDetails.existingNetwork.cidr}
                    </strong>
                </p>
            </div>

            <div>
                <h3>New Network</h3>
                <p>
                    Network Name:
                    <strong>
                        {result.overlapDetails.newNetwork.networkName}
                    </strong>
                </p>
                <p>
                    Network Address:
                    <strong>
                        {result.overlapDetails.newNetwork.networkAddress}
                    </strong>
                </p>
                <p>
                    Broadcast Address:
                    <strong>
                        {result.overlapDetails.newNetwork.broadcastAddress}
                    </strong>
                </p>
                <p>
                    CIDR:
                    <strong>
                        /{result.overlapDetails.newNetwork.cidr}
                    </strong>
                </p>
            </div>
        </div>
    </div>
)}

            {result?.plan && (
                <div className="content-card">
                    <h2>CN Network Calculation Results</h2>

                    <div className="details-grid">
                        <p>Network Address: <strong>{result.plan.networkAddress}</strong></p>
                        <p>Subnet Mask: <strong>{result.plan.subnetMask}</strong></p>
                        <p>CIDR: <strong>/{result.plan.cidr}</strong></p>
                        <p>Broadcast Address: <strong>{result.plan.broadcastAddress}</strong></p>
                        <p>First Usable Host: <strong>{result.plan.firstUsableHost}</strong></p>
                        <p>Last Usable Host: <strong>{result.plan.lastUsableHost}</strong></p>
                        <p>Total Addresses: <strong>{result.plan.totalAddresses}</strong></p>
                        <p>Usable Hosts: <strong>{result.plan.usableHosts}</strong></p>
                    </div>
                </div>
            )}
        </>
    );

    const renderSavedPlans = () => (
        <div className="content-card">
            <div className="section-heading">
                <div>
                    <span className="eyebrow">DATABASE RECORDS</span>
                    <h2>Saved Network Plans</h2>
                    <p>All network configurations stored in MongoDB.</p>
                </div>

                <span className="count-badge">{plans.length} Plans</span>
            </div>

            {plans.length === 0 ? (
                <div className="empty-state">
                    <span>▤</span>
                    <p>No network plans saved yet.</p>
                </div>
            ) : (
                <div className="saved-plans-grid">
                    {plans.map((plan) => (
                        <div className="saved-plan-card" key={plan._id}>
                            <div className="plan-card-heading">
                                <span className="plan-icon">⌘</span>
                                <span className="status-badge">Saved</span>
                            </div>

                            <h3>{plan.networkName}</h3>

                            <p className="plan-ip">
                                {plan.ipAddress}
                            </p>

                            <div className="plan-info">
                                <p>
                                    Network
                                    <strong>
                                        {plan.networkAddress}/{plan.cidr}
                                    </strong>
                                </p>

                                <p>
                                    Subnet Mask
                                    <strong>{plan.subnetMask}</strong>
                                </p>

                                <p>
                                    Broadcast
                                    <strong>{plan.broadcastAddress}</strong>
                                </p>

                                <p>
                                    Required Hosts
                                    <strong>{plan.requiredHosts}</strong>
                                </p>

                                <p>
                                    Usable Hosts
                                    <strong>{plan.usableHosts}</strong>
                                </p>
                            </div>

                            <button
                                className="delete-button"
                                onClick={() => handleDelete(plan._id)}
                            >
                                Delete Plan
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderSummary = () => (
        <>
            <div className="content-card">
                <span className="eyebrow">NETWORK OVERVIEW</span>
                <h2>Planning Summary</h2>
                <p>
                    Overview of your saved network configurations.
                </p>

                <div className="summary-grid">

                    <div className="summary-card purple-card">
                        <div>
                            <p>Total Networks</p>
                            <h2>{plans.length}</h2>
                        </div>
                    </div>

                    <div className="summary-card lavender-card">
                        <div>
                            <p>Usable Host Capacity</p>
                            <h2>{totalHosts.toLocaleString()}</h2>
                        </div>
                    </div>

                    <div className="summary-card pink-card">
                        <div>
                            <p>Required Hosts</p>
                            <h2>{totalRequiredHosts.toLocaleString()}</h2>
                        </div>
                    </div>

                </div>
            </div>

            <div className="content-card">
                <h2>Latest Planning Result</h2>

                {result?.planningTrace ? (
                    <>
                        <p>
                            Planning Status:
                            <strong> {result.planningStatus}</strong>
                        </p>

                        <div className="planning-timeline">
                            {result.planningTrace.map((step, index) => (
                                <div
                                    className={`timeline-step ${step.status}`}
                                    key={index}
                                >
                                    <div className="timeline-number">
                                        {index + 1}
                                    </div>

                                    <div className="timeline-content">
                                        <strong>{step.state}</strong>
                                        <p>{step.condition}</p>
                                        <span>{step.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="helper-text">
                        No planning result is available yet.
                        Create a network to view its planning trace.
                    </p>
                )}
            </div>
        </>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'Network Configuration':
                return renderConfiguration();

            case 'FLAT Validation Results':
                return renderValidation();

            case 'Saved Network Plans':
                return renderSavedPlans();

            case 'Planning Summary':
                return renderSummary();

            default:
                return renderDashboard();
        }
    };

    return (
        <div className="app-layout">

            <aside className="sidebar">

                <div className="brand">
                    <div className="brand-icon">⌘</div>
                    <h2>IP Network</h2>
                    <p>Planner</p>
                </div>

                <div className="menu-label">MAIN MENU</div>

                <nav className="sidebar-menu">

                    {menuItems.map((item) => (
                        <button
                            key={item.name}
                            className={
                                activeSection === item.name
                                    ? 'menu-item active'
                                    : 'menu-item'
                            }
                            onClick={() => setActiveSection(item.name)}
                        >
                            <span className="menu-icon">{item.icon}</span>
                            <span>{item.name}</span>
                        </button>
                    ))}

                </nav>

                <div className="sidebar-footer">
                    <span className="online-dot"></span>
                    <div>
                        <strong>Network Planner</strong>
                        <p>Management Dashboard</p>
                    </div>
                </div>

            </aside>

            <main className="main-area">

                <header className="topbar">
                    <div>
                        <h1>{activeSection}</h1>
                        <p>
                            IP Address & Subnet Network Planner
                        </p>
                    </div>

                    <div className="topbar-right">
                        <span className="topbar-label">
                            Network Administration
                        </span>
                        <div className="profile-icon">NP</div>
                    </div>
                </header>

                <div className="page-content">

                    {renderContent()}

                </div>

                <footer className="footer">
                    IP Address & Subnet Network Planner
                    <span>Integrated Network Management System</span>
                </footer>

            </main>

        </div>
    );
}

export default App;
