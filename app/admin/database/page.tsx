"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Database, Table, Search, Download, RefreshCw, AlertTriangle } from "lucide-react"
import { Button } from "@/app/components/ui/Button"
import { Input } from "@/app/components/ui/Input"
import { Card } from "@/app/components/ui/Card"
import { Modal } from "@/app/components/ui/Modal"

interface TableSchema {
  field: string
  label: string
  type: string
}

interface TableInfo {
  name: string
  label: string
}

export default function DatabasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [tableSchema, setTableSchema] = useState<TableSchema[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showQueryModal, setShowQueryModal] = useState(false)
  const [customQuery, setCustomQuery] = useState("")
  const [queryResult, setQueryResult] = useState<any[] | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [queryLoading, setQueryLoading] = useState(false)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/database")
      if (response.ok) {
        const data = await response.json()
        setTables(data.tables)
      } else {
        console.error("Error fetching tables")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTableData = async (tableName: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/database?table=${tableName}`)
      if (response.ok) {
        const data = await response.json()
        setTableData(data.data)
        setTableSchema(data.schema)
        setSelectedTable(tableName)
      } else {
        console.error("Error fetching table data")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) return

    try {
      setQueryLoading(true)
      setQueryError(null)

      const response = await fetch("/api/admin/database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: customQuery }),
      })

      const data = await response.json()

      if (response.ok) {
        setQueryResult(data.result)
      } else {
        setQueryError(data.error || "Error ejecutando consulta")
        setQueryResult(null)
      }
    } catch (error) {
      setQueryError("Error de conexión")
      setQueryResult(null)
    } finally {
      setQueryLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!tableData.length) return

    // Create CSV content
    const headers = tableSchema.map((col) => col.label).join(",")
    const rows = tableData
      .map((row) => {
        return tableSchema
          .map((col) => {
            const fieldPath = col.field.split(".")
            let value = row

            for (const path of fieldPath) {
              value = value?.[path]
            }

            if (value === null || value === undefined) return ""
            if (typeof value === "object") value = JSON.stringify(value)
            if (typeof value === "boolean") value = value ? "Sí" : "No"
            if (value instanceof Date) value = value.toISOString()

            // Escape commas and quotes
            return `"${String(value).replace(/"/g, '""')}"`
          })
          .join(",")
      })
      .join("\n")

    const csv = `${headers}\n${rows}`

    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${selectedTable}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredData = tableData.filter((row) => {
    if (!searchTerm) return true

    // Search in all fields
    return tableSchema.some((col) => {
      const fieldPath = col.field.split(".")
      let value = row

      for (const path of fieldPath) {
        value = value?.[path]
      }

      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return "-"

    if (type === "boolean") {
      return value ? "✅" : "❌"
    }

    if (type === "datetime" && value) {
      return new Date(value).toLocaleString()
    }

    if (type === "json") {
      return (
        <div className="max-w-xs truncate">
          <span title={JSON.stringify(value, null, 2)}>
            {JSON.stringify(value).substring(0, 50)}
            {JSON.stringify(value).length > 50 ? "..." : ""}
          </span>
        </div>
      )
    }

    return String(value)
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center mr-4">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">Explorador de Base de Datos</h1>
                <p className="text-secondary-600">Consulta y exporta datos de las tablas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push("/admin")} variant="outline">
                Volver al Panel
              </Button>
              <Button onClick={() => setShowQueryModal(true)} variant="primary">
                Consulta SQL
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tables List */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {tables.map((table) => (
              <Card
                key={table.name}
                className={`p-6 cursor-pointer transition-all hover:shadow-md ${
                  selectedTable === table.name ? "ring-2 ring-primary-500" : ""
                }`}
                onClick={() => fetchTableData(table.name)}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <Table className="h-5 w-5 text-secondary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-secondary-900">{table.label}</p>
                    <p className="text-sm text-secondary-500">{table.name}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Table Data */}
          {selectedTable && (
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-secondary-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Tabla: {tables.find((t) => t.name === selectedTable)?.label || selectedTable}
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={() => fetchTableData(selectedTable)} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                    <Button onClick={exportToCSV} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      {tableSchema.map((column) => (
                        <th
                          key={column.field}
                          className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {loading ? (
                      <tr>
                        <td colSpan={tableSchema.length} className="px-6 py-4 text-center">
                          <div className="loading-spinner mx-auto" />
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={tableSchema.length} className="px-6 py-4 text-center text-secondary-500">
                          No se encontraron datos
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-secondary-50">
                          {tableSchema.map((column) => {
                            const fieldPath = column.field.split(".")
                            let value = row

                            for (const path of fieldPath) {
                              value = value?.[path]
                            }

                            return (
                              <td key={column.field} className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                {formatValue(value, column.type)}
                              </td>
                            )
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-secondary-200 bg-secondary-50 text-sm text-secondary-500">
                {filteredData.length} registros encontrados
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* SQL Query Modal */}
      <Modal
        isOpen={showQueryModal}
        onClose={() => setShowQueryModal(false)}
        title="Consulta SQL Personalizada"
        size="xl"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <p className="text-sm text-yellow-700">
                  Por seguridad, solo se permiten consultas SELECT. Las consultas se ejecutan directamente en la base de
                  datos.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Consulta SQL</label>
            <textarea
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="input-field font-mono"
              rows={5}
              placeholder="SELECT * FROM users LIMIT 10"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={executeCustomQuery} loading={queryLoading} disabled={!customQuery.trim()}>
              Ejecutar Consulta
            </Button>
          </div>

          {queryError && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">{queryError}</div>
          )}

          {queryResult && (
            <div className="mt-4">
              <h4 className="text-lg font-medium text-secondary-900 mb-2">Resultados</h4>

              {queryResult.length === 0 ? (
                <div className="bg-secondary-50 p-4 text-center text-secondary-500 rounded">
                  La consulta no devolvió resultados
                </div>
              ) : (
                <div className="overflow-x-auto border border-secondary-200 rounded">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                      <tr>
                        {Object.keys(queryResult[0]).map((key) => (
                          <th
                            key={key}
                            className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {queryResult.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-secondary-50">
                          {Object.entries(row).map(([key, value]) => (
                            <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                              {value === null ? "-" : typeof value === "object" ? JSON.stringify(value) : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-2 text-sm text-secondary-500">{queryResult.length} registros encontrados</div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
