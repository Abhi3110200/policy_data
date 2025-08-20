"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"

type Policy = {
  [key: string]: string
}

const PolicyList = () => {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/policies")
      if (!response.ok) {
        throw new Error("Failed to fetch policies")
      }
      const data = await response.json()
      console.log(data)
      setPolicies(data)
      setHeaders(Object.keys(data[0] || {}))
    } catch (err) {
      console.error("Failed to fetch policies:", err)
      setError("Failed to load policies. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-semibold text-gray-800">Policy List</CardTitle>
              <Button onClick={fetchPolicies} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                      {headers.length > 0
                        ? headers.map((header) => (
                            <th
                              key={header}
                              scope="col"
                              className="px-6 py-7 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))
                        : [...Array(headers.length)].map((_, index) => (
                            <th key={index} className="px-6 py-3">
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </th>
                          ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...Array(4)].map((_, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        {[...Array(headers.length)].map((_, colIndex) => (
                          <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="mb-4">{error}</p>
          <Button onClick={fetchPolicies}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-semibold text-gray-800">Policy List</CardTitle>
            <Button onClick={fetchPolicies} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            

            {policies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No policies found. Add your first policy to see it here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {headers.map((header) => (
                        <th
                          key={header}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {policies.map((policy, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        {headers.map((header) => {
                          const value = policy[header] || "-"
                          const isPdfLink =
                            (header === "PDF Link" ||
                              header === "pdf_link" ||
                              header === "PDF_Link" ||
                              header === "PDF LINK") &&
                            value &&
                            value !== "-" &&
                            value !== "No PDF attached"

                          return (
                            <td
                              key={`${index}-${header}`}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {isPdfLink ? (
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View PDF
                                </a>
                              ) : (
                                value
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PolicyList
