"use client";

import React, { useState, useCallback, useRef } from "react";
import { Card, Text, Button, Spinner, Banner, Icon } from "@shopify/polaris";
import { ImportIcon, LinkIcon, DeleteIcon } from "@shopify/polaris-icons";

interface DragDropUrlImportProps {
  onUrlSubmit: (urls: string[]) => void;
  onValidateUrl?: (url: string) => Promise<boolean>;
  loading?: boolean;
  error?: string | null;
  acceptedDomains?: string[];
  placeholder?: string;
  className?: string;
}

interface UrlEntry {
  id: string;
  url: string;
  status: 'pending' | 'validating' | 'valid' | 'invalid';
  error?: string;
}

export function DragDropUrlImport({
  onUrlSubmit,
  onValidateUrl,
  loading = false,
  error = null,
  acceptedDomains = ['instagram.com', 'tiktok.com', 'twitter.com'],
  placeholder = "Drop Instagram, TikTok, or Twitter URLs here or click to paste",
  className,
}: DragDropUrlImportProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract URLs from text using regex
  const extractUrlsFromText = (text: string): string[] => {
    const urlRegex = /https?:\/\/(www\.)?(instagram|tiktok|twitter|x)\.com\/[^\s]*/gi;
    return text.match(urlRegex) || [];
  };

  // Validate if URL is from supported domains
  const isValidDomain = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return acceptedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  };

  // Add URLs with validation
  const addUrls = useCallback(async (newUrls: string[]) => {
    const urlEntries: UrlEntry[] = newUrls
      .filter(url => url.trim())
      .map(url => {
        const trimmedUrl = url.trim();
        const isValid = isValidDomain(trimmedUrl);
        
        const entry: UrlEntry = {
          id: `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: trimmedUrl,
          status: isValid ? 'pending' : 'invalid',
        };
        
        if (!isValid) {
          entry.error = 'Unsupported domain';
        }
        
        return entry;
      });

    setUrls(prev => [...prev, ...urlEntries]);

    // Validate URLs if validation function is provided
    if (onValidateUrl) {
      for (const entry of urlEntries) {
        if (entry.status === 'pending') {
          setUrls(prev => prev.map(u => 
            u.id === entry.id ? { ...u, status: 'validating' } : u
          ));

          try {
            const isValid = await onValidateUrl(entry.url);
            setUrls(prev => prev.map(u => {
              if (u.id === entry.id) {
                const updatedEntry: UrlEntry = {
                  ...u,
                  status: isValid ? 'valid' : 'invalid'
                };
                if (!isValid) {
                  updatedEntry.error = 'Invalid URL';
                }
                return updatedEntry;
              }
              return u;
            }));
          } catch (error) {
            setUrls(prev => prev.map(u => {
              if (u.id === entry.id) {
                return {
                  ...u,
                  status: 'invalid',
                  error: 'Validation failed'
                };
              }
              return u;
            }));
          }
        }
      }
    }
  }, [onValidateUrl, acceptedDomains]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only set drag over to false if leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const text = e.dataTransfer.getData('text/plain');
    const extractedUrls = extractUrlsFromText(text);
    
    if (extractedUrls.length > 0) {
      addUrls(extractedUrls);
    } else if (text.trim()) {
      // Try to add as single URL even if regex didn't match
      addUrls([text.trim()]);
    }
  }, [addUrls]);

  // Handle paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const extractedUrls = extractUrlsFromText(text);
      
      if (extractedUrls.length > 0) {
        addUrls(extractedUrls);
      } else if (text.trim()) {
        addUrls([text.trim()]);
      }
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
      // Fallback to manual input
      const url = prompt('Paste your URL here:');
      if (url) {
        addUrls([url]);
      }
    }
  }, [addUrls]);

  // Handle manual input
  const handleInputSubmit = useCallback(() => {
    if (inputValue.trim()) {
      const extractedUrls = extractUrlsFromText(inputValue);
      if (extractedUrls.length > 0) {
        addUrls(extractedUrls);
      } else {
        addUrls([inputValue.trim()]);
      }
      setInputValue('');
    }
  }, [inputValue, addUrls]);

  // Remove URL
  const removeUrl = useCallback((id: string) => {
    setUrls(prev => prev.filter(u => u.id !== id));
  }, []);

  // Submit valid URLs
  const handleSubmit = useCallback(() => {
    const validUrls = urls.filter(u => u.status === 'valid' || (u.status === 'pending' && !onValidateUrl)).map(u => u.url);
    if (validUrls.length > 0) {
      onUrlSubmit(validUrls);
    }
  }, [urls, onUrlSubmit, onValidateUrl]);

  const validUrlCount = urls.filter(u => u.status === 'valid' || (u.status === 'pending' && !onValidateUrl)).length;

  return (
    <div className={className}>
      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <Banner tone="critical" title="Import Error">
            {error}
          </Banner>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <Card>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            border: `2px dashed ${isDragOver ? '#007C89' : '#C9CCCF'}`,
            borderRadius: '8px',
            backgroundColor: isDragOver ? '#F0FCFF' : '#FAFBFB',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
          onClick={handlePaste}
        >
          <div style={{ marginBottom: '1rem' }}>
            <Icon source={ImportIcon} tone="subdued" />
          </div>
          
          <Text variant="headingSm" as="h3">
            {isDragOver ? 'Drop URLs here' : 'Import Social Media Content'}
          </Text>
          
          <div style={{ marginTop: '0.5rem' }}>
            <Text variant="bodySm" tone="subdued" as="p">
              {placeholder}
            </Text>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            {acceptedDomains.map(domain => (
              <div key={domain} style={{ 
                padding: '0.25rem 0.5rem', 
                backgroundColor: '#F1F2F3', 
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#6D7175'
              }}>
                {domain}
              </div>
            ))}
          </div>

          {/* Manual Input */}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', maxWidth: '400px', margin: '1.5rem auto 0' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleInputSubmit()}
              placeholder="Or paste URL manually..."
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #C9CCCF',
                borderRadius: '4px',
                fontSize: '14px',
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <Button size="slim" onClick={handleInputSubmit} disabled={!inputValue.trim()}>
              Add
            </Button>
          </div>
        </div>
      </Card>

      {/* URL List */}
      {urls.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <Card>
            <div style={{ padding: '1rem' }}>
              <Text variant="headingSm" as="h4">
                URLs to Import ({urls.length})
              </Text>
              
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {urls.map((urlEntry) => (
                  <div
                    key={urlEntry.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: '#FAFBFB',
                      borderRadius: '6px',
                      border: '1px solid #E1E3E5',
                    }}
                  >
                    <Icon source={LinkIcon} tone="subdued" />
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text variant="bodySm" as="p" truncate>
                        {urlEntry.url}
                      </Text>
                      {urlEntry.error && (
                        <Text variant="bodySm" tone="critical" as="p">
                          {urlEntry.error}
                        </Text>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {urlEntry.status === 'validating' && (
                        <Spinner size="small" />
                      )}
                      {urlEntry.status === 'valid' && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#008A00'
                        }} />
                      )}
                      {urlEntry.status === 'invalid' && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#D72C0D'
                        }} />
                      )}
                      
                      <Button
                        size="slim"
                        variant="tertiary"
                        icon={DeleteIcon}
                        onClick={() => removeUrl(urlEntry.id)}
                        accessibilityLabel="Remove URL"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="bodySm" tone="subdued" as="p">
                  {validUrlCount} valid URL{validUrlCount !== 1 ? 's' : ''} ready to import
                </Text>
                
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={validUrlCount === 0 || loading}
                  loading={loading}
                >
                  {`Import ${validUrlCount} URL${validUrlCount !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}