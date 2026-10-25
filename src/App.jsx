import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { LayoutDashboard, Factory, Wrench, Package, Users, ShieldAlert, ClipboardList, Search, Bell, Menu, X, Activity, Clock, CheckCircle, AlertTriangle, TrendingUp, LogOut, Pencil, Trash2, Save } from 'lucide-react'
import { supabase } from './supabase'
import './index.css'

const navigation = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Operations', path: '/operations', icon: Factory },
  { label: 'Equipment', path: '/equipment', icon: Wrench },
  { label: 'Maintenance', path: '/maintenance', icon: ClipboardList },
  { label: 'Inventory', path: '/inventory', icon: Package },
  { label: 'Staff & Shifts', path: '/staff', icon: Users },
  { label: 'Safety Reports', path: '/safety', icon: ShieldAlert }
]

const initialRecords = {
  Operations: [
    { name: 'Distillation Unit A', detail: 'Crude oil processing', status: 'Running' },
    { name: 'Hydrocracker Unit B', detail: 'Hydrocarbon conversion', status: 'Running' },
    { name: 'Reformer Unit C', detail: 'Catalytic reforming', status: 'Inspection' },
    { name: 'Desulfurization Unit D', detail: 'Sulfur removal', status: 'Running' }
  ],
  Equipment: [
    { name: 'Pump P-101', detail: 'Crude transfer pump', status: 'Operational' },
    { name: 'Compressor C-204', detail: 'Gas compression', status: 'Operational' },
    { name: 'Heat Exchanger E-301', detail: 'Thermal exchange', status: 'Inspection' },
    { name: 'Valve V-408', detail: 'Flow control', status: 'Maintenance' }
  ],
  Maintenance: [
    { name: 'Pump P-101 inspection', detail: 'Maintenance Team A', status: 'Pending' },
    { name: 'Compressor C-204 service', detail: 'Maintenance Team B', status: 'In Progress' },
    { name: 'Valve V-408 repair', detail: 'Maintenance Team A', status: 'Pending' }
  ],
  Inventory: [
    { name: 'Industrial Lubricant', detail: 'Store A - 120 units', status: 'Available' },
    { name: 'Replacement Filters', detail: 'Store B - 18 units', status: 'Low Stock' },
    { name: 'Safety Gloves', detail: 'Store C - 240 units', status: 'Available' },
    { name: 'Valve Seals', detail: 'Store A - 12 units', status: 'Low Stock' }
  ],
  Staff: [
    { name: 'Operations Team A', detail: 'Morning Shift - 06:00 to 14:00', status: 'On Duty' },
    { name: 'Operations Team B', detail: 'Evening Shift - 14:00 to 22:00', status: 'Scheduled' },
    { name: 'Maintenance Team', detail: 'Day Shift - 09:00 to 17:00', status: 'On Duty' }
  ],
  Safety: [
    { name: 'Routine safety inspection', detail: 'Area 1 - Sample record', status: 'Completed' },
    { name: 'Fire equipment inspection', detail: 'Area 2 - Sample record', status: 'Pending' },
    { name: 'Protective equipment audit', detail: 'Area 3 - Sample record', status: 'In Progress' }
  ]
}

