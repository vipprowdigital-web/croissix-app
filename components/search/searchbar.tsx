// components/search/searchbar.tsx

import { SearchBarWithSuggestions } from '@/components/ui/searchbar';
import React, { useState } from 'react';

export function SearchBarSuggestions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestions = [
    'React Native',
    'React Navigation',
    'React Hook Form',
    'Redux Toolkit',
    'Expo Router',
    'TypeScript',
    'JavaScript',
    'Node.js',
    'Next.js',
    'Tailwind CSS',
  ];

  const handleSearch = (query: string) => {
    if(query.trim()){
        setLoading(true);
        // Simulate API call
        setTimeout(()=>{
            setLoading(false);
            console.log('Search completed for:', query);
        }, 2000)
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  return (
    <SearchBarWithSuggestions
      placeholder='Type to see suggestions...'
      value={searchQuery}
      onChangeText={setSearchQuery}
      onSearch={handleSearch}
      loading={loading}
      suggestions={suggestions}
      onSuggestionPress={handleSuggestionPress}
      maxSuggestions={8} 
    />
  );
}
