import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || '/api'

console.log('API_URL:', API_URL);

const EMPTY_MESSAGE = { type: '', text: '' }

function App() {
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(EMPTY_MESSAGE)
  const [searchTerm, setSearchTerm] = useState('')
  const [newPartForm, setNewPartForm] = useState({ title: '', quantity: '' })
  const [updateForm, setUpdateForm] = useState({
    partId: '',
    action: 'add',
    quantity: '',
  })

  const fetchParts = async () => {
    try {
      const response = await fetch(`${API_URL}/books`)
      const data = await response.json()
      setParts(data)
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Could not load the inventory right now.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParts()
  }, [])

  const filteredParts = parts.filter((part) =>
    part.title.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  )

  const handleAddPart = async (event) => {
    event.preventDefault()

    const title = newPartForm.title.trim()
    const quantity = Number(newPartForm.quantity)

    if (!title) {
      setMessage({ type: 'error', text: 'Part title is required.' })
      return
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessage({
        type: 'error',
        text: 'Quantity must be a whole number greater than zero.',
      })
      return
    }

    try {
      const response = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, quantity }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({
          type: 'error',
          text: data.message || 'Unable to add the part right now.',
        })
        return
      }

      setParts((current) => [data, ...current])
      setNewPartForm({ title: '', quantity: '' })
      setMessage({
        type: 'success',
        text: `${data.title} was added with ${data.quantity} copies.`,
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Unable to add the part right now.',
      })
    }
  }

  const handleInventoryUpdate = async (event) => {
    event.preventDefault()

    const quantity = Number(updateForm.quantity)

    if (!updateForm.partId) {
      setMessage({ type: 'error', text: 'Select a part before updating stock.' })
      return
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessage({
        type: 'error',
        text: 'Quantity must be a whole number greater than zero.',
      })
      return
    }

    const action = updateForm.action === 'add' ? 'add-stock' : 'sell'

    try {
      const response = await fetch(`${API_URL}/books/${updateForm.partId}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({
          type: 'error',
          text: data.message || 'The inventory update could not be completed.',
        })
        return
      }

      setParts((current) =>
        current.map((part) => (part._id === data._id ? data : part)),
      )
      setUpdateForm((current) => ({ ...current, quantity: '' }))
      setMessage({
        type: 'success',
        text:
          updateForm.action === 'add'
            ? `Added ${quantity} copies to the selected part.`
            : `Recorded a sale of ${quantity} copies.`,
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Unable to update the inventory right now.',
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <header className="mb-6 rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
          <h1 className="text-2xl font-bold md:text-3xl">Engr. Seyi's Phone Part Inventory</h1>
          <p className="mt-2 text-sm text-slate-300">
            Update your phone part inventory at any time with ease.
          </p>
        </header>

        {message.text ? (
          <div
            className={`message mb-6 ${
              message.type === 'success' ? 'message-success' : 'message-error'
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.75fr]">
          <section className="order-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:order-1">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Inventory</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {parts.length} parts
              </span>
            </div>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Search parts
              </span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Search parts..."
              />
            </label>

            {loading ? (
              <p className="text-slate-500">Loading inventory...</p>
            ) : parts.length === 0 ? (
              <p className="text-slate-500">No parts have been added yet.</p>
            ) : filteredParts.length === 0 ? (
              <p className="text-slate-500">No parts found.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Part name</th>
                      <th>Current stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.map((part) => (
                      <tr key={part._id}>
                        <td className="font-medium text-slate-800">{part.title}</td>
                        <td className="text-slate-700">{part.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside className="order-1 space-y-6 lg:order-2">
            <form
              onSubmit={handleAddPart}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <h2 className="text-xl font-semibold text-slate-900">Add New Part</h2>

              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Part name
                  </span>
                  <input
                    type="text"
                    value={newPartForm.name}
                    onChange={(event) =>
                      setNewPartForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    placeholder="e.g. iPhone 17 Pro Max Screens"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Quantity
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={newPartForm.quantity}
                    onChange={(event) =>
                      setNewPartForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    placeholder="10"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Add part
              </button>
            </form>

            <form
              onSubmit={handleInventoryUpdate}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <h2 className="text-xl font-semibold text-slate-900">Update Stock</h2>

              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Select part
                  </span>
                  <select
                    value={updateForm.partId}
                    onChange={(event) =>
                      setUpdateForm((current) => ({
                        ...current,
                        partId: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Choose a part</option>
                    {parts.map((part) => (
                      <option key={part._id} value={part._id}>
                        {part.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Action
                  </span>
                  <select
                    value={updateForm.action}
                    onChange={(event) =>
                      setUpdateForm((current) => ({
                        ...current,
                        action: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="add">Add Stock</option>
                    <option value="sell">Record Sale</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Quantity
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={updateForm.quantity}
                    onChange={(event) =>
                      setUpdateForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    placeholder="5"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                {updateForm.action === 'add' ? 'Submit update' : 'Record sale'}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default App