function Sidebar({ close }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon"><Factory size={24} /></div>
        <div><strong>REFINEX</strong><span>REFINERY MANAGEMENT</span></div>
        <button className="mobile-close" onClick={close}><X /></button>
      </div>
      <div className="plant-label">PLANT MANAGEMENT</div>
      <nav>
        {navigation.map(item => {
          const Icon = item.icon
          return (
            <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={close} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={19} /><span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
      <div className="sidebar-bottom"><div className="online-dot" /> System interface online <span>CONNECTED</span></div>
    </aside>
  )
}

function Header({ search, setSearch, openMenu, profile, onSignOut, signingOut }) {
  const displayName = profile?.full_name?.trim() || 'User'
  const roleLabel = profile?.role === 'admin' ? 'Administrator' : 'Coordinator'
  const initials = displayName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={openMenu}><Menu /></button>
      <div className="breadcrumb">Plant Management <span>/</span> <strong>Operations Portal</strong></div>
      <div className="header-actions">
        <div className="search-box"><Search size={17} /><input placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <button className="icon-button" title="Notifications"><Bell size={19} /><i /></button>
        <div className="profile"><div className="avatar">{initials || 'U'}</div><div><strong>{displayName}</strong><span>{roleLabel}</span></div></div>
        <button className="icon-button" title="Sign out" onClick={onSignOut} disabled={signingOut}><LogOut size={18} /></button>
      </div>
    </header>
  )
}

function Stat({ icon: Icon, label, value, note, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon size={21} /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note"><TrendingUp size={14} />{note}</div>
    </div>
  )
}

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    operations: [],
    equipment: [],
    maintenance: [],
    inventory: [],
    shifts: [],
    safety: []
  })
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      setDashboardLoading(true)
      setDashboardError('')
      const results = await Promise.all([
        supabase.from('operations').select('id,title,status,created_at'),
        supabase.from('equipment').select('id,name,status,created_at'),
        supabase.from('maintenance').select('id,title,status,created_at'),
        supabase.from('inventory').select('id,name,quantity,status,created_at'),
        supabase.from('shifts').select('id,team_name,shift_time,status,created_at'),
        supabase.from('safety_reports').select('id,title,status,created_at')
      ])
      const failed = results.find(result => result.error)
      if (failed) {
        setDashboardError(failed.error.message)
      } else {
        setDashboardData({
          operations: results[0].data || [],
          equipment: results[1].data || [],
          maintenance: results[2].data || [],
          inventory: results[3].data || [],
          shifts: results[4].data || [],
          safety: results[5].data || []
        })
      }
      setDashboardLoading(false)
    }
    loadDashboard()
  }, [])

  const activeUnits = dashboardData.operations.filter(item => item.status?.toLowerCase() === 'running').length
  const openMaintenance = dashboardData.maintenance.filter(item => ['pending', 'in progress'].includes(item.status?.toLowerCase())).length
  const inventoryAlerts = dashboardData.inventory.filter(item => ['low stock', 'out of stock'].includes(item.status?.toLowerCase())).length
  const openSafetyReports = dashboardData.safety.filter(item => ['pending', 'in progress', 'escalated'].includes(item.status?.toLowerCase())).length
  const sections = [
    { label: 'Operations', count: dashboardData.operations.length },
    { label: 'Equipment', count: dashboardData.equipment.length },
    { label: 'Maintenance', count: dashboardData.maintenance.length },
    { label: 'Inventory', count: dashboardData.inventory.length },
    { label: 'Staff & Shifts', count: dashboardData.shifts.length },
    { label: 'Safety', count: dashboardData.safety.length }
  ]
  const maxCount = Math.max(1, ...sections.map(section => section.count))
  const recentOperations = [...dashboardData.operations].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 4)

  return (
    <>
      <div className="welcome-row">
        <div><div className="eyebrow">PLANT OVERVIEW</div><h1>Operations Dashboard</h1><p>Live summary of records stored in your refinery database.</p></div>
        <div className="date-chip"><Clock size={16} /> Live database overview</div>
      </div>
      {dashboardError && <p className="login-error">{dashboardError}</p>}
      <div className="stats-grid">
        <Stat icon={Activity} label="Active Units" value={dashboardLoading ? '—' : String(activeUnits).padStart(2, '0')} note="Operations marked Running" color="green" />
        <Stat icon={Wrench} label="Maintenance Tasks" value={dashboardLoading ? '—' : String(openMaintenance).padStart(2, '0')} note="Pending or in progress" color="blue" />
        <Stat icon={Package} label="Inventory Alerts" value={dashboardLoading ? '—' : String(inventoryAlerts).padStart(2, '0')} note="Low or out of stock" color="orange" />
        <Stat icon={ShieldAlert} label="Safety Reports" value={dashboardLoading ? '—' : String(openSafetyReports).padStart(2, '0')} note="Reports needing review" color="red" />
      </div>
      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading"><div><h2>Records by Section</h2><p>Current records in Supabase</p></div><span className="live-label"><i /> LIVE DATA</span></div>
          {dashboardLoading ? <div className="empty-state">Loading dashboard data...</div> : (
            <div className="chart">
              {sections.map(section => (
                <div className="chart-column" key={section.label}>
                  <div className="bar-pair"><div className="bar" style={{ height: `${Math.max(8, section.count / maxCount * 100)}%` }} /><div className="bar secondary" style={{ height: `${Math.max(8, section.count / maxCount * 72)}%` }} /></div>
                  <span>{section.label === 'Staff & Shifts' ? 'Staff' : section.label}</span>
                  <strong>{section.count}</strong>
                </div>
              ))}
            </div>
          )}
          <div className="chart-legend"><span><i /> Total records</span><span><i /> Section comparison</span></div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>Recent Operations</h2><p>Latest operations records</p></div></div>
          {dashboardLoading ? <div className="empty-state">Loading operations...</div> : recentOperations.length === 0 ? <div className="empty-state">No operations records yet.</div> : (
            <div className="status-list">
              {recentOperations.map(item => (
                <div className="status-row" key={item.id}>
                  <div className="unit-icon"><Factory size={18} /></div>
                  <div className="unit-name"><strong>{item.title}</strong><span>Operations record</span></div>
                  <span className={`status ${item.status?.toLowerCase() === 'running' ? 'success' : ['pending', 'inspection', 'on hold'].includes(item.status?.toLowerCase()) ? 'warning' : 'info'}`}>{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <section className="panel tasks-panel">
        <div className="panel-heading"><div><h2>Database Overview</h2><p>Records currently stored in each section</p></div></div>
        <div className="status-list">
          {sections.map(section => (
            <div className="status-row" key={section.label}>
              <div className="unit-icon"><ClipboardList size={18} /></div>
              <div className="unit-name"><strong>{section.label}</strong><span>Saved records</span></div>
              <span className="status info">{dashboardLoading ? 'Loading' : section.count}</span>
            </div>
          ))}
        </div>
      </section>
      <p className="demo-notice"><Activity size={16} /> Dashboard values are calculated from your Supabase records. They are not live process sensor readings.</p>
    </>
  )
}

const recordConfig = {
  Operations: { table: 'operations', nameColumn: 'title', detailColumn: 'description', initialStatus: 'Pending', detailLabel: 'Description or assignment', detailPlaceholder: 'Describe the operation' },
  Equipment: { table: 'equipment', nameColumn: 'name', detailColumn: 'description', initialStatus: 'Operational', detailLabel: 'Description', detailPlaceholder: 'Describe the equipment' },
  Maintenance: { table: 'maintenance', nameColumn: 'title', detailColumn: 'description', initialStatus: 'Pending', detailLabel: 'Description or assignment', detailPlaceholder: 'Describe the maintenance task' },
  Inventory: { table: 'inventory', nameColumn: 'name', detailColumn: 'quantity', initialStatus: 'Available', detailLabel: 'Quantity', detailPlaceholder: 'Enter quantity' },
  Staff: { table: 'shifts', nameColumn: 'team_name', detailColumn: 'shift_time', initialStatus: 'Scheduled', detailLabel: 'Shift time', detailPlaceholder: 'e.g. Morning Shift - 06:00 to 14:00' },
  Safety: { table: 'safety_reports', nameColumn: 'title', detailColumn: 'description', initialStatus: 'Pending', detailLabel: 'Description', detailPlaceholder: 'Describe the safety report' }
}

function mapRecord(row, config, title) {
  const detailValue = row[config.detailColumn]
  return {
    id: row.id,
    name: row[config.nameColumn] || '',
    detail: title === 'Inventory' ? String(detailValue ?? 0) : String(detailValue || ''),
    status: row.status || config.initialStatus
  }
}

const statusOptions = {
  Operations: ['Pending', 'Running', 'Inspection', 'Completed', 'On Hold'],
  Equipment: ['Operational', 'Inspection', 'Maintenance', 'Out of Service'],
  Maintenance: ['Pending', 'In Progress', 'Completed'],
  Inventory: ['Available', 'Low Stock', 'Out of Stock'],
  Staff: ['Scheduled', 'On Duty', 'Off Duty'],
  Safety: ['Pending', 'In Progress', 'Completed', 'Escalated']
}

function RecordsPage({ title, search, role }) {
  const config = recordConfig[title]
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('All')
  const [newName, setNewName] = useState('')
  const [newDetail, setNewDetail] = useState('')
  const [newStatus, setNewStatus] = useState(config.initialStatus)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [pageError, setPageError] = useState('')
  const [pageNotice, setPageNotice] = useState('')

  async function loadRecords() {
    setLoadingRecords(true)
    setPageError('')
    const { data, error } = await supabase.from(config.table).select('*').order('created_at', { ascending: false })
    if (error) {
      setPageError(error.message)
      setItems([])
    } else {
      setItems((data || []).map(row => mapRecord(row, config, title)))
    }
    setLoadingRecords(false)
  }

  useEffect(() => {
    loadRecords()
  }, [title])

  const filtered = items.filter(item => `${item.name} ${item.detail} ${item.status}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'All' || item.status === filter))

  function resetForm() {
    setNewName('')
    setNewDetail('')
    setNewStatus(config.initialStatus)
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(item) {
    setEditingId(item.id)
    setNewName(item.name)
    setNewDetail(item.detail)
    setNewStatus(item.status)
    setShowForm(true)
    setPageError('')
    setPageNotice('')
  }

  async function saveRecord(e) {
    e.preventDefault()
    setPageError('')
    setPageNotice('')
    if (!newName.trim() || !newDetail.trim()) return

    let detailValue = newDetail.trim()
    if (title === 'Inventory') {
      const quantity = Number(detailValue)
      if (!Number.isInteger(quantity) || quantity < 0) {
        setPageError('Quantity must be a whole number of zero or more.')
        return
      }
      detailValue = quantity
    }

    const payload = {
      [config.nameColumn]: newName.trim(),
      [config.detailColumn]: detailValue,
      status: newStatus
    }

    setSaving(true)
    const result = editingId
      ? await supabase.from(config.table).update(payload).eq('id', editingId).select('*').single()
      : await supabase.from(config.table).insert(payload).select('*').single()
    setSaving(false)

    if (result.error) {
      setPageError(result.error.message)
      return
    }

    const savedItem = mapRecord(result.data, config, title)
    if (editingId) {
      setItems(current => current.map(item => item.id === editingId ? savedItem : item))
      setPageNotice('Record updated successfully.')
    } else {
      setItems(current => [savedItem, ...current])
      setPageNotice('Record saved to the database successfully.')
    }
    resetForm()
  }

  async function deleteRecord(item) {
    const confirmed = window.confirm(`Delete "${item.name}"? This cannot be undone.`)
    if (!confirmed) return

    setPageError('')
    setPageNotice('')
    setDeletingId(item.id)
    const { error } = await supabase.from(config.table).delete().eq('id', item.id)
    setDeletingId(null)

    if (error) {
      setPageError(error.message)
      return
    }

    setItems(current => current.filter(record => record.id !== item.id))
    if (editingId === item.id) resetForm()
    setPageNotice('Record deleted successfully.')
  }

  return (
    <div className="records-page">
      <div className="welcome-row">
        <div><div className="eyebrow">PLANT MANAGEMENT</div><h1>{title === 'Staff' ? 'Staff & Shifts' : title}</h1><p>View and manage {title.toLowerCase()} records stored in Supabase.</p></div>
        <button className="primary-button" onClick={() => { if (showForm) resetForm(); else { resetForm(); setShowForm(true) } setPageError(''); setPageNotice('') }}>{showForm && editingId === null ? 'Cancel' : '+ Add Record'}</button>
      </div>
      {showForm && (
        <form className="panel add-form" onSubmit={saveRecord}>
          <h2>{editingId ? `Edit ${title} record` : `Add ${title} record`}</h2>
          <label>Record name</label>
          <input placeholder={title === 'Staff' ? 'Team name' : 'Record name'} value={newName} onChange={e => setNewName(e.target.value)} required />
          <label>{config.detailLabel}</label>
          <input type={title === 'Inventory' ? 'number' : 'text'} min={title === 'Inventory' ? '0' : undefined} step={title === 'Inventory' ? '1' : undefined} placeholder={config.detailPlaceholder} value={newDetail} onChange={e => setNewDetail(e.target.value)} required />
          <label>Status</label>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            {statusOptions[title].map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <div className="form-actions">
            <button className="primary-button" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Record'}</button>
            <button type="button" className="icon-button" onClick={resetForm} disabled={saving}>Cancel</button>
          </div>
        </form>
      )}
      {pageError && <p className="login-error">{pageError}</p>}
      {pageNotice && <p className="login-notice">{pageNotice}</p>}
      <div className="panel records-panel">
        <div className="panel-heading"><div><h2>{title} Register</h2><p>{filtered.length} records displayed</p></div><div><button className="icon-button" title="Refresh records" onClick={loadRecords} disabled={loadingRecords}><Activity size={17} /></button> <select value={filter} onChange={e => setFilter(e.target.value)}><option>All</option>{[...new Set(items.map(i => i.status))].map(status => <option key={status}>{status}</option>)}</select></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>RECORD</th><th>{title === 'Inventory' ? 'QUANTITY' : title === 'Staff' ? 'SHIFT TIME' : 'DESCRIPTION'}</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{title === 'Inventory' ? `${item.detail} units` : item.detail}</td>
                  <td><span className={`status ${['Running', 'Operational', 'Available', 'Completed', 'On Duty'].includes(item.status) ? 'success' : ['Pending', 'Inspection', 'Low Stock', 'Maintenance', 'Out of Stock'].includes(item.status) ? 'warning' : 'info'}`}>{item.status}</span></td>
                  <td>
                    <div className="record-actions">
                      <button type="button" className="icon-button" title="Edit record" onClick={() => startEdit(item)}><Pencil size={16} /></button>
                      {role === 'admin' && <button type="button" className="icon-button" title="Delete record" onClick={() => deleteRecord(item)} disabled={deletingId === item.id}>{deletingId === item.id ? '...' : <Trash2 size={16} />}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loadingRecords && <div className="empty-state">Loading records...</div>}
          {!loadingRecords && !pageError && filtered.length === 0 && <div className="empty-state">No records found. Use “Add Record” to create the first one.</div>}
        </div>
      </div>
    </div>
  )
}

function Login({ onSignup, onSubmit, loading, error, notice }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submit(e) {
    e.preventDefault()
    onSubmit(email.trim(), password)
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-icon login-logo"><Factory size={27} /></div>
        <div className="eyebrow">REFINERY OPERATIONS PORTAL</div>
        <h1>Welcome back</h1>
        <p>Sign in to access the management interface.</p>
        <label>Email address</label>
        <input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" autoComplete="current-password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button className="primary-button login-submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        {error && <p className="login-error">{error}</p>}
        {notice && <p className="login-notice">{notice}</p>}
        <p className="login-foot">Your access role is assigned by the system administrator.</p>
        <button type="button" className="text-button" onClick={onSignup}>Create an account</button>
      </form>
    </div>
  )
}

function Signup({ onLogin, onSubmit, loading, error, notice }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submit(e) {
    e.preventDefault()
    onSubmit(name.trim(), email.trim(), password)
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-icon login-logo"><Factory size={27} /></div>
        <div className="eyebrow">REFINERY OPERATIONS PORTAL</div>
        <h1>Create account</h1>
        <p>Register to request access to the platform.</p>
        <label>Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name" autoComplete="name" />
        <label>Email address</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" autoComplete="email" />
        <label>Password</label>
        <input type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 8 characters" autoComplete="new-password" />
        <button className="primary-button login-submit" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</button>
        {error && <p className="login-error">{error}</p>}
        {notice && <p className="login-notice">{notice}</p>}
        <button type="button" className="text-button" onClick={onLogin}>Back to login</button>
      </form>
    </div>
  )
}

function AppLayout({ profile, onSignOut, signingOut }) {
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <BrowserRouter>
      <div className="app-shell">
        <div className={menuOpen ? 'sidebar-overlay open' : 'sidebar-overlay'} onClick={() => setMenuOpen(false)} />
        <div className={menuOpen ? 'sidebar-wrap menu-open' : 'sidebar-wrap'}><Sidebar close={() => setMenuOpen(false)} /></div>
        <div className="main-area">
          <Header search={search} setSearch={setSearch} openMenu={() => setMenuOpen(true)} profile={profile} onSignOut={onSignOut} signingOut={signingOut} />
          <main className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/operations" element={<RecordsPage title="Operations" search={search} role={profile?.role} />} />
              <Route path="/equipment" element={<RecordsPage title="Equipment" search={search} role={profile?.role} />} />
              <Route path="/maintenance" element={<RecordsPage title="Maintenance" search={search} role={profile?.role} />} />
              <Route path="/inventory" element={<RecordsPage title="Inventory" search={search} role={profile?.role} />} />
              <Route path="/staff" element={<RecordsPage title="Staff" search={search} role={profile?.role} />} />
              <Route path="/safety" element={<RecordsPage title="Safety" search={search} role={profile?.role} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <footer>REFINEX - Petroleum Refinery Operations Management <span>Connected account</span></footer>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default function App() {
  const [screen, setScreen] = useState('login')
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true

    async function loadProfile(user) {
      if (!user) {
        if (active) {
          setProfile(null)
          setLoading(false)
        }
        return
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

      if (!active) return

      if (profileError) {
        setProfile(null)
        setError('Your account exists, but its profile could not be loaded. Check the profiles table and its access policies in Supabase.')
        setLoading(false)
        return
      }

      setProfile(data)
      setError('')
      setLoading(false)
    }

    async function initialize() {
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (!active) return

      if (sessionError) {
        setError(sessionError.message)
      }

      const currentSession = data?.session || null
      setSession(currentSession)
      if (currentSession?.user) {
        await loadProfile(currentSession.user)
      }
      if (active) setLoading(false)
    }

    initialize()

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!active) return
      setSession(newSession)
      if (!newSession) {
        setProfile(null)
        setLoading(false)
      } else {
        setLoading(true)
        Promise.resolve().then(() => loadProfile(newSession.user))
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleLogin(email, password) {
    setSubmitting(true)
    setError('')
    setNotice('')

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(loginError.message)
      setSubmitting(false)
      return
    }

    if (data.user && !data.session) {
      setNotice('Check your email and verify your account before signing in.')
    }

    setSubmitting(false)
  }

  async function handleSignup(name, email, password) {
    setSubmitting(true)
    setError('')
    setNotice('')

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name }
      }
    })

    if (signupError) {
      setError(signupError.message)
      setSubmitting(false)
      return
    }

    if (data.session) {
      setNotice('Your account was created. You are signed in.')
    } else {
      setNotice('Account created. Check your inbox and click the verification link before signing in.')
    }

    setScreen('login')
    setSubmitting(false)
  }

  async function handleSignOut() {
    setSigningOut(true)
    const { error: signOutError } = await supabase.auth.signOut()
    setSigningOut(false)

    if (signOutError) {
      setError(signOutError.message)
      return
    }

    setSession(null)
    setProfile(null)
    setError('')
    setNotice('You have signed out successfully.')
    setScreen('login')
  }

  if (loading) {
    return <div className="login-screen"><div className="login-card"><div className="brand-icon login-logo"><Factory size={27} /></div><h1>Loading your account...</h1><p>Please wait while we verify your session.</p></div></div>
  }

  if (session && profile) {
    return <AppLayout profile={profile} onSignOut={handleSignOut} signingOut={signingOut} />
  }

  if (session && !profile) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="brand-icon login-logo"><Factory size={27} /></div>
          <h1>Profile setup needed</h1>
          <p>{error || 'Your login succeeded, but the profile is not available yet.'}</p>
          <button className="primary-button login-submit" onClick={handleSignOut} disabled={signingOut}>{signingOut ? 'Signing out...' : 'Sign out'}</button>
        </div>
      </div>
    )
  }

  if (screen === 'signup') {
    return <Signup onLogin={() => { setScreen('login'); setError(''); setNotice('') }} onSubmit={handleSignup} loading={submitting} error={error} notice={notice} />
  }

  return <Login onSignup={() => { setScreen('signup'); setError(''); setNotice('') }} onSubmit={handleLogin} loading={submitting} error={error} notice={notice} />
}
