'use client';

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  ReactNode 
} from 'react';
import type { DocumentInstance, DocumentType } from './types';

const STORAGE_KEY_DOCS = 'openform_documents';
const STORAGE_KEY_TYPES = 'openform_types';

interface StorageContextType {
  documents: DocumentInstance[];
  documentTypes: DocumentType[];
  addDocument: (doc: DocumentInstance) => void;
  updateDocument: (doc: DocumentInstance) => void;
  deleteDocument: (id: string) => void;
  upsertType: (type: DocumentType) => void;
  isLoaded: boolean;
  error: string | null;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

interface StorageProviderProps {
  children: ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const [documents, setDocuments] = useState<DocumentInstance[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize storage from localStorage
  useEffect(() => {
    try {
      const storedDocs = localStorage.getItem(STORAGE_KEY_DOCS);
      const storedTypes = localStorage.getItem(STORAGE_KEY_TYPES);

      if (storedDocs) {
        const parsed = JSON.parse(storedDocs);
        if (Array.isArray(parsed)) setDocuments(parsed);
      }
      if (storedTypes) {
        const parsed = JSON.parse(storedTypes);
        if (Array.isArray(parsed)) setDocumentTypes(parsed);
      }
    } catch (err) {
      setError('Failed to load storage data');
      console.error('Storage initialization error:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persist documents to localStorage
  const saveDocuments = useCallback((docs: DocumentInstance[]) => {
    try {
      setDocuments([...docs]);
      localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(docs));
    } catch (err) {
      setError('Failed to save documents');
      console.error('Save documents error:', err);
    }
  }, []);

  // Persist document types to localStorage
  const saveTypes = useCallback((types: DocumentType[]) => {
    try {
      setDocumentTypes([...types]);
      localStorage.setItem(STORAGE_KEY_TYPES, JSON.stringify(types));
    } catch (err) {
      setError('Failed to save document types');
      console.error('Save types error:', err);
    }
  }, []);

  // Add a new document
  const addDocument = useCallback(
    (doc: DocumentInstance) => {
      const newDocs = [doc, ...documents];
      saveDocuments(newDocs);
    },
    [documents, saveDocuments]
  );

  // Update an existing document
  const updateDocument = useCallback(
    (doc: DocumentInstance) => {
      const newDocs = documents.map((d) =>
        d.document_id === doc.document_id ? doc : d
      );
      saveDocuments(newDocs);
    },
    [documents, saveDocuments]
  );

  // Delete a document by ID
  const deleteDocument = useCallback(
    (id: string) => {
      const newDocs = documents.filter((d) => d.document_id !== id);
      saveDocuments(newDocs);
    },
    [documents, saveDocuments]
  );

  // Upsert (insert or update) a document type
  const upsertType = useCallback(
    (type: DocumentType) => {
      const existingIndex = documentTypes.findIndex((t) => t.id === type.id);
      if (existingIndex > -1) {
        const newTypes = [...documentTypes];
        newTypes[existingIndex] = type;
        saveTypes(newTypes);
      } else {
        saveTypes([...documentTypes, type]);
      }
    },
    [documentTypes, saveTypes]
  );

  const value: StorageContextType = {
    documents,
    documentTypes,
    addDocument,
    updateDocument,
    deleteDocument,
    upsertType,
    isLoaded,
    error,
  };

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
}

/**
 * Hook to access OpenForm storage context
 * Must be used within StorageProvider
 * @throws Error if used outside StorageProvider
 * @returns Storage context with documents and utilities
 */
export function useOpenFormStorage(): StorageContextType {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error(
      'useOpenFormStorage must be used within a StorageProvider'
    );
  }
  return context;
}
