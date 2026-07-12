import { useMemo } from 'react'
import { useAppData } from '../../store/AppData'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import KpiCard from '../../components/ui/KpiCard'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'

export default function Reports() {
  const { trips, vehicles } = useAppData()

  const { totalRevenue, totalDistance, completedTrips } = useMemo(() => {
    let rev = 0
    let dist = 0
    let completed = 0
    trips.forEach(t => {
      if (t.status === 'Completed') {
        completed++
        rev += Number(t.revenue || 0)
        dist += Number(t.distance || 0)
      }
    })
    return { totalRevenue: rev, totalDistance: dist, completedTrips: completed }
  }, [trips])

  const totalVehicleCost = useMemo(() => {
    return vehicles.reduce((sum, v) => sum + Number(v.cost || 0), 0)
  }, [vehicles])

  // Compute Revenue and ROI per vehicle
  const roiData = useMemo(() => {
    const revByVehicle = {}
    trips.forEach(t => {
      if (t.status === 'Completed') {
        if (!revByVehicle[t.vehicleId]) revByVehicle[t.vehicleId] = 0
        revByVehicle[t.vehicleId] += Number(t.revenue || 0)
      }
    })

    return vehicles.map(v => {
      const rev = revByVehicle[v.id] || 0
      const cost = Number(v.cost || 0)
      // ROI is calculated as (Revenue / Cost) * 100 for this simple report
      const roi = cost > 0 ? ((rev / cost) * 100).toFixed(1) : 'N/A'
      return { ...v, revenue: rev, roi }
    }).sort((a, b) => b.revenue - a.revenue)
  }, [trips, vehicles])

  // Simple static bar visualization data (top 5 by revenue)
  const topVehicles = roiData.slice(0, 5)
  const maxRev = topVehicles.length ? topVehicles[0].revenue : 1

  // CSV Export logic
  const downloadCsv = () => {
    const headers = ['Registration', 'Name', 'Type', 'Cost (INR)', 'Revenue (INR)', 'ROI (%)']
    const rows = roiData.map(v => [
      v.reg,
      v.name,
      v.type,
      v.cost,
      v.revenue,
      v.roi
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'transitops_roi_report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="stack gap-lg">
      <PageHeader title="Reports & Analytics" subtitle="Financial and operational insights">
        <Button onClick={downloadCsv} variant="secondary">
          <Icon name="download" size={16} /> Export CSV
        </Button>
      </PageHeader>

      <div className="kpi-grid">
        <KpiCard icon="clipboard" accent="green" value={`₹${totalRevenue.toLocaleString('en-IN')}`} label="Total Revenue" hint="From completed trips" />
        <KpiCard icon="route" accent="blue" value={`${totalDistance.toLocaleString('en-IN')} km`} label="Total Distance" hint="Across all completed trips" />
        <KpiCard icon="checkCircle" accent="brand" value={completedTrips} label="Completed Trips" hint="Total successful deliveries" />
        <KpiCard icon="truck" accent="gray" value={`₹${totalVehicleCost.toLocaleString('en-IN')}`} label="Fleet Acquisition Cost" hint="Total investment in vehicles" />
      </div>

      <div className="dash-split">
        {/* ROI Table */}
        <Card>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-md)' }}>
            <h2>Vehicle ROI Analysis</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Acq. Cost</th>
                  <th>Total Revenue</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                {roiData.length === 0 ? (
                  <tr><td colSpan={4} className="muted" style={{ textAlign: 'center' }}>No vehicles found.</td></tr>
                ) : (
                  roiData.map(v => (
                    <tr key={v.id}>
                      <td data-label="Vehicle"><strong>{v.reg}</strong> <br/><span className="muted" style={{fontSize: 12}}>{v.name}</span></td>
                      <td data-label="Acq. Cost" className="text-num">₹{v.cost.toLocaleString('en-IN')}</td>
                      <td data-label="Total Revenue" className="text-num">₹{v.revenue.toLocaleString('en-IN')}</td>
                      <td data-label="ROI" className="text-num">{v.roi !== 'N/A' ? `${v.roi}%` : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right Column content */}
        <div className="stack gap-lg">
          {/* Revenue by Vehicle Type Pie Chart */}
          <Card>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-md)' }}>
              <h2>Revenue by Type</h2>
            </div>
            {(() => {
              // Calculate revenue by type
              const revenueByType = {}
              trips.forEach(t => {
                if (t.status === 'Completed') {
                  const v = vehicles.find(vh => vh.id === t.vehicleId)
                  if (v) {
                    revenueByType[v.type] = (revenueByType[v.type] || 0) + Number(t.revenue || 0)
                  }
                }
              })
              const pieData = Object.entries(revenueByType).map(([type, revenue]) => ({ type, revenue })).sort((a,b) => b.revenue - a.revenue)
              const totalPieRev = pieData.reduce((acc, curr) => acc + curr.revenue, 0)
              const pieColors = ['#C05621', '#1F6E8C', '#2F7A4D', '#D98A29', '#B23A2E']
              
              if (totalPieRev === 0) {
                return <p className="muted" style={{ textAlign: 'center', padding: 'var(--sp-xl) 0' }}>No revenue data yet.</p>
              }

              let cumulative = 0

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xl)', padding: 'var(--sp-md) 0' }}>
                  <svg width="120" height="120" viewBox="0 0 42 42" style={{ overflow: 'visible' }}>
                    <circle cx="21" cy="21" r="15.915494309189533" fill="transparent" stroke="#F4ECE3" strokeWidth="8" />
                    {pieData.map((item, i) => {
                      if (item.revenue === 0) return null
                      const percent = (item.revenue / totalPieRev) * 100
                      const dasharray = `${percent} ${100 - percent}`
                      const offset = 25 - cumulative
                      cumulative += percent
                      
                      return (
                        <circle
                          key={item.type}
                          cx="21"
                          cy="21"
                          r="15.915494309189533"
                          fill="transparent"
                          stroke={pieColors[i % pieColors.length]}
                          strokeWidth="8"
                          strokeDasharray={dasharray}
                          strokeDashoffset={offset}
                          style={{ transition: 'stroke-dasharray 0.5s ease' }}
                        />
                      )
                    })}
                  </svg>
                  <div className="stack gap-sm" style={{ flex: 1 }}>
                    {pieData.filter(item => item.revenue > 0).map((item, i) => (
                      <div key={item.type} className="row" style={{ gap: 'var(--sp-xs)', alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: pieColors[i % pieColors.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 13, flex: 1 }}>{item.type}</span>
                        <strong style={{ fontSize: 13 }}>₹{item.revenue.toLocaleString('en-IN')}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </Card>

          {/* Top Vehicles Chart */}
          <Card>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-md)' }}>
              <h2>Top Vehicles by Revenue</h2>
            </div>
            <div className="stack gap-md">
              {topVehicles.length === 0 || topVehicles[0].revenue === 0 ? (
                <p className="muted" style={{ textAlign: 'center', padding: 'var(--sp-xl) 0' }}>No completed trips with revenue yet.</p>
              ) : (
                topVehicles.filter(v => v.revenue > 0).map((v) => (
                  <div key={v.id} className="bar-row">
                    <div className="bar-top">
                      <strong>{v.reg}</strong>
                      <span className="bar-count">₹{v.revenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill bar-ontrip"
                        style={{ width: `${(v.revenue / maxRev) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
