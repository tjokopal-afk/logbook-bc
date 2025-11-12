// =========================================
// BUCKET CONFIGURATION REFERENCE
// Keep this file for your bucket setup reference
// =========================================

export const STORAGE_CONFIG = {
  // Bucket configurations
  buckets: {
    projectDocuments: {
      name: 'project-documents',
      description: 'Storage for project charters and documents',
      isPublic: true,
      folders: {
        projectCharters: 'project-charters',
      },
    },
    userMedia: {
      name: 'user-media',
      description: 'Storage for user photos, signatures, and media',
      isPublic: true,
      folders: {
        byUserId: '{userId}',
      },
    },
    logbookAttachments: {
      name: 'logbook-attachments',
      description: 'Storage for daily logbook entry attachments',
      isPublic: true,
      folders: {
        byUserAndDate: '{userId}/{date}',
      },
    },
    logbookPdfs: {
      name: 'logbook-pdfs',
      description: 'Storage for generated weekly logbook PDFs with signatures',
      isPublic: true,
      folders: {
        byUserAndWeek: '{userId}/week_{weekNumber}',
      },
    },
    userSignatures: {
      name: 'user-signatures',
      description: 'Storage for user and mentor signature images',
      isPublic: true,
      folders: {
        byUserId: '{userId}',
      },
    },
  },

  // File constraints
  fileConstraints: {
    projectCharter: {
      maxSize: 10 * 1024 * 1024, // 10 MB
      allowedTypes: ['application/pdf'],
      allowedExtensions: ['.pdf'],
      description: 'PDF files only, max 10 MB',
    },
    userMedia: {
      maxSize: 5 * 1024 * 1024, // 5 MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
      description: 'JPG, PNG, WebP images, max 5 MB',
    },
  },

  // Storage policies needed
  policies: {
    projectDocuments: [
      {
        name: 'Allow authenticated users to upload',
        effect: 'ALLOW',
        action: 'INSERT',
        conditions: [
          "bucket_id = 'project-documents'",
          "auth.role() = 'authenticated'",
        ],
      },
      {
        name: 'Allow public read access',
        effect: 'ALLOW',
        action: 'SELECT',
        conditions: ["bucket_id = 'project-documents'"],
      },
      {
        name: 'Allow users to delete their own files',
        effect: 'ALLOW',
        action: 'DELETE',
        conditions: [
          "bucket_id = 'project-documents'",
          "auth.uid() = owner",
        ],
      },
    ],
    userMedia: [
      {
        name: 'Allow authenticated users to upload',
        effect: 'ALLOW',
        action: 'INSERT',
        conditions: [
          "bucket_id = 'user-media'",
          "auth.role() = 'authenticated'",
        ],
      },
      {
        name: 'Allow public read access',
        effect: 'ALLOW',
        action: 'SELECT',
        conditions: ["bucket_id = 'user-media'"],
      },
      {
        name: 'Allow users to delete their own files',
        effect: 'ALLOW',
        action: 'DELETE',
        conditions: [
          "bucket_id = 'user-media'",
          "auth.uid() = owner",
        ],
      },
    ],
  },

  // Supabase URL format (for reference)
  urlFormat: {
    publicFile: 'https://{project-ref}.supabase.co/storage/v1/object/public/{bucket-name}/{file-path}',
    example: 'https://xyzabc.supabase.co/storage/v1/object/public/project-documents/project-charters/project-123/charter-1234567890-abcdef.pdf',
  },

  // Database schema
  databaseSchema: {
    profiles: {
      newColumn: {
        name: 'project_charter_url',
        type: 'TEXT',
        nullable: true,
        default: null,
        description: 'URL to the project charter PDF stored in project-documents bucket',
        example: 'https://xyzabc.supabase.co/storage/v1/object/public/project-documents/...',
      },
      index: {
        name: 'idx_profiles_project_charter_url',
        columns: ['project_charter_url'],
        type: 'BTREE',
      },
    },
  },
};

export default STORAGE_CONFIG;
