'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Table, { Column } from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import SearchInput from '@/components/common/SearchInput'
import Avatar from '@/components/common/Avatar'
import StatusBadge from '@/components/common/StatusBadge'
import { Plus, Filter, Download, Send, Eye, Edit, Trash2, CheckCircle2, Clock } from 'lucide-react'
import { formatDate, formatPhone } from '@/lib/utils'
import { toast } from 'sonner'

// Mock data - Replace with API calls
const mockGuests = [
  {
    id: '1',
    name: 'Alice Freeman',
    email: 'alice@example.com',
    phone: '9876543210',
    roomNumber: '302',
    checkIn: new Date('2026-01-28'),
    checkOut: new Date('2026-01-30'),
    guestCount: 2,
    idVerified: true,
    source: 'BOOKING_COM',
    status: 'CHECKED_IN',
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9876543211',
    roomNumber: '101',
    checkIn: new Date('2026-01-29'),
    checkOut: new Date('2026-02-01'),
    guestCount: 1,
    idVerified: false,
    source: 'DIRECT',
    status: 'RESERVED',
  },
  {
    id: '3',
    name: 'Sarah Smith',
    email: 'sarah@example.com',
    phone: '9876543212',
    roomNumber: '205',
    checkIn: new Date('2026-01-27'),
    checkOut: new Date('2026-01-28'),
    guestCount: 2,
    idVerified: true,
    source: 'AIRBNB',
    status: 'CHECKED_OUT',
  },
]

