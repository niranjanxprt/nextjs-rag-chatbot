/**
 * Search Page
 *
 * Dedicated search interface for finding information in documents
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Search, FileText, Clock, Zap, Filter } from 'lucide-react'

interface SearchResult {
  id: string
  documentId: string
  filename: string
  content: string
  score: number
  metadata?: {
    chunkIndex?: number
    totalChunks?: number
    createdAt?: string
  }
}

interface SearchResponse {
  success: boolean
  data: {
    results: SearchResult[]
    searchTime: number
    cached: boolean
  }
  meta: {
    searchType: string
    cached: boolean
    searchTime: number
  }
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchType, setSearchType] = useState<'semantic' | 'hybrid'>('semantic')
  const [searchTime, setSearchTime] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const performSearch = useCallback(async (searchQuery: string, type: 'semantic' | 'hybrid') => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          searchType: type,
          topK: 10,
          threshold: 0.5,
          includeMetadata: true,
          keywordWeight: 0.3,
          semanticWeight: 0.7,
          recencyWeight: 0.1,
        }),
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data: SearchResponse = await response.json()

      if (data.success) {
        setResults(data.data.results)
        setSearchTime(data.data.searchTime)
      } else {
        throw new Error('Search request failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query, searchType)
  }

  const handleQuickSearch = (quickQuery: string) => {
    setQuery(quickQuery)
    performSearch(quickQuery, searchType)
  }

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1)
  }

  const truncateContent = (content: string, maxLength: number = 300) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Search Documents</h1>
          <p className="text-muted-foreground">
            Find specific information across all your uploaded documents
          </p>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Query
            </CardTitle>
            <CardDescription>
              Enter your question or keywords to search through your documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="What would you like to know about your documents?"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !query.trim()}>
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </form>

            {/* Search Type Tabs */}
            <Tabs
              value={searchType}
              onValueChange={value => setSearchType(value as 'semantic' | 'hybrid')}
            >
              <TabsList>
                <TabsTrigger value="semantic" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Semantic Search
                </TabsTrigger>
                <TabsTrigger value="hybrid" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Hybrid Search
                </TabsTrigger>
              </TabsList>
              <TabsContent value="semantic" className="text-sm text-muted-foreground">
                AI-powered search that understands meaning and context
              </TabsContent>
              <TabsContent value="hybrid" className="text-sm text-muted-foreground">
                Combines semantic understanding with keyword matching for comprehensive results
              </TabsContent>
            </Tabs>

            {/* Quick Search Suggestions */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick searches:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'What is the main topic?',
                  'Summarize key points',
                  'What are the conclusions?',
                  'Explain the methodology',
                  'What are the recommendations?',
                ].map(suggestion => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSearch(suggestion)}
                    disabled={isLoading}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {searchTime !== null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Search completed in {searchTime}ms
            {results.length > 0 && ` • Found ${results.length} results`}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search Results</h2>

            {results.map((result, index) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <CardTitle className="text-lg">{result.filename}</CardTitle>
                    </div>
                    <Badge variant="secondary">{formatScore(result.score)}% match</Badge>
                  </div>
                  {result.metadata?.chunkIndex !== undefined && (
                    <CardDescription>
                      Chunk {result.metadata.chunkIndex + 1} of {result.metadata.totalChunks}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{truncateContent(result.content)}</p>
                  {result.metadata?.createdAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Document uploaded: {new Date(result.metadata.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {results.length === 0 && query && !isLoading && !error && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                No results found for "{query}". Try different keywords or upload more documents.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
