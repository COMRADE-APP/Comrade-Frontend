import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowLeft, BarChart3, Calendar, Users, Ticket, TrendingUp,
    Eye, CheckCircle, DollarSign, Award, Star, Download,
    RefreshCw, ChevronDown, ChevronUp, Filter, PieChart, FileText,
    Loader, DownloadCloud, Image
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart as RePie, Pie, Cell, CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import eventsService from '../services/events.service';
import { formatDate } from '../utils/dateFormatter';

const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'demographics', label: 'Demographics', icon: PieChart },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'export', label: 'Export', icon: Download },
];

const KPI_CARDS = [
    { key: 'total_events', label: 'Total Events', icon: Calendar, color: 'blue' },
    { key: 'total_attendees', label: 'Total Attendees', icon: Users, color: 'green' },
    { key: 'total_revenue', label: 'Total Revenue', icon: DollarSign, color: 'emerald' },
    { key: 'total_sponsorship', label: 'Total Sponsorship', icon: Award, color: 'amber' },
    { key: 'avg_rating', label: 'Avg Rating', icon: Star, color: 'purple' },
];

const PIE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

const MONTHS = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

const formatCurrency = (val) => {
    const num = parseFloat(val || 0);
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const colorMap = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    purple: 'bg-purple-500/10 text-purple-500',
};

const monthLabel = (v) => {
    if (!v) return '';
    const [, m] = v.split('-');
    return MONTHS[parseInt(m, 10) - 1]?.label || v;
};

