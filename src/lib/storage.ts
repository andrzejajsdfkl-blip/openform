'use client';

import { useState, useEffect } from 'react';
import type { DocumentInstance, DocumentType } from './types';

const STORAGE_KEY_DOCS = 'openform_documents';
const STORAGE_KEY_TYPES = 'openform_types';

export function useOpenFormStorage() {
  const [documents, setDocuments] = useState<DocumentInstance[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedDocs = localStorage.getItem(STORAGE_KEY_DOCS);
    const storedTypes = localStorage.getItem(STORAGE_KEY_TYPES);

    if (storedDocs) setDocuments(JSON.parse(storedDocs));
    if (storedTypes) setDocumentTypes(JSON.parse(storedTypes));
    
    setIsLoaded(true);
  }, []);

  const saveDocuments = (docs: DocumentInstance[]) => {
    setDocuments(docs);
    localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(docs));
  };

  const saveTypes = (types: DocumentType[]) => {
    setDocumentTypes(types);
    localStorage.setItem(STORAGE_KEY_TYPES, JSON.stringify(types));
  };

  const addDocument = (doc: DocumentInstance) => {
    const newDocs = [doc, ...documents];
    saveDocuments(newDocs);
  };

  const updateDocument = (doc: DocumentInstance) => {
    const newDocs = documents.map(d => d.document_id === doc.document_id ? doc : d);
    saveDocuments(newDocs);
  };

  const deleteDocument = (id: string) => {
    const newDocs = documents.filter(d => d.document_id !== id);
    saveDocuments(newDocs);
  };

  const upsertType = (type: DocumentType) => {
    const existingIndex = documentTypes.findIndex(t => t.id === type.id);
    if (existingIndex > -1) {
      const newTypes = [...documentTypes];
      newTypes[existingIndex] = type;
      saveTypes(newTypes);
    } else {
      saveTypes([...documentTypes, type]);
    }
  };

  return {
    documents,
    documentTypes,
    addDocument,
    updateDocument,
    deleteDocument,
    upsertType,
    isLoaded
  };
}
