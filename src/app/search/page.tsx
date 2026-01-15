/**
 * Search Page
 *
 * Dedicated search interface for finding information in documents with React Query integration
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, FileText, Clock, Zap, Filter, Lightbulb } from 'lucide-react'
import { useDebounce } from '@/lib/hooks/useDebounce'

// Dynamically import AppLayout to avoid SSR issues
const AppLayout = dynamic(() => import('@/components/layouts/AppLayout').then(mod => ({ default: mod.AppLayout })), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
})

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
  const [hasSearched, setHasSearched] = useState(false)

  // Debounce query for suggestions
  const debouncedQuery = useDebounce(query, 300)

  // Fetch search suggestions
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim() || debouncedQuery.length < 2) return []
      
      const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(debouncedQuery)}&limit=5`)
      if (!response.ok) throw new Error('Failed to fetch suggestions')
      
      const data = await response.json()
      return data.suggestions || []
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const performSearch = useCallback(async (searchQuery: string, type: 'semantic' | 'hybrid') => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

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

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    performSearch(suggestion, searchType)
  }

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1)
  }

  const truncateContent = (content: string, maxLength: number = 300) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <AppLayout>
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
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="What would you like to know about your documents?"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="flex-1"
                />
                
                {/* Search Suggestions Dropdown */}
                {suggestions.length > 0 && query.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b bg-gray-50">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Lightbulb className="w-4 h-4" />
                        Suggestions
                      </div>
                    </div>
                    {suggestions.map((suggestion: string, index: number) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-b-0"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                {suggestionsLoading && query.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg">
                    <div className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">Loading suggestions...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Button type="submit" disabled={isLoading || !query.trim()} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
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
        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-muted-foreground">Searching your documents...</span>
            </div>
            
            {/* Loading Skeletons */}
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-5 h-5" />
                      <Skeleton className="h-6 w-48" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <Search className="w-5 h-5" />
                <p className="font-medium">Search Error</p>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => performSearch(query, searchType)}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {searchTime !== null && !isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Search completed in {searchTime}ms
            {results.length > 0 && ` • Found ${results.length} results`}
          </div>
        )}

        {results.length > 0 && !isLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Search Results</h2>
              <Badge variant="secondary">{results.length} results</Badge>
            </div>

            {results.map((result, index) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <CardTitle className="text-lg truncate">{result.filename}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      {formatScore(result.score)}% match
                    </Badge>
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

        {results.length === 0 && hasSearched && !isLoading && !error && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                No results found for "{query}". Try different keywords or upload more documents.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => setSearchType('hybrid')}>
                  Try Hybrid Search
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                  Clear Search
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