const downloadCSV = (filename, headers, rows) => {
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const StatCard = ({ label, value, icon: Icon, color }) => (
    <Card>
        <CardBody className="flex items-center gap-3 py-4">
            <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.blue}`}>
                <Icon size={22} />
            </div>
            <div>
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-sm text-secondary">{label}</p>
            </div>
        </CardBody>
    </Card>
);

const FilterBar = ({ monthFilter, setMonthFilter, yearFilter, setYearFilter }) => (
    <div className="flex items-center gap-3">
        <select
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-theme bg-elevated text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
            <option value="">All Months</option>
            {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
            ))}
        </select>
        <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-theme bg-elevated text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
            <option value="">All Years</option>
            {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
            ))}
        </select>
    </div>
);

const OverviewTab = ({ overview, revenueTimeline, onYearChange, selectedYear, onDownloadTab }) => {
    const [showScrollHint, setShowScrollHint] = useState(false);
    const scrollRef = useRef(null);

    const checkOverflow = () => {
        if (scrollRef.current) {
            setShowScrollHint(scrollRef.current.scrollWidth > scrollRef.current.clientWidth);
        }
    };

    useEffect(() => {
        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [revenueTimeline]);

    if (!overview) return null;
    const values = {
        total_events: overview.total_events,
        total_attendees: overview.total_attendees,
        total_revenue: formatCurrency(overview.total_revenue),
        total_sponsorship: formatCurrency(overview.total_sponsorship),
        avg_rating: overview.avg_rating != null ? `${overview.avg_rating} / 5` : 'N/A',
    };

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 flex-1">
                    {KPI_CARDS.map(kpi => (
                        <StatCard
                            key={kpi.key}
                            label={kpi.label}
                            value={values[kpi.key]}
                            icon={kpi.icon}
                            color={kpi.color}
                        />
                    ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => onDownloadTab('overview')}>
                    <DownloadCloud size={14} className="mr-1" /> Export
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                    label="Average Views per Event"
                    value={overview.total_events > 0 ? Math.round(overview.total_views / overview.total_events) : 0}
                    icon={Eye}
                    color="blue"
                />
                <StatCard
                    label="Avg Engagement Rate"
                    value={overview.total_views > 0 ? `${Math.round((overview.total_bookings / overview.total_views) * 100)}%` : 'N/A'}
                    icon={TrendingUp}
                    color="purple"
                />
            </div>
            <Card>
                <CardBody>
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h3 className="text-lg font-semibold text-primary">Revenue Trend</h3>
                        <select
                            value={selectedYear || ''}
                            onChange={e => onYearChange(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-theme bg-elevated text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                        >
                            <option value="">All Years</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        {showScrollHint && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-secondary text-xs pointer-events-none">
                                Scroll &rarr;
                            </div>
                        )}
                        <div ref={scrollRef} className="overflow-x-auto pb-2" style={{ maxHeight: '300px' }}>
                            <div style={{ minWidth: revenueTimeline && revenueTimeline.length > 12 ? `${revenueTimeline.length * 60}px` : '100%', height: 260 }}>
                                {revenueTimeline && revenueTimeline.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={revenueTimeline}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} tickFormatter={monthLabel} />
                                            <YAxis tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip formatter={(val) => [formatCurrency(val), 'Revenue']} labelFormatter={label => label || 'Unknown'} contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                                            <Bar dataKey="revenue" fill="var(--color-primary-600)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-secondary">No revenue data available for this period</div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

const EventsTab = ({ events }) => {
    const [sortField, setSortField] = useState('event_date');
    const [sortDir, setSortDir] = useState('desc');
    const [monthFilter, setMonthFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const filtered = (events || []).filter(e => {
        if (!e.event_date) return true;
        const d = new Date(e.event_date);
        if (monthFilter && (d.getMonth() + 1).toString() !== monthFilter) return false;
        if (yearFilter && d.getFullYear().toString() !== yearFilter) return false;
        return true;
    });

    const sorted = [...filtered].sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === 'event_date') {
            valA = new Date(valA || 0).getTime();
            valB = new Date(valB || 0).getTime();
        } else {
            valA = typeof valA === 'string' ? (valA || '').toLowerCase() : (valA || 0);
            valB = typeof valB === 'string' ? (valB || '').toLowerCase() : (valB || 0);
        }
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const handleDownloadAll = () => {
        const headers = ['Name', 'Date', 'Status', 'Tickets Sold', 'Revenue', 'Interested', 'Booked', 'Checked In'];
        const rows = sorted.map(e => [
            e.name, formatDate(e.event_date), e.status, e.tickets_sold, e.revenue,
            e.interested_count, e.booked_count, e.checked_in_count,
        ]);
        downloadCSV(`events-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    };

    const SortHeader = ({ field, children }) => (
        <th className="px-3 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:text-primary select-none" onClick={() => handleSort(field)}>
            <div className="flex items-center gap-1">
                {children}
                {sortField === field && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </div>
        </th>
    );

    if (!events || events.length === 0) {
        return (
            <Card>
                <CardBody className="text-center py-12">
                    <Calendar className="w-12 h-12 text-tertiary mx-auto mb-4" />
                    <p className="text-secondary">No event data available</p>
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <FilterBar monthFilter={monthFilter} setMonthFilter={setMonthFilter} yearFilter={yearFilter} setYearFilter={setYearFilter} />
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                        <DownloadCloud size={14} className="mr-1" /> Download All
                    </Button>
                </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-theme">
                <table className="w-full">
                    <thead className="bg-secondary/50">
                        <tr>
                            <SortHeader field="name">Event</SortHeader>
                            <SortHeader field="event_date">Date</SortHeader>
                            <SortHeader field="status">Status</SortHeader>
                            <SortHeader field="tickets_sold">Sold</SortHeader>
                            <SortHeader field="revenue">Revenue</SortHeader>
                            <SortHeader field="interested_count">Interested</SortHeader>
                            <SortHeader field="booked_count">Booked</SortHeader>
                            <SortHeader field="checked_in_count">Checked In</SortHeader>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-theme">
                        {sorted.map(event => (
                            <tr key={event.id} className="hover:bg-secondary/20 transition-colors">
                                <td className="px-3 py-3 text-sm font-medium text-primary">{event.name}</td>
                                <td className="px-3 py-3 text-sm text-secondary">{formatDate(event.event_date)}</td>
                                <td className="px-3 py-3">
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-600/10 text-primary-600 capitalize">{event.status}</span>
                                </td>
                                <td className="px-3 py-3 text-sm text-primary">{event.tickets_sold}</td>
                                <td className="px-3 py-3 text-sm text-primary font-medium">{formatCurrency(event.revenue)}</td>
                                <td className="px-3 py-3 text-sm text-primary">{event.interested_count}</td>
                                <td className="px-3 py-3 text-sm text-primary">{event.booked_count}</td>
                                <td className="px-3 py-3 text-sm text-primary">{event.checked_in_count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DemographicsTab = ({ demographics, loading }) => {
    const [monthFilter, setMonthFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4" />
                <p className="text-secondary">Loading demographics...</p>
            </div>
        );
    }

    if (!demographics) {
        return (
            <Card>
                <CardBody className="text-center py-12">
                    <PieChart className="w-12 h-12 text-tertiary mx-auto mb-4" />
                    <p className="text-secondary">No demographics data available yet. Data will populate as attendees check in.</p>
                </CardBody>
            </Card>
        );
    }

    const genderData = (demographics.gender || []).map(g => ({
        name: g.gender.charAt(0).toUpperCase() + g.gender.slice(1),
        value: g.count,
    }));

    const locationData = (demographics.location || []).map(l => ({
        name: l.location,
        count: l.count,
    }));

    const categoryData = (demographics.category || []).map(c => ({
        name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
        value: c.count,
    }));

    let monthlyData = (demographics.monthly_attendance || []).map(m => ({
        month: m.month,
        count: m.count,
    }));

    if (monthFilter || yearFilter) {
        monthlyData = monthlyData.filter(m => {
            if (!m.month) return false;
            const [, mo] = m.month.split('-');
            const yr = m.month.split('-')[0];
            if (monthFilter && mo !== monthFilter) return false;
            if (yearFilter && yr !== yearFilter) return false;
            return true;
        });
    }

    const handleDownloadAll = () => {
        const sections = [];
        sections.push({ name: 'Gender Distribution', headers: ['Gender', 'Count'], rows: genderData.map(g => [g.name, g.value]) });
        sections.push({ name: 'Location Distribution', headers: ['Location', 'Count'], rows: locationData.map(l => [l.name, l.count]) });
        sections.push({ name: 'Category Distribution', headers: ['Category', 'Count'], rows: categoryData.map(c => [c.name, c.value]) });
        sections.push({ name: 'Monthly Attendance', headers: ['Month', 'Count'], rows: monthlyData.map(m => [m.month, m.count]) });
        let csv = '';
        sections.forEach(s => {
            csv += `\n${s.name}\n`;
            csv += [s.headers.join(','), ...s.rows.map(r => r.join(','))].join('\n') + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `demographics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadChart = (chartName, headers, rows) => {
        downloadCSV(`${chartName}-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <FilterBar monthFilter={monthFilter} setMonthFilter={setMonthFilter} yearFilter={yearFilter} setYearFilter={setYearFilter} />
                <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                    <DownloadCloud size={14} className="mr-1" /> Download All
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-primary">Gender Distribution</h3>
                            {genderData.length > 0 && (
                                <button onClick={() => downloadChart('gender-distribution', ['Gender', 'Count'], genderData.map(g => [g.name, g.value]))} className="p-1.5 hover:bg-secondary rounded-lg text-secondary hover:text-primary transition-colors" title="Download chart">
                                    <Download size={14} />
                                </button>
                            )}
                        </div>
                        {genderData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <RePie>
                                    <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {genderData.map((_, idx) => (<Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />))}
                                    </Pie>
                                    <Tooltip />
                                </RePie>
                            </ResponsiveContainer>
                        ) : (<p className="text-secondary text-center py-12">No gender data yet</p>)}
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-primary">Ticket Category Distribution</h3>
                            {categoryData.length > 0 && (
                                <button onClick={() => downloadChart('category-distribution', ['Category', 'Count'], categoryData.map(c => [c.name, c.value]))} className="p-1.5 hover:bg-secondary rounded-lg text-secondary hover:text-primary transition-colors" title="Download chart">
                                    <Download size={14} />
                                </button>
                            )}
                        </div>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <RePie>
                                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {categoryData.map((_, idx) => (<Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />))}
                                    </Pie>
                                    <Tooltip />
                                </RePie>
                            </ResponsiveContainer>
                        ) : (<p className="text-secondary text-center py-12">No category data yet</p>)}
                    </CardBody>
                </Card>
            </div>
            <Card>
                <CardBody>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-primary">Top Locations</h3>
                        {locationData.length > 0 && (
                            <button onClick={() => downloadChart('top-locations', ['Location', 'Count'], locationData.map(l => [l.name, l.count]))} className="p-1.5 hover:bg-secondary rounded-lg text-secondary hover:text-primary transition-colors" title="Download chart">
                                <Download size={14} />
                            </button>
                        )}
                    </div>
                    {locationData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <ResponsiveContainer width="100%" height={Math.max(200, locationData.length * 40)}>
                                <BarChart data={locationData} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} width={120} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="var(--color-primary-600)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (<p className="text-secondary text-center py-8">No location data yet</p>)}
                </CardBody>
            </Card>
            <Card>
                <CardBody>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-primary">Monthly Attendance Trend</h3>
                        {monthlyData.length > 0 && (
                            <button onClick={() => downloadChart('monthly-attendance', ['Month', 'Count'], monthlyData.map(m => [m.month, m.count]))} className="p-1.5 hover:bg-secondary rounded-lg text-secondary hover:text-primary transition-colors" title="Download chart">
                                <Download size={14} />
                            </button>
                        )}
                    </div>
                    {monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} tickFormatter={monthLabel} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="var(--color-primary-600)" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (<p className="text-secondary text-center py-8">No attendance data yet</p>)}
                </CardBody>
            </Card>
        </div>
    );
};

const FinancialTab = ({ financialSummary, ticketCategories, demographics }) => {
    const [monthFilter, setMonthFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');

    if (!financialSummary) return null;

    let monthlyData = (demographics?.monthly_revenue || []).map(m => ({
        month: m.month,
        revenue: parseFloat(m.revenue || 0),
    }));

    if (monthFilter || yearFilter) {
        monthlyData = monthlyData.filter(m => {
            if (!m.month) return false;
            const [, mo] = m.month.split('-');
            const yr = m.month.split('-')[0];
            if (monthFilter && mo !== monthFilter) return false;
            if (yearFilter && yr !== yearFilter) return false;
            return true;
        });
    }

    const categoryRevenue = (demographics?.category_revenue || []).map(c => ({
        name: c.label,
        revenue: parseFloat(c.revenue || 0),
    }));

    const handleDownloadAll = () => {
        const sections = [];
        sections.push({ name: 'Summary', headers: ['Metric', 'Value'], rows: [
            ['Total Revenue', formatCurrency(financialSummary.total_revenue)],
            ['Total Sponsorship', formatCurrency(financialSummary.total_sponsorship)],
            ['Net Revenue', formatCurrency(financialSummary.net_revenue)],
        ]});
        if (monthlyData.length) sections.push({ name: 'Monthly Revenue', headers: ['Month', 'Revenue'], rows: monthlyData.map(m => [m.month, m.revenue]) });
        if (categoryRevenue.length) sections.push({ name: 'Revenue by Category', headers: ['Category', 'Revenue'], rows: categoryRevenue.map(c => [c.name, c.revenue]) });
        if (ticketCategories?.length) sections.push({ name: 'Ticket Category Breakdown', headers: ['Category', 'Sales', 'Revenue'], rows: ticketCategories.map(c => [c.label, c.sales, c.revenue]) });
        if (demographics?.sponsorship_revenue) sections.push({ name: 'Sponsorship', headers: ['Type', 'Amount'], rows: [['Sponsorship Revenue', demographics.sponsorship_revenue]] });
        let csv = '';
        sections.forEach(s => {
            csv += `\n${s.name}\n`;
            csv += [s.headers.join(','), ...s.rows.map(r => r.join(','))].join('\n') + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadChart = (chartName, headers, rows) => {
        downloadCSV(`${chartName}-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <FilterBar monthFilter={monthFilter} setMonthFilter={setMonthFilter} yearFilter={yearFilter} setYearFilter={setYearFilter} />
                <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                    <DownloadCloud size={14} className="mr-1" /> Download All
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Total Revenue" value={formatCurrency(financialSummary.total_revenue)} icon={DollarSign} color="emerald" />
                <StatCard label="Total Sponsorship" value={formatCurrency(financialSummary.total_sponsorship)} icon={Award} color="amber" />
                <StatCard label="Net Revenue" value={formatCurrency(financialSummary.net_revenue)} icon={TrendingUp} color="blue" />
            </div>
            {monthlyData.length > 0 && (
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-primary">Monthly Revenue</h3>
                            <button onClick={() => downloadChart('monthly-revenue', ['Month', 'Revenue'], monthlyData.map(m => [m.month, m.revenue]))} className="p-1.5 hover:bg-secondary rounded-lg text-secondary hover:text-primary transition-colors" title="Download chart">
                                <Download size={14} />
                            </button>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} tickFormatter={monthLabel} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(val) => [formatCurrency(val), 'Revenue']} />
                                <Bar dataKey="revenue" fill="var(--color-primary-600)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>
            )}
            {categoryRevenue.length > 0 && (
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-primary">Revenue by Ticket Category</h3>
                            <button onClick={() => downloadChart('revenue-by-category', ['Category', 'Revenue'], categoryRevenue.map(c => [c.name, c.revenue]))} className="p-1.5 hover:bg-secondary rounded-lg text-secondary hover:text-primary transition-colors" title="Download chart">
                                <Download size={14} />
                            </button>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={categoryRevenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(val) => [formatCurrency(val), 'Revenue']} />
                                <Bar dataKey="revenue" fill="var(--color-primary-600)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>
            )}
            {demographics?.sponsorship_revenue > 0 && (
                <StatCard label="Sponsorship Revenue" value={formatCurrency(demographics.sponsorship_revenue)} icon={Award} color="amber" />
            )}
            {ticketCategories && ticketCategories.length > 0 && (
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-primary">Ticket Category Breakdown</h3>
                            <button onClick={() => downloadChart('ticket-category-breakdown', ['Category', 'Sales', 'Revenue'], ticketCategories.map(c => [c.label, c.sales, c.revenue]))} className="p-1.5 hover:bg-secondary rounded-lg text-secondary hover:text-primary transition-colors" title="Download chart">
                                <Download size={14} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-secondary uppercase">Category</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-secondary uppercase">Sales</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-secondary uppercase">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-theme">
                                    {ticketCategories.map(cat => (
                                        <tr key={cat.category} className="hover:bg-secondary/20">
                                            <td className="px-3 py-2 text-sm text-primary capitalize">{cat.label}</td>
                                            <td className="px-3 py-2 text-sm text-primary">{cat.sales}</td>
                                            <td className="px-3 py-2 text-sm text-primary">{formatCurrency(cat.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

const ExportTab = ({ dashboardData, demographicsData, onExportPDF, onExportDOC, exporting }) => {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [exportScope, setExportScope] = useState('all');

    return (
        <div className="space-y-6">
            <Card>
                <CardBody>
                    <h3 className="text-lg font-semibold text-primary mb-4">Export Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-primary mb-1">Date From</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-theme bg-elevated text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-primary mb-1">Date To</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-theme bg-elevated text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-600" />
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-primary mb-2">Export Scope</label>
                        <div className="flex gap-4 flex-wrap">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="exportScope" value="all" checked={exportScope === 'all'} onChange={() => setExportScope('all')} className="text-primary-600 focus:ring-primary-600" />
                                <span className="text-sm text-primary">Full Report</span>
                            </label>
                            {TABS.filter(t => t.id !== 'export').map(tab => (
                                <label key={tab.id} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="exportScope" value={tab.id} checked={exportScope === tab.id} onChange={() => setExportScope(tab.id)} className="text-primary-600 focus:ring-primary-600" />
                                    <span className="text-sm text-primary">{tab.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={() => onExportPDF(exportScope, dateFrom, dateTo)} disabled={exporting} variant="primary">
                            {exporting ? <><Loader className="w-4 h-4 animate-spin" /> Generating PDF...</> : <><FileText className="w-4 h-4" /> Export PDF</>}
                        </Button>
                        <Button onClick={() => onExportDOC(exportScope, dateFrom, dateTo)} disabled={exporting} variant="secondary">
                            {exporting ? <><Loader className="w-4 h-4 animate-spin" /> Generating DOC...</> : <><Download className="w-4 h-4" /> Export DOC</>}
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

const EventAnalytics = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const activeTab = searchParams.get('tab') || 'overview';
    const [data, setData] = useState(null);
    const [demographics, setDemographics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [demographicsLoading, setDemographicsLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [selectedYear, setSelectedYear] = useState('');
    const reportRef = useRef(null);

    useEffect(() => {
        loadDashboard();
        loadDemographics();
    }, []);

    const loadDashboard = async (year) => {
        try {
            setLoading(true);
            const params = {};
            if (year) params.year = year;
            const response = await eventsService.getOrganizerDashboard(params);
            setData(response.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const loadDemographics = async () => {
        try {
            setDemographicsLoading(true);
            const response = await eventsService.getDemographics();
            setDemographics(response.data);
        } catch (error) {
            console.error('Error loading demographics:', error);
            setDemographics(null);
        } finally {
            setDemographicsLoading(false);
        }
    };

    const handleTabClick = (tabId) => {
        const params = new URLSearchParams(searchParams);
        params.set('tab', tabId);
        setSearchParams(params);
    };

    const handleYearChange = (year) => {
        setSelectedYear(year);
        loadDashboard(year);
    };

    const handleDownloadTab = async (tabId) => {
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = reportRef.current || document.createElement('div');
            const opt = {
                margin: 0.5,
                filename: `${tabId}-report-${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false, onclone: (doc) => { const s = doc.createElement('style'); s.textContent = ':root { color-scheme: light !important; }'; doc.head.appendChild(s); } },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            };
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('PDF export failed:', error);
        }
    };

    const handleExportPDF = async (scope, dateFrom, dateTo) => {
        setExporting(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = reportRef.current || document.createElement('div');
            const opt = {
                margin: 0.5,
                filename: `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false, onclone: (doc) => { const s = doc.createElement('style'); s.textContent = ':root { color-scheme: light !important; }'; doc.head.appendChild(s); } },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            };
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('PDF export failed:', error);
        } finally {
            setExporting(false);
        }
    };

    const handleExportDOC = async (scope, dateFrom, dateTo) => {
        setExporting(true);
        try {
            const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel } = await import('docx');
            const overview = data?.overview || {};
            const events = data?.events || [];

            const rows = events.map(e => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(e.name)] }),
                    new TableCell({ children: [new Paragraph(formatDate(e.event_date))] }),
                    new TableCell({ children: [new Paragraph(e.status)] }),
                    new TableCell({ children: [new Paragraph(String(e.tickets_sold))] }),
                    new TableCell({ children: [new Paragraph(formatCurrency(e.revenue))] }),
                ],
            }));

            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({ text: 'Analytics Report', heading: HeadingLevel.TITLE }),
                        new Paragraph({ text: `Generated: ${new Date().toLocaleDateString()}`, spacing: { after: 200 } }),
                        new Paragraph({ text: `Total Events: ${overview.total_events || 0}`, spacing: { after: 100 } }),
                        new Paragraph({ text: `Total Attendees: ${overview.total_attendees || 0}`, spacing: { after: 100 } }),
                        new Paragraph({ text: `Total Revenue: ${formatCurrency(overview.total_revenue)}`, spacing: { after: 100 } }),
                        new Paragraph({ text: `Total Sponsorship: ${formatCurrency(overview.total_sponsorship)}`, spacing: { after: 200 } }),
                        new Paragraph({ text: 'Event Details', heading: HeadingLevel.HEADING_1 }),
                        new Table({
                            rows: [
                                new TableRow({
                                    children: ['Event', 'Date', 'Status', 'Sold', 'Revenue'].map(h =>
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })
                                    ),
                                }),
                                ...rows,
                            ],
                        }),
                    ],
                }],
            });

            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('DOC export failed:', error);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/events')} className="p-2 hover:bg-secondary rounded-full text-secondary hover:text-primary transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
                            <BarChart3 className="w-7 h-7 text-primary-600" />
                            Organizer Analytics
                        </h1>
                        <p className="text-secondary mt-1">Full analytics dashboard for your events</p>
                    </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => { loadDashboard(selectedYear); loadDemographics(); }} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 overflow-x-auto">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => handleTabClick(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-elevated text-primary shadow-sm' : 'text-secondary hover:text-primary hover:bg-elevated/50'}`}>
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                    <p className="text-secondary">Loading analytics...</p>
                </div>
            ) : !data ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <BarChart3 className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <p className="text-secondary mb-2">Unable to load analytics data.</p>
                        <p className="text-sm text-tertiary mb-4">Make sure you have an organizer profile.</p>
                        <Button variant="primary" onClick={() => loadDashboard(selectedYear)}>
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </Button>
                    </CardBody>
                </Card>
            ) : (
                <div ref={reportRef}>
                    {activeTab === 'overview' && (
                        <OverviewTab overview={data.overview} revenueTimeline={data.revenue_timeline} onYearChange={handleYearChange} selectedYear={selectedYear} onDownloadTab={handleDownloadTab} />
                    )}
                    {activeTab === 'events' && <EventsTab events={data.events} />}
                    {activeTab === 'demographics' && <DemographicsTab demographics={demographics} loading={demographicsLoading} />}
                    {activeTab === 'financial' && (
                        <FinancialTab financialSummary={data.financial_summary} ticketCategories={data.ticket_categories} demographics={demographics} />
                    )}
                    {activeTab === 'export' && (
                        <ExportTab dashboardData={data} demographicsData={demographics} onExportPDF={handleExportPDF} onExportDOC={handleExportDOC} exporting={exporting} />
                    )}
                </div>
            )}
        </div>
    );
};

export default EventAnalytics;
