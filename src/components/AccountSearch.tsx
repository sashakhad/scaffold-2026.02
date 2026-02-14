'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AccountSearchProps {
  onAccountSelect: (account: string) => void;
  selectedAccount: string | null;
}

export function AccountSearch({ onAccountSelect, selectedAccount }: AccountSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchAccounts(searchTerm);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
     
  }, [searchTerm]);

  async function searchAccounts(term: string) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/account-suggestions?q=${encodeURIComponent(term)}`);
      if (!response.ok) {throw new Error(`HTTP ${response.status}`);}

      const data: { options: string[] } = await response.json();
      if (Array.isArray(data.options)) {
        setSuggestions(data.options);
        setIsOpen(data.options.length > 0);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search');
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelect(account: string) {
    setSearchTerm(account);
    setIsOpen(false);
    onAccountSelect(account);
  }

  function handleInputChange(value: string) {
    setSearchTerm(value);
    if (selectedAccount && value !== selectedAccount) {
      onAccountSelect('');
    }
    if (value.trim().length >= 2) {
      setIsOpen(true);
    }
  }

  return (
    <Card className="flex h-full w-full max-w-md flex-col">
      <CardHeader className="pb-4">
        <CardTitle>Find Your Team</CardTitle>
        <CardDescription>
          Search for your account to get started with token usage calculations
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="account-search">Account Name</Label>
          <div className="relative">
            <Input
              id="account-search"
              placeholder="Type your account name..."
              value={searchTerm}
              onChange={(e) => handleInputChange(e.target.value)}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              </div>
            )}
          </div>

          {isOpen && suggestions.length > 0 && (
            <div className="max-h-60 overflow-auto rounded-md border bg-white shadow-lg dark:bg-gray-900">
              {suggestions.map((accountName, index) => (
                <button
                  key={`${accountName}-${index}`}
                  onClick={() => handleSelect(accountName)}
                  className="hover:bg-accent flex w-full cursor-pointer items-start px-3 py-2 text-left text-sm"
                >
                  <span className="font-medium">{accountName}</span>
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}

          {selectedAccount && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Selected:</strong> {selectedAccount}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