export default function GuestsPage() {
  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [guestFormData, setGuestFormData] = useState({
    name: '',
    phone: '',
    email: '',
    idType: '',
    idNumber: '',
    guestCount: '1'
  })

  const fetchGuests = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/guests')
      if (res.ok) {
        const data = await res.json()
        const parsed = data.map((d: any) => ({
          ...d,
          checkIn: d.checkIn ? new Date(d.checkIn) : null,
          checkOut: d.checkOut ? new Date(d.checkOut) : null
        }))
        setGuests(parsed)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuests()
  }, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: 'ALL',
    source: 'ALL',
    idStatus: 'ALL',
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 5,
    pageSize: 10,
    totalItems: 50,
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<any>(null)

  // Filter guests based on search and filters
  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.phone.includes(searchQuery) ||
      guest.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filters.status === 'ALL' || guest.status === filters.status
    const matchesSource = filters.source === 'ALL' || guest.source === filters.source
    const matchesIdStatus =
      filters.idStatus === 'ALL' ||
      (filters.idStatus === 'VERIFIED' && guest.idVerified) ||
      (filters.idStatus === 'PENDING' && !guest.idVerified)

    return matchesSearch && matchesStatus && matchesSource && matchesIdStatus
  })

  const handleSendCheckInLink = (guest: any) => {
    const link = `${window.location.origin}/guest/check-in?phone=${guest.phone}`
    navigator.clipboard.writeText(link)
    toast.success(`Link copied to clipboard for ${guest.name}`)
  }

  const handleAddGuest = async () => {
    if (!guestFormData.name || !guestFormData.phone) {
      toast.error('Name and Phone are required')
      return
    }

    try {
      const res = await fetch('/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestFormData)
      })

      if (res.ok) {
        toast.success('Guest added/updated successfully')
        setShowAddModal(false)
        fetchGuests()
        setGuestFormData({ name: '', phone: '', email: '', idType: '', idNumber: '', guestCount: '1' })
      } else {
        const err = await res.text()
        toast.error(err || 'Failed to add guest')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleDelete = async (guestId: string) => {
    if (confirm('Are you sure you want to delete this guest?')) {
      try {
        const res = await fetch(`/api/admin/guests/${guestId}`, { method: 'DELETE' })
        if (res.ok) {
          toast.success('Guest deleted successfully')
          fetchGuests()
        } else {
          const err = await res.text()
          toast.error(err || 'Failed to delete guest')
        }
      } catch (error) {
        toast.error('Something went wrong')
      }
    }
  }

  const columns: Column<any>[] = [
    {
      key: 'name',
      label: 'Guest Name',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="font-medium text-text-primary">{row.name}</p>
            <p className="text-xs text-text-secondary">{row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roomNumber',
      label: 'Room',
      render: (value) => (
        <span className="font-mono font-semibold">{value}</span>
      ),
    },
    {
      key: 'checkIn',
      label: 'Check-in',
      render: (value) => (
        <div>
          <p className="text-sm">{formatDate(value)}</p>
        </div>
      ),
    },
    {
      key: 'checkOut',
      label: 'Check-out',
      render: (value) => (
        <div>
          <p className="text-sm">{formatDate(value)}</p>
        </div>
      ),
    },
    {
      key: 'guestCount',
      label: 'Guests',
      align: 'center',
      render: (value, row) => (
        <span className="text-sm">
          {value} {value === 1 ? 'Adult' : 'Adults'}
        </span>
      ),
    },
    {
      key: 'idVerified',
      label: 'ID Status',
      align: 'center',
      render: (value) => (
        value ? (
          <div className="flex items-center justify-center gap-1 text-success">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs">Verified</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 text-warning">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Pending</span>
          </div>
        )
      ),
    },
    {
      key: 'source',
      label: 'Source',
      render: (value) => (
        <StatusBadge status={value} />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <StatusBadge status={value} />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          {!row.idVerified && (
            <button
              onClick={() => handleSendCheckInLink(row)}
              className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
              title="Send check-in link"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSelectedGuest(row)}
            className="p-1.5 text-text-secondary hover:bg-surface-light rounded transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {/* TODO: Edit */ }}
            className="p-1.5 text-text-secondary hover:bg-surface-light rounded transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-danger hover:bg-danger/10 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Guest Management</h1>
          <p className="text-text-secondary mt-1">
            Manage current, past, and future guests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => toast.success('Export started')}
          >
            Export
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Guest
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SearchInput
            placeholder="Search by name, phone, or email..."
            onSearch={setSearchQuery}
            className="md:col-span-2"
          />
          <Select
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'RESERVED', label: 'Reserved' },
              { value: 'CHECKED_IN', label: 'Checked In' },
              { value: 'CHECKED_OUT', label: 'Checked Out' },
            ]}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          />
          <Select
            options={[
              { value: 'ALL', label: 'All Sources' },
              { value: 'DIRECT', label: 'Direct' },
              { value: 'BOOKING_COM', label: 'Booking.com' },
              { value: 'AIRBNB', label: 'Airbnb' },
              { value: 'MAKE_MY_TRIP', label: 'MakeMyTrip' },
            ]}
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="backdrop-blur-xl bg-surface/60 border-white/[0.08] overflow-hidden">
        <Table
          data={filteredGuests}
          columns={columns}
          loading={loading}
          emptyMessage="No guests found"
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination({ ...pagination, currentPage: page })
          }}
        />
      </Card>

      {/* Add Guest Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Guest"
        description="Create a new guest profile manually"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddGuest}>
              Add Guest
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="Enter full name"
              value={guestFormData.name}
              onChange={e => setGuestFormData({ ...guestFormData, name: e.target.value })}
              required
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="10-digit mobile"
              value={guestFormData.phone}
              onChange={e => setGuestFormData({ ...guestFormData, phone: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="guest@example.com"
            value={guestFormData.email}
            onChange={e => setGuestFormData({ ...guestFormData, email: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="ID Type"
              value={guestFormData.idType}
              onChange={e => setGuestFormData({ ...guestFormData, idType: e.target.value })}
              options={[
                { value: '', label: 'Select ID type' },
                { value: 'AADHAAR', label: 'Aadhaar Card' },
                { value: 'PASSPORT', label: 'Passport' },
                { value: 'DRIVING_LICENSE', label: 'Driving License' },
              ]}
              required
            />
            <Input
              label="ID Number"
              placeholder="Enter ID number"
              value={guestFormData.idNumber}
              onChange={e => setGuestFormData({ ...guestFormData, idNumber: e.target.value })}
              required
            />
          </div>
          <Input
            label="Number of Guests"
            type="number"
            min="1"
            value={guestFormData.guestCount}
            onChange={e => setGuestFormData({ ...guestFormData, guestCount: e.target.value })}
            required
          />
        </div>
      </Modal>

      {/* Guest Detail Modal */}
      {selectedGuest && (
        <Modal
          isOpen={!!selectedGuest}
          onClose={() => setSelectedGuest(null)}
          title="Guest Details"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={selectedGuest.name} size="xl" />
              <div>
                <h3 className="text-xl font-semibold">{selectedGuest.name}</h3>
                <p className="text-text-secondary">{formatPhone(selectedGuest.phone)}</p>
                <p className="text-text-secondary">{selectedGuest.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-tertiary uppercase mb-1">Room Number</p>
                <p className="font-semibold text-lg">{selectedGuest.roomNumber}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase mb-1">Number of Guests</p>
                <p className="font-semibold text-lg">{selectedGuest.guestCount}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase mb-1">Check-in</p>
                <p className="font-semibold">{formatDate(selectedGuest.checkIn)}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase mb-1">Check-out</p>
                <p className="font-semibold">{formatDate(selectedGuest.checkOut)}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase mb-1">Source</p>
                <StatusBadge status={selectedGuest.source} />
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase mb-1">Status</p>
                <StatusBadge status={selectedGuest.status} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
